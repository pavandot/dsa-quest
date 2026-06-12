import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DEFAULT_COURSE_SLUG,
  flattenLessons,
  getCourseTree,
  type FlatLesson,
} from '@/features/curriculum/server/queries'
import { BlockRenderer } from '@/features/lessons/components/block-renderer'
import { CompleteButton } from '@/features/lessons/components/complete-button'
import { QuizRunner } from '@/features/lessons/components/quiz-runner'
import { getLessonContent, getQuiz } from '@/features/lessons/server/queries'
import { LessonProblemList } from '@/features/problems/components/lesson-problem-list'
import { getLessonProblems, getSolvedProblemIds } from '@/features/problems/server/queries'
import { getCompletedLessonIds } from '@/features/progress/server/queries'
import { createClient } from '@/lib/supabase/server'

type Params = { weekSlug: string; chapterSlug: string; lessonSlug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lessonSlug } = await params
  return { title: `${lessonSlug} — DSA Quest` }
}

function hrefFor(f: FlatLesson): string {
  return `/learn/${f.week.slug}/${f.chapter.slug}/${f.lesson.slug}`
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { weekSlug, chapterSlug, lessonSlug } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tree = await getCourseTree(DEFAULT_COURSE_SLUG)
  const flat = flattenLessons(tree)
  const target = flat.find(
    (f) =>
      f.week.slug === weekSlug && f.chapter.slug === chapterSlug && f.lesson.slug === lessonSlug
  )
  if (!target) notFound()

  const completed = await getCompletedLessonIds(user.id)
  const frontierIndex = flat.find((f) => !completed.has(f.lesson.id))?.index ?? flat.length
  if (target.index > frontierIndex) redirect('/learn')

  const isCompleted = completed.has(target.lesson.id)
  const next = flat[target.index + 1]
  const prev = flat[target.index - 1]
  const nextHref = next ? hrefFor(next) : '/learn'

  const [blocks, quiz, lessonProblems, solvedIds] = await Promise.all([
    getLessonContent(target.lesson.id),
    target.lesson.type === 'quiz' ? getQuiz(target.lesson.id) : Promise.resolve(null),
    target.lesson.type === 'practice' || target.lesson.type === 'revision'
      ? getLessonProblems(target.lesson.id)
      : Promise.resolve([]),
    target.lesson.type === 'practice' || target.lesson.type === 'revision'
      ? getSolvedProblemIds(user.id)
      : Promise.resolve(new Set<string>()),
  ])

  const lessonNumber = target.chapter.lessons.findIndex((l) => l.id === target.lesson.id) + 1

  return (
    <main className="mx-auto grid max-w-3xl gap-6 p-4 md:p-6">
      <div className="grid gap-3">
        <Link
          href="/learn"
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" /> Curriculum
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Week {target.week.position}</Badge>
          <Badge variant="outline">{target.chapter.title}</Badge>
          <Badge variant="secondary">
            Lesson {lessonNumber}/{target.chapter.lessons.length}
          </Badge>
          {isCompleted && <Badge className="bg-emerald-600">Completed</Badge>}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {target.lesson.title}
          <span className="text-muted-foreground ml-2 text-base font-normal">
            · ~{target.lesson.estimated_minutes} min · {target.lesson.xp_reward} XP
          </span>
        </h1>
      </div>

      <Separator />

      <BlockRenderer blocks={blocks} />

      {lessonProblems.length > 0 && (
        <LessonProblemList problems={lessonProblems} solvedIds={solvedIds} />
      )}

      {quiz && quiz.questions.length > 0 ? (
        <QuizRunner
          lessonId={target.lesson.id}
          title={quiz.title}
          passThreshold={quiz.passThreshold}
          questions={quiz.questions}
          nextHref={nextHref}
          isCompleted={isCompleted}
        />
      ) : (
        <div className="flex items-center justify-between gap-3 border-t pt-6">
          {prev ? (
            <Link
              href={hrefFor(prev)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="size-4" /> Previous
            </Link>
          ) : (
            <span />
          )}
          <CompleteButton
            lessonId={target.lesson.id}
            nextHref={nextHref}
            isCompleted={isCompleted}
          />
        </div>
      )}
    </main>
  )
}
