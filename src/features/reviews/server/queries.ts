import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type MasteryStatus = 'new' | 'learning' | 'practicing' | 'mastered'

export type ReviewItem = {
  problemId: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  xpReward: number
  status: MasteryStatus
  intervalIndex: number
  lapses: number
  dueAt: string
  lastReviewedAt: string | null
}

export type ReviewQueue = {
  due: ReviewItem[]
  upcoming: ReviewItem[]
  counts: {
    total: number
    due: number
    learning: number
    practicing: number
    mastered: number
  }
}

/**
 * The full spaced-repetition queue for a user, split into reviews that are due
 * now and ones scheduled for later, each ordered by due date. Read under RLS
 * (the owner-read policy on review_queue), so it only ever returns own rows.
 */
export async function getReviewQueue(userId: string): Promise<ReviewQueue> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('review_queue')
    .select(
      'problem_id, status, interval_index, lapses, due_at, last_reviewed_at, problems (slug, title, difficulty, tags, xp_reward)'
    )
    .eq('user_id', userId)
    .order('due_at')
  if (error) throw new Error(`getReviewQueue: ${error.message}`)

  const now = Date.now()
  const due: ReviewItem[] = []
  const upcoming: ReviewItem[] = []
  const counts = { total: 0, due: 0, learning: 0, practicing: 0, mastered: 0 }

  for (const row of data) {
    const problem = row.problems
    if (!problem) continue
    const item: ReviewItem = {
      problemId: row.problem_id,
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.tags,
      xpReward: problem.xp_reward,
      status: row.status,
      intervalIndex: row.interval_index,
      lapses: row.lapses,
      dueAt: row.due_at,
      lastReviewedAt: row.last_reviewed_at,
    }
    counts.total++
    if (item.status === 'learning') counts.learning++
    else if (item.status === 'practicing') counts.practicing++
    else if (item.status === 'mastered') counts.mastered++

    if (new Date(item.dueAt).getTime() <= now) {
      counts.due++
      due.push(item)
    } else {
      upcoming.push(item)
    }
  }

  return { due, upcoming, counts }
}
