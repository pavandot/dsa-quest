-- DSA Quest — initial schema
-- Layers: enums → curriculum → identity → progress → spaced repetition →
--         gamification → functions/triggers → RLS → indexes
--
-- Security model: curriculum is world-readable and admin-writable. User data
-- is readable only by its owner (and admins). Progress/XP/streak tables have
-- NO insert/update policies for authenticated users — all writes happen via
-- server actions using the service role, so clients cannot forge progress.

-- ============================================================ enums

create type public.user_role as enum ('student', 'admin');
create type public.lesson_type as enum ('theory', 'example', 'quiz', 'practice', 'revision');
create type public.difficulty as enum ('easy', 'medium', 'hard');
create type public.progress_status as enum ('not_started', 'in_progress', 'completed');
create type public.mastery_status as enum ('new', 'learning', 'practicing', 'mastered');
create type public.attempt_verdict as enum ('passed', 'failed', 'error', 'timeout');

-- ============================================================ curriculum

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.phases (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null,
  slug text not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  unique (course_id, position) deferrable initially deferred
);

create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.phases (id) on delete cascade,
  position integer not null,
  slug text not null,
  title text not null,
  description text,
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, slug),
  unique (phase_id, position) deferrable initially deferred
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  position integer not null,
  slug text not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_id, slug),
  unique (week_id, position) deferrable initially deferred
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  position integer not null,
  slug text not null,
  title text not null,
  type public.lesson_type not null,
  -- ordered rich-content blocks: text/code/visualization/callout, etc.
  content jsonb not null default '[]'::jsonb,
  xp_reward integer not null default 10 check (xp_reward >= 0),
  estimated_minutes integer not null default 5 check (estimated_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, slug),
  unique (chapter_id, position) deferrable initially deferred
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons (id) on delete cascade,
  title text not null,
  pass_threshold integer not null default 70 check (pass_threshold between 0 and 100),
  -- [{prompt, options: [..], correct_index, explanation}]
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  difficulty public.difficulty not null,
  tags text[] not null default '{}',
  description_md text not null,
  hints jsonb not null default '[]'::jsonb,
  function_name text not null,
  -- keyed by language: {"javascript": "function twoSum(nums, target) {...}"}
  starter_code jsonb not null default '{}'::jsonb,
  solution_code jsonb not null default '{}'::jsonb,
  -- [{input: [...], expected: ..., hidden: bool}]
  test_cases jsonb not null default '[]'::jsonb,
  time_limit_ms integer not null default 5000 check (time_limit_ms between 100 and 30000),
  xp_reward integer not null default 25 check (xp_reward >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- m2m: revision lessons reuse problems from earlier lessons
create table public.lesson_problems (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete cascade,
  position integer not null default 1,
  is_required boolean not null default true,
  primary key (lesson_id, problem_id)
);

-- ============================================================ identity

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 30),
  display_name text,
  avatar_url text,
  role public.user_role not null default 'student',
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================ progress

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status public.progress_status not null default 'in_progress',
  quiz_score integer check (quiz_score between 0 and 100),
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, lesson_id)
);

create table public.chapter_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  status public.progress_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, chapter_id)
);

create table public.week_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_id uuid not null references public.weeks (id) on delete cascade,
  status public.progress_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, week_id)
);

create table public.phase_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  phase_id uuid not null references public.phases (id) on delete cascade,
  status public.progress_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, phase_id)
);

create table public.problem_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete cascade,
  language text not null default 'javascript',
  code text not null,
  verdict public.attempt_verdict not null,
  passed_count integer not null default 0,
  total_count integer not null default 0,
  runtime_ms integer,
  memory_kb integer,
  -- per-test outcomes (hidden tests redacted before storage)
  test_results jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================ spaced repetition

create table public.review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete cascade,
  status public.mastery_status not null default 'new',
  -- index into the ladder [1, 3, 7, 14, 30] days
  interval_index integer not null default 0 check (interval_index between 0 and 4),
  due_at timestamptz not null,
  last_reviewed_at timestamptz,
  lapses integer not null default 0 check (lapses >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, problem_id)
);

-- ============================================================ gamification

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon text,
  category text not null default 'general',
  xp_reward integer not null default 0 check (xp_reward >= 0),
  -- machine-checkable rule, e.g. {"type":"problems_solved","count":1}
  criteria jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.streaks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_activity_date date,
  updated_at timestamptz not null default now()
);

create table public.xp_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  source text not null, -- lesson_completed | problem_solved | quiz_passed | achievement | review_completed
  source_id uuid,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_type text not null, -- lesson | problem | quiz | review
  activity_date date not null default (timezone('utc', now()))::date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================ functions & triggers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'courses', 'phases', 'weeks', 'chapters', 'lessons', 'quizzes',
    'problems', 'profiles', 'review_queue', 'streaks'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- auto-provision profile + streak row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text := coalesce(nullif(split_part(new.email, '@', 1), ''), 'user');
  candidate text;
begin
  base := lower(regexp_replace(base, '[^a-zA-Z0-9_]', '_', 'g'));
  if char_length(base) < 3 then
    base := rpad(base, 3, '0');
  end if;
  base := left(base, 24);
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := base || '_' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data ->> 'full_name', base),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- users may update their profile, but never their own role/xp/level
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() is null for service-role / direct connections, which are trusted
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.xp := old.xp;
    new.level := old.level;
  end if;
  return new;
end;
$$;

create trigger protect_profile_columns
before update on public.profiles
for each row execute function public.protect_profile_columns();

-- ============================================================ row level security

do $$
declare
  t text;
begin
  foreach t in array array[
    'courses', 'phases', 'weeks', 'chapters', 'lessons', 'quizzes', 'problems',
    'lesson_problems', 'profiles', 'lesson_progress', 'chapter_progress',
    'week_progress', 'phase_progress', 'problem_attempts', 'review_queue',
    'achievements', 'user_achievements', 'streaks', 'xp_logs', 'activity_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- curriculum + achievements: world-readable, admin-writable
do $$
declare
  t text;
begin
  foreach t in array array[
    'courses', 'phases', 'weeks', 'chapters', 'lessons', 'quizzes', 'problems',
    'lesson_problems', 'achievements'
  ] loop
    execute format(
      'create policy "public read" on public.%I for select using (true)', t);
    execute format(
      'create policy "admin write" on public.%I for all
       using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end;
$$;

-- profiles: read own (admins read all), update own (privileged cols trigger-guarded)
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- user-owned data: owner + admin may read; ONLY the service role writes
do $$
declare
  t text;
begin
  foreach t in array array[
    'lesson_progress', 'chapter_progress', 'week_progress', 'phase_progress',
    'problem_attempts', 'review_queue', 'user_achievements', 'streaks',
    'xp_logs', 'activity_logs'
  ] loop
    execute format(
      'create policy "read own" on public.%I for select
       using (user_id = auth.uid() or public.is_admin())', t);
  end loop;
end;
$$;

-- ============================================================ indexes
-- (composite uniques above already index the leading FK column)

create index lesson_problems_problem_id_idx on public.lesson_problems (problem_id);
create index lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);
create index chapter_progress_chapter_id_idx on public.chapter_progress (chapter_id);
create index week_progress_week_id_idx on public.week_progress (week_id);
create index phase_progress_phase_id_idx on public.phase_progress (phase_id);
create index problem_attempts_user_recent_idx on public.problem_attempts (user_id, created_at desc);
create index problem_attempts_user_problem_idx on public.problem_attempts (user_id, problem_id);
create index problem_attempts_problem_id_idx on public.problem_attempts (problem_id);
create index review_queue_user_due_idx on public.review_queue (user_id, due_at);
create index review_queue_problem_id_idx on public.review_queue (problem_id);
create index user_achievements_achievement_id_idx on public.user_achievements (achievement_id);
create index xp_logs_user_recent_idx on public.xp_logs (user_id, created_at desc);
create index xp_logs_source_id_idx on public.xp_logs (source_id);
create index activity_logs_user_date_idx on public.activity_logs (user_id, activity_date desc);
create index problems_difficulty_idx on public.problems (difficulty);
create index problems_tags_idx on public.problems using gin (tags);
