import { toast } from 'sonner'
import type { NewAchievement } from '@/features/achievements/types'

/** Fire a celebratory unlock toast for each newly-earned achievement. */
export function toastAchievements(achievements: NewAchievement[]) {
  for (const a of achievements) {
    toast(`🏆 Achievement unlocked: ${a.title}`, {
      description: a.xp > 0 ? `+${a.xp} XP` : undefined,
    })
  }
}
