import 'server-only'
import { createStaticClient } from '@/lib/supabase/static'
import { createClient } from '@/lib/supabase/server'
import type { TestCase } from '@/features/problems/executor/types'

/** Problem payload for the workspace. Never includes solution_code. */
export type WorkspaceProblem = {
  id: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  description_md: string
  hints: string[]
  functionName: string
  starterCode: string
  timeLimitMs: number
  xpReward: number
  testCases: TestCase[]
}

export async function getWorkspaceProblem(slug: string): Promise<WorkspaceProblem | null> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('problems')
    .select(
      'id, slug, title, difficulty, tags, description_md, hints, function_name, starter_code, time_limit_ms, xp_reward, test_cases'
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw new Error(`getWorkspaceProblem: ${error.message}`)
  if (!data) return null

  const starter = (data.starter_code ?? {}) as Record<string, string>
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    difficulty: data.difficulty,
    tags: data.tags,
    description_md: data.description_md,
    hints: (data.hints ?? []) as string[],
    functionName: data.function_name,
    starterCode: starter['javascript'] ?? `function solve() {\n  // your code here\n}\n`,
    timeLimitMs: data.time_limit_ms,
    xpReward: data.xp_reward,
    testCases: (data.test_cases ?? []) as TestCase[],
  }
}

export async function listProblems() {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('problems')
    .select('id, slug, title, difficulty, tags, xp_reward')
    .eq('is_published', true)
    .order('difficulty')
    .order('title')
  if (error) throw new Error(`listProblems: ${error.message}`)
  return data
}

/** Problem ids the user has ever passed. */
export async function getSolvedProblemIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('problem_attempts')
    .select('problem_id')
    .eq('user_id', userId)
    .eq('verdict', 'passed')
  if (error) throw new Error(`getSolvedProblemIds: ${error.message}`)
  return new Set(data.map((r) => r.problem_id))
}

/** Problems linked to a lesson, for practice-lesson pages. */
export async function getLessonProblems(lessonId: string) {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('lesson_problems')
    .select('position, is_required, problems (id, slug, title, difficulty, xp_reward)')
    .eq('lesson_id', lessonId)
    .order('position')
  if (error) throw new Error(`getLessonProblems: ${error.message}`)
  return data
    .map((row) => ({ ...row.problems, position: row.position, isRequired: row.is_required }))
    .filter((p) => p.id)
}
