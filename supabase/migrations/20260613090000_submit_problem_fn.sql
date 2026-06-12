-- Atomic problem submission: attempt recording, first-solve XP, streak,
-- activity log, and spaced-repetition enrollment in one transaction.

-- Shared streak maintenance (UTC day ladder), reused by future XP sources.
create or replace function public.touch_streak(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_streak record;
  v_new integer;
begin
  select * into v_streak from public.streaks where user_id = p_user_id for update;
  if not found then
    insert into public.streaks (user_id, current_streak, longest_streak, last_activity_date)
    values (p_user_id, 1, 1, v_today);
    return 1;
  end if;
  if v_streak.last_activity_date = v_today then
    v_new := v_streak.current_streak;
  elsif v_streak.last_activity_date = v_today - 1 then
    v_new := v_streak.current_streak + 1;
  else
    v_new := 1;
  end if;
  update public.streaks
    set current_streak = v_new,
        longest_streak = greatest(longest_streak, v_new),
        last_activity_date = v_today
    where user_id = p_user_id;
  return v_new;
end;
$$;

create or replace function public.submit_problem_attempt(
  p_user_id uuid,
  p_problem_id uuid,
  p_language text,
  p_code text,
  p_verdict public.attempt_verdict,
  p_passed integer,
  p_total integer,
  p_runtime_ms integer default null,
  p_test_results jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_problem record;
  v_first_solve boolean := false;
  v_xp integer := 0;
  v_streak integer;
  v_new_xp integer;
begin
  select id, title, xp_reward into v_problem
  from public.problems where id = p_problem_id;
  if not found then
    raise exception 'problem_not_found';
  end if;

  if p_verdict = 'passed' then
    v_first_solve := not exists (
      select 1 from public.problem_attempts
      where user_id = p_user_id and problem_id = p_problem_id and verdict = 'passed'
    );
  end if;

  insert into public.problem_attempts
    (user_id, problem_id, language, code, verdict, passed_count, total_count, runtime_ms, test_results)
  values
    (p_user_id, p_problem_id, p_language, p_code, p_verdict, p_passed, p_total, p_runtime_ms, p_test_results);

  if p_verdict = 'passed' and v_first_solve then
    v_xp := v_problem.xp_reward;
    update public.profiles
      set xp = xp + v_xp, level = public.level_from_xp(xp + v_xp)
      where id = p_user_id
      returning xp into v_new_xp;
    insert into public.xp_logs (user_id, amount, source, source_id)
    values (p_user_id, v_xp, 'problem_solved', p_problem_id);
    insert into public.activity_logs (user_id, activity_type, metadata)
    values (p_user_id, 'problem', jsonb_build_object('title', v_problem.title, 'problem_id', p_problem_id));
    v_streak := public.touch_streak(p_user_id);

    -- enroll in spaced repetition: first review due tomorrow
    insert into public.review_queue (user_id, problem_id, status, interval_index, due_at, last_reviewed_at)
    values (p_user_id, p_problem_id, 'learning', 0, now() + interval '1 day', now())
    on conflict (user_id, problem_id) do nothing;
  else
    select current_streak into v_streak from public.streaks where user_id = p_user_id;
    select xp into v_new_xp from public.profiles where id = p_user_id;
  end if;

  return jsonb_build_object(
    'first_solve', v_first_solve,
    'xp_awarded', v_xp,
    'total_xp', coalesce(v_new_xp, 0),
    'level', public.level_from_xp(coalesce(v_new_xp, 0)),
    'streak', coalesce(v_streak, 0)
  );
end;
$$;

revoke all on function public.touch_streak(uuid) from public, anon, authenticated;
revoke all on function public.submit_problem_attempt(uuid, uuid, text, text, public.attempt_verdict, integer, integer, integer, jsonb) from public, anon, authenticated;
grant execute on function public.touch_streak(uuid) to service_role;
grant execute on function public.submit_problem_attempt(uuid, uuid, text, text, public.attempt_verdict, integer, integer, integer, jsonb) to service_role;
