-- Phase E — Achievements: data-driven evaluation + awarding.
--
-- evaluate_achievements computes the user's current stats once, then walks every
-- active achievement they haven't earned and awards the ones whose criteria are
-- met: a user_achievements row, the achievement's XP (logged as 'achievement'),
-- and an activity_log entry. Returns the newly-earned set so the caller can
-- surface unlock toasts. Idempotent — already-earned achievements are skipped
-- via the not-exists guard and the on-conflict insert.
--
-- Criteria are jsonb {"type": ..., "count": N, ["tag": "..."]}. Adding a new
-- achievement is a seed row; adding a new *kind* of achievement is one case arm.

create or replace function public.evaluate_achievements(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_solved integer;
  v_lessons integer;
  v_chapters integer;
  v_streak integer;
  v_reviews integer;
  v_mastered integer;
  v_level integer;
  a record;
  v_meets boolean;
  v_target integer;
  v_tag text;
  v_tag_count integer;
  v_new_xp integer;
  v_earned jsonb := '[]'::jsonb;
begin
  select count(distinct problem_id) into v_solved
    from public.problem_attempts where user_id = p_user_id and verdict = 'passed';
  select count(*) into v_lessons
    from public.lesson_progress where user_id = p_user_id and status = 'completed';
  select count(*) into v_chapters
    from public.chapter_progress where user_id = p_user_id and status = 'completed';
  select coalesce(longest_streak, 0) into v_streak
    from public.streaks where user_id = p_user_id;
  select count(*) into v_reviews
    from public.xp_logs where user_id = p_user_id and source = 'review_completed';
  select count(*) into v_mastered
    from public.review_queue where user_id = p_user_id and status = 'mastered';
  select level into v_level from public.profiles where id = p_user_id;

  for a in
    select ach.id, ach.slug, ach.title, ach.icon, ach.xp_reward, ach.criteria
    from public.achievements ach
    where ach.is_active
      and not exists (
        select 1 from public.user_achievements ua
        where ua.user_id = p_user_id and ua.achievement_id = ach.id
      )
  loop
    v_target := coalesce((a.criteria ->> 'count')::integer, 1);
    case a.criteria ->> 'type'
      when 'problems_solved' then v_meets := v_solved >= v_target;
      when 'lessons_completed' then v_meets := v_lessons >= v_target;
      when 'chapters_completed' then v_meets := v_chapters >= v_target;
      when 'streak' then v_meets := v_streak >= v_target;
      when 'reviews_completed' then v_meets := v_reviews >= v_target;
      when 'problems_mastered' then v_meets := v_mastered >= v_target;
      when 'level' then v_meets := v_level >= v_target;
      when 'tag_solved' then
        v_tag := a.criteria ->> 'tag';
        select count(distinct pa.problem_id) into v_tag_count
        from public.problem_attempts pa
        join public.problems p on p.id = pa.problem_id
        where pa.user_id = p_user_id and pa.verdict = 'passed' and v_tag = any (p.tags);
        v_meets := v_tag_count >= v_target;
      else v_meets := false;
    end case;

    if v_meets then
      insert into public.user_achievements (user_id, achievement_id)
        values (p_user_id, a.id)
        on conflict do nothing;
      if a.xp_reward > 0 then
        update public.profiles
          set xp = xp + a.xp_reward, level = public.level_from_xp(xp + a.xp_reward)
          where id = p_user_id
          returning xp into v_new_xp;
        insert into public.xp_logs (user_id, amount, source, source_id)
          values (p_user_id, a.xp_reward, 'achievement', a.id);
      end if;
      insert into public.activity_logs (user_id, activity_type, metadata)
        values (p_user_id, 'achievement', jsonb_build_object('title', a.title, 'slug', a.slug));
      v_earned := v_earned || jsonb_build_object(
        'slug', a.slug, 'title', a.title, 'icon', a.icon, 'xp', a.xp_reward
      );
    end if;
  end loop;

  return v_earned;
end;
$$;

revoke all on function public.evaluate_achievements(uuid) from public, anon, authenticated;
grant execute on function public.evaluate_achievements(uuid) to service_role;
