import 'server-only'
import { createClient } from '@/lib/supabase/server'

type Criteria = { type: string; count?: number; tag?: string }

export type AchievementView = {
  slug: string
  title: string
  description: string
  icon: string | null
  category: string
  xpReward: number
  target: number
  current: number
  earned: boolean
  earnedAt: string | null
}

export type AchievementsData = {
  groups: { category: string; items: AchievementView[] }[]
  earnedCount: number
  total: number
  xpFromAchievements: number
}

const CATEGORY_ORDER = ['Solving', 'Learning', 'Streaks', 'Mastery', 'Progression', 'Patterns']

/**
 * Every achievement with the user's progress toward it. Progress mirrors the
 * criteria evaluated in evaluate_achievements (read-only here), so locked cards
 * can show "3 / 10". Reads run under RLS — own rows only.
 */
export async function getAchievements(userId: string): Promise<AchievementsData> {
  const supabase = await createClient()

  const [
    achievementsRes,
    earnedRes,
    profileRes,
    streakRes,
    lessonsRes,
    chaptersRes,
    masteredRes,
    reviewsRes,
    solvedRes,
  ] = await Promise.all([
    supabase
      .from('achievements')
      .select('id, slug, title, description, icon, category, xp_reward, criteria')
      .eq('is_active', true),
    supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId),
    supabase.from('profiles').select('level').eq('id', userId).single(),
    supabase.from('streaks').select('longest_streak').eq('user_id', userId).maybeSingle(),
    supabase
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('chapter_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('review_queue')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'mastered'),
    supabase
      .from('xp_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source', 'review_completed'),
    supabase
      .from('problem_attempts')
      .select('problem_id, problems (tags)')
      .eq('user_id', userId)
      .eq('verdict', 'passed'),
  ])

  if (achievementsRes.error) throw new Error(`getAchievements: ${achievementsRes.error.message}`)

  const earnedAtById = new Map(
    (earnedRes.data ?? []).map((r) => [r.achievement_id, r.earned_at])
  )

  // distinct solved problems + per-tag distinct counts (an attempt row per submit)
  const solvedIds = new Set<string>()
  const tagCounts = new Map<string, number>()
  for (const row of solvedRes.data ?? []) {
    if (solvedIds.has(row.problem_id)) continue
    solvedIds.add(row.problem_id)
    for (const tag of row.problems?.tags ?? []) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }

  const stats: Record<string, number> = {
    problems_solved: solvedIds.size,
    lessons_completed: lessonsRes.count ?? 0,
    chapters_completed: chaptersRes.count ?? 0,
    streak: streakRes.data?.longest_streak ?? 0,
    reviews_completed: reviewsRes.count ?? 0,
    problems_mastered: masteredRes.count ?? 0,
    level: profileRes.data?.level ?? 1,
  }
  const currentFor = (c: Criteria): number =>
    c.type === 'tag_solved' ? (tagCounts.get(c.tag ?? '') ?? 0) : (stats[c.type] ?? 0)

  const byCategory = new Map<string, AchievementView[]>()
  let earnedCount = 0
  let xpFromAchievements = 0

  for (const a of achievementsRes.data) {
    const criteria = a.criteria as Criteria
    const target = criteria.count ?? 1
    const earnedAt = earnedAtById.get(a.id) ?? null
    const earned = earnedAt !== null
    if (earned) {
      earnedCount++
      xpFromAchievements += a.xp_reward
    }
    const view: AchievementView = {
      slug: a.slug,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      xpReward: a.xp_reward,
      target,
      current: Math.min(currentFor(criteria), target),
      earned,
      earnedAt,
    }
    const list = byCategory.get(a.category) ?? []
    list.push(view)
    byCategory.set(a.category, list)
  }

  const groups = [...byCategory.entries()]
    .map(([category, items]) => ({
      category,
      items: items.sort((x, y) => x.target - y.target || x.xpReward - y.xpReward),
    }))
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category)
      const bi = CATEGORY_ORDER.indexOf(b.category)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

  return { groups, earnedCount, total: achievementsRes.data.length, xpFromAchievements }
}
