-- Atomic lesson completion: unlock validation, progress upsert, one-time XP,
-- streak maintenance, activity log, and chapter/week/phase rollups in a single
-- transaction. Callable only by the service role (server actions).

-- Mirror of the level curve in src/features/gamification/levels.ts:
-- clearing level n costs 100 + 50*(n-1) XP.
create or replace function public.level_from_xp(p_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  v_level integer := 1;
  v_remaining integer := greatest(p_xp, 0);
  v_step integer;
begin
  loop
    v_step := 100 + 50 * (v_level - 1);
    exit when v_remaining < v_step;
    v_remaining := v_remaining - v_step;
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

create or replace function public.complete_lesson(
  p_user_id uuid,
  p_lesson_id uuid,
  p_quiz_score integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lesson record;
  v_pass_threshold integer;
  v_target_rn bigint;
  v_frontier bigint;
  v_already boolean;
  v_xp integer := 0;
  v_today date := (now() at time zone 'utc')::date;
  v_streak record;
  v_new_streak integer;
  v_new_xp integer;
begin
  select l.id, l.xp_reward, l.type, l.title, l.chapter_id, c.week_id, w.phase_id
    into v_lesson
  from public.lessons l
  join public.chapters c on c.id = l.chapter_id
  join public.weeks w on w.id = c.week_id
  where l.id = p_lesson_id;
  if not found then
    raise exception 'lesson_not_found';
  end if;

  -- quiz lessons require a passing score (threshold from the quiz row, default 70)
  if v_lesson.type = 'quiz' then
    select q.pass_threshold into v_pass_threshold
    from public.quizzes q where q.lesson_id = p_lesson_id;
    if v_pass_threshold is not null and coalesce(p_quiz_score, 0) < v_pass_threshold then
      raise exception 'quiz_score_below_threshold';
    end if;
  end if;

  -- sequential unlock: a lesson may be completed only at or behind the frontier
  with ordered as (
    select l.id,
           row_number() over (order by p.position, w.position, c.position, l.position) as rn
    from public.lessons l
    join public.chapters c on c.id = l.chapter_id
    join public.weeks w on w.id = c.week_id
    join public.phases p on p.id = w.phase_id
  ),
  frontier as (
    select coalesce(min(o.rn), (select max(rn) + 1 from ordered)) as f
    from ordered o
    where not exists (
      select 1 from public.lesson_progress lp
      where lp.user_id = p_user_id and lp.lesson_id = o.id and lp.status = 'completed'
    )
  )
  select o.rn, f.f into v_target_rn, v_frontier
  from ordered o, frontier f
  where o.id = p_lesson_id;

  if v_target_rn > v_frontier then
    raise exception 'lesson_locked';
  end if;

  v_already := exists (
    select 1 from public.lesson_progress
    where user_id = p_user_id and lesson_id = p_lesson_id and status = 'completed'
  );

  insert into public.lesson_progress (user_id, lesson_id, status, quiz_score, completed_at)
  values (p_user_id, p_lesson_id, 'completed', p_quiz_score, now())
  on conflict (user_id, lesson_id) do update
    set status = 'completed',
        quiz_score = coalesce(excluded.quiz_score, public.lesson_progress.quiz_score),
        completed_at = coalesce(public.lesson_progress.completed_at, excluded.completed_at);

  if not v_already then
    v_xp := v_lesson.xp_reward;

    update public.profiles
      set xp = xp + v_xp,
          level = public.level_from_xp(xp + v_xp)
      where id = p_user_id
      returning xp into v_new_xp;

    insert into public.xp_logs (user_id, amount, source, source_id)
    values (p_user_id, v_xp, 'lesson_completed', p_lesson_id);

    insert into public.activity_logs (user_id, activity_type, metadata)
    values (p_user_id, 'lesson', jsonb_build_object('title', v_lesson.title, 'lesson_id', p_lesson_id));

    select * into v_streak from public.streaks where user_id = p_user_id for update;
    if v_streak.last_activity_date = v_today then
      v_new_streak := v_streak.current_streak;
    elsif v_streak.last_activity_date = v_today - 1 then
      v_new_streak := v_streak.current_streak + 1;
    else
      v_new_streak := 1;
    end if;
    update public.streaks
      set current_streak = v_new_streak,
          longest_streak = greatest(longest_streak, v_new_streak),
          last_activity_date = v_today
      where user_id = p_user_id;
  else
    select current_streak into v_new_streak from public.streaks where user_id = p_user_id;
    select xp into v_new_xp from public.profiles where id = p_user_id;
  end if;

  -- rollups: chapter → week → phase, each "all lessons beneath completed"
  if not exists (
    select 1 from public.lessons l
    where l.chapter_id = v_lesson.chapter_id
      and not exists (
        select 1 from public.lesson_progress lp
        where lp.user_id = p_user_id and lp.lesson_id = l.id and lp.status = 'completed'
      )
  ) then
    insert into public.chapter_progress (user_id, chapter_id, status, completed_at)
    values (p_user_id, v_lesson.chapter_id, 'completed', now())
    on conflict (user_id, chapter_id) do update
      set status = 'completed',
          completed_at = coalesce(public.chapter_progress.completed_at, excluded.completed_at);
  end if;

  if not exists (
    select 1 from public.lessons l
    join public.chapters c on c.id = l.chapter_id
    where c.week_id = v_lesson.week_id
      and not exists (
        select 1 from public.lesson_progress lp
        where lp.user_id = p_user_id and lp.lesson_id = l.id and lp.status = 'completed'
      )
  ) then
    insert into public.week_progress (user_id, week_id, status, completed_at)
    values (p_user_id, v_lesson.week_id, 'completed', now())
    on conflict (user_id, week_id) do update
      set status = 'completed',
          completed_at = coalesce(public.week_progress.completed_at, excluded.completed_at);
  end if;

  if not exists (
    select 1 from public.lessons l
    join public.chapters c on c.id = l.chapter_id
    join public.weeks w on w.id = c.week_id
    where w.phase_id = v_lesson.phase_id
      and not exists (
        select 1 from public.lesson_progress lp
        where lp.user_id = p_user_id and lp.lesson_id = l.id and lp.status = 'completed'
      )
  ) then
    insert into public.phase_progress (user_id, phase_id, status, completed_at)
    values (p_user_id, v_lesson.phase_id, 'completed', now())
    on conflict (user_id, phase_id) do update
      set status = 'completed',
          completed_at = coalesce(public.phase_progress.completed_at, excluded.completed_at);
  end if;

  return jsonb_build_object(
    'xp_awarded', v_xp,
    'already_completed', v_already,
    'total_xp', v_new_xp,
    'level', public.level_from_xp(v_new_xp),
    'streak', v_new_streak
  );
end;
$$;

-- service-role only: completion always flows through trusted server actions
revoke all on function public.complete_lesson(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.level_from_xp(integer) from public, anon, authenticated;
grant execute on function public.complete_lesson(uuid, uuid, integer) to service_role;
grant execute on function public.level_from_xp(integer) to service_role;
