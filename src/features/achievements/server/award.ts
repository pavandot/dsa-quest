import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type { NewAchievement } from '@/features/achievements/types'
import type { NewAchievement } from '@/features/achievements/types'

/**
 * Evaluates and awards any achievements the user has newly earned, returning
 * the unlocked set. Safe to call after any progress mutation — the SQL side is
 * idempotent. Never throws into the caller: awarding is a side reward, so a
 * failure here must not fail the underlying action.
 */
export async function awardAchievements(userId: string): Promise<NewAchievement[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('evaluate_achievements', { p_user_id: userId })
  if (error) {
    console.error('awardAchievements:', error.message)
    return []
  }
  return (data ?? []) as NewAchievement[]
}
