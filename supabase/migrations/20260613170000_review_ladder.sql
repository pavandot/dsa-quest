-- Phase E — Reviews: spaced-repetition ladder advancement.
--
-- Re-solving a problem whose review is DUE (due_at <= now) resolves that review
-- in the same submit path: a pass advances the 1/3/7/14/30-day ladder and the
-- mastery status (learning → practicing → mastered); a fail lapses it back to
-- the start of the ladder. The `due_at <= now` guard means exactly one review
-- event per due window — repeated same-sitting submits don't re-trigger it,
-- so a user iterating on a fix can't rack up phantom lapses.
--
-- A just-enrolled first solve has due_at = tomorrow, so it never matches the
-- due-review block on the same call: first-solve XP and review XP are disjoint.

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
  -- review processing
  v_ladder integer[] := array[1, 3, 7, 14, 30];
  v_review record;
  v_new_index integer;
  v_status public.mastery_status;
  v_review_xp integer := 0;
  v_review_advanced boolean := false;
  v_review_lapsed boolean := false;
  v_review_due timestamptz;
  v_review_status public.mastery_status;
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

  -- resolve a DUE review (never the row we may have just enrolled — that's due tomorrow)
  select * into v_review
  from public.review_queue
  where user_id = p_user_id and problem_id = p_problem_id and due_at <= now()
  for update;

  if found then
    if p_verdict = 'passed' then
      v_new_index := least(v_review.interval_index + 1, array_length(v_ladder, 1) - 1);
      v_status := case
        when v_new_index >= 4 then 'mastered'
        when v_new_index >= 2 then 'practicing'
        else 'learning'
      end;
      -- base review XP, with a mastery-completion bonus
      v_review_xp := case when v_status = 'mastered' and v_review.status <> 'mastered' then 25 else 10 end;

      update public.review_queue
        set interval_index = v_new_index,
            status = v_status,
            due_at = now() + make_interval(days => v_ladder[v_new_index + 1]),
            last_reviewed_at = now()
        where id = v_review.id
        returning due_at, status into v_review_due, v_review_status;

      update public.profiles
        set xp = xp + v_review_xp, level = public.level_from_xp(xp + v_review_xp)
        where id = p_user_id
        returning xp into v_new_xp;
      insert into public.xp_logs (user_id, amount, source, source_id)
      values (p_user_id, v_review_xp, 'review_completed', p_problem_id);
      insert into public.activity_logs (user_id, activity_type, metadata)
      values (p_user_id, 'review', jsonb_build_object('title', v_problem.title, 'problem_id', p_problem_id, 'mastery', v_status));
      v_streak := public.touch_streak(p_user_id);
      v_review_advanced := true;
    else
      update public.review_queue
        set interval_index = 0,
            status = 'learning',
            due_at = now() + interval '1 day',
            lapses = lapses + 1,
            last_reviewed_at = now()
        where id = v_review.id
        returning due_at, status into v_review_due, v_review_status;
      v_review_lapsed := true;
    end if;
  end if;

  return jsonb_build_object(
    'first_solve', v_first_solve,
    'xp_awarded', v_xp,
    'review_xp', v_review_xp,
    'review_advanced', v_review_advanced,
    'review_lapsed', v_review_lapsed,
    'review_status', v_review_status,
    'review_due_at', v_review_due,
    'total_xp', coalesce(v_new_xp, 0),
    'level', public.level_from_xp(coalesce(v_new_xp, 0)),
    'streak', coalesce(v_streak, 0)
  );
end;
$$;

revoke all on function public.submit_problem_attempt(uuid, uuid, text, text, public.attempt_verdict, integer, integer, integer, jsonb) from public, anon, authenticated;
grant execute on function public.submit_problem_attempt(uuid, uuid, text, text, public.attempt_verdict, integer, integer, integer, jsonb) to service_role;
