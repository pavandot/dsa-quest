import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CurriculumMap } from '@/features/curriculum/components/curriculum-map'
import { DEFAULT_COURSE_SLUG, getCourseTree } from '@/features/curriculum/server/queries'
import { getCompletedLessonIds } from '@/features/progress/server/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Learn — DSA Quest' }

export default async function LearnPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [tree, completed] = await Promise.all([
    getCourseTree(DEFAULT_COURSE_SLUG),
    getCompletedLessonIds(user.id),
  ])

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{tree.title}</h1>
        <p className="text-muted-foreground text-sm">{tree.description}</p>
      </div>
      <CurriculumMap tree={tree} completed={completed} />
    </main>
  )
}
