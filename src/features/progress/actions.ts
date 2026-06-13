'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { awardAchievements, type NewAchievement } from '@/features/achievements/server/award'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type CompleteLessonResult =
  | {
      ok: true
      xpAwarded: number
      totalXp: number
      level: number
      streak: number
      alreadyCompleted: boolean
      newAchievements: NewAchievement[]
    }
  | { ok: false; error: string }

const inputSchema = z.object({
  lessonId: z.uuid(),
  quizScore: z.number().int().min(0).max(100).optional(),
})

export async function completeLesson(input: {
  lessonId: string
  quizScore?: number
}): Promise<CompleteLessonResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid input' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  // service role: the SQL function revalidates the unlock and is the only writer
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('complete_lesson', {
    p_user_id: user.id,
    p_lesson_id: parsed.data.lessonId,
    p_quiz_score: parsed.data.quizScore,
  })

  if (error) {
    if (error.message.includes('lesson_locked')) {
      return { ok: false, error: 'This lesson is still locked.' }
    }
    if (error.message.includes('quiz_score_below_threshold')) {
      return { ok: false, error: 'Score below the pass threshold — review and retry.' }
    }
    console.error('completeLesson:', error.message)
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  const result = data as {
    xp_awarded: number
    already_completed: boolean
    total_xp: number
    level: number
    streak: number
  }

  const newAchievements = await awardAchievements(user.id)

  revalidatePath('/dashboard')
  revalidatePath('/learn', 'layout')
  if (newAchievements.length > 0) revalidatePath('/achievements')

  return {
    ok: true,
    xpAwarded: result.xp_awarded,
    totalXp: result.total_xp,
    level: result.level,
    streak: result.streak,
    alreadyCompleted: result.already_completed,
    newAchievements,
  }
}
