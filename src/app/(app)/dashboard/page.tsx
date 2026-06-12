import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ContinueLearningCard } from '@/features/dashboard/components/continue-learning-card'
import { RecentActivity } from '@/features/dashboard/components/recent-activity'
import { StatCards } from '@/features/dashboard/components/stat-cards'
import { StudyHeatmap } from '@/features/dashboard/components/study-heatmap'
import { UpcomingLessons } from '@/features/dashboard/components/upcoming-lessons'
import { DEFAULT_COURSE_SLUG, getCourseTree } from '@/features/curriculum/server/queries'
import {
  getActivityHeatmap,
  getProfile,
  getRecentActivity,
  getReviewsDueCount,
  getStreak,
} from '@/features/dashboard/server/queries'
import { computeResumePoint, getCompletedLessonIds } from '@/features/progress/server/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Dashboard — DSA Quest' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [tree, profile, streak, completed, reviewsDue, heatmap, recent] = await Promise.all([
    getCourseTree(DEFAULT_COURSE_SLUG),
    getProfile(user.id),
    getStreak(user.id),
    getCompletedLessonIds(user.id),
    getReviewsDueCount(user.id),
    getActivityHeatmap(user.id),
    getRecentActivity(user.id),
  ])

  const resume = computeResumePoint(tree, completed)
  const firstName = (profile.display_name ?? profile.username).split(' ')[0]

  return (
    <main className="mx-auto grid max-w-6xl gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground text-sm">
          {reviewsDue > 0
            ? `You have ${reviewsDue} review${reviewsDue === 1 ? '' : 's'} due — knock those out first.`
            : resume.isCourseComplete
              ? 'Everything is complete. You absolute legend.'
              : `You're on Week ${resume.current.week.position}: ${resume.current.week.title}.`}
        </p>
      </div>

      <ContinueLearningCard resume={resume} />

      <StatCards
        streak={streak.current_streak}
        xp={profile.xp}
        reviewsDue={reviewsDue}
        completedLessons={resume.completedCount}
        totalLessons={resume.totalLessons}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingLessons upcoming={resume.upcoming} />
        <RecentActivity rows={recent} />
      </div>

      <StudyHeatmap activity={heatmap} />
    </main>
  )
}
