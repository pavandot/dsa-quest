'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type SubmitResult =
  | {
      ok: true
      firstSolve: boolean
      xpAwarded: number
      totalXp: number
      level: number
      streak: number
    }
  | { ok: false; error: string }

const inputSchema = z.object({
  problemId: z.uuid(),
  language: z.literal('javascript'),
  code: z.string().min(1).max(50_000),
  verdict: z.enum(['passed', 'failed', 'error', 'timeout']),
  passedCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  runtimeMs: z.number().int().min(0).nullable(),
  // compact per-test outcomes; outputs are not persisted
  testResults: z.array(z.object({ passed: z.boolean(), timeMs: z.number(), hidden: z.boolean() })),
})

export async function submitAttempt(input: z.infer<typeof inputSchema>): Promise<SubmitResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid submission' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('submit_problem_attempt', {
    p_user_id: user.id,
    p_problem_id: parsed.data.problemId,
    p_language: parsed.data.language,
    p_code: parsed.data.code,
    p_verdict: parsed.data.verdict,
    p_passed: parsed.data.passedCount,
    p_total: parsed.data.totalCount,
    p_runtime_ms: parsed.data.runtimeMs ?? undefined,
    p_test_results: parsed.data.testResults,
  })
  if (error) {
    console.error('submitAttempt:', error.message)
    return { ok: false, error: 'Could not record your submission. Please try again.' }
  }

  const result = data as {
    first_solve: boolean
    xp_awarded: number
    total_xp: number
    level: number
    streak: number
  }

  revalidatePath('/practice', 'layout')
  revalidatePath('/dashboard')
  revalidatePath('/reviews')

  return {
    ok: true,
    firstSolve: result.first_solve,
    xpAwarded: result.xp_awarded,
    totalXp: result.total_xp,
    level: result.level,
    streak: result.streak,
  }
}
