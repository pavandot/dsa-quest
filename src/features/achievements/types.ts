/** A newly-unlocked achievement, returned by awarding and shown in toasts. */
export type NewAchievement = {
  slug: string
  title: string
  icon: string | null
  xp: number
}
