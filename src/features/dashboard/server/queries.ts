import 'server-only'
import { createClient } from '@/lib/supabase/server'

export async function getProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, xp, level, role')
    .eq('id', userId)
    .single()
  if (error) throw new Error(`getProfile: ${error.message}`)
  return data
}

export async function getStreak(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .maybeSingle()
  return data ?? { current_streak: 0, longest_streak: 0, last_activity_date: null }
}

export async function getReviewsDueCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('review_queue')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('due_at', new Date().toISOString())
  return count ?? 0
}

export type ActivityDay = { date: string; count: number }

/** Daily activity counts for the heatmap, most recent ~17 weeks. */
export async function getActivityHeatmap(userId: string, days = 119): Promise<ActivityDay[]> {
  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase
    .from('activity_logs')
    .select('activity_date')
    .eq('user_id', userId)
    .gte('activity_date', since.toISOString().slice(0, 10))
  if (error) throw new Error(`getActivityHeatmap: ${error.message}`)

  const counts = new Map<string, number>()
  for (const row of data) {
    counts.set(row.activity_date, (counts.get(row.activity_date) ?? 0) + 1)
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count }))
}

export async function getRecentActivity(userId: string, limit = 8) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, activity_type, activity_date, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`getRecentActivity: ${error.message}`)
  return data
}
