import 'server-only'
import { createClient } from '@/lib/supabase/server'
import {
  flattenLessons,
  type CourseTree,
  type FlatLesson,
} from '@/features/curriculum/server/queries'

export type ResumePoint = {
  current: FlatLesson
  /** 1-based lesson number within its chapter, e.g. "Lesson 2/5" */
  lessonNumber: number
  lessonsInChapter: number
  completedCount: number
  totalLessons: number
  coursePercent: number
  /** lessons after the current one, for "up next" */
  upcoming: FlatLesson[]
  isCourseComplete: boolean
}

export async function getCompletedLessonIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
  if (error) throw new Error(`getCompletedLessonIds: ${error.message}`)
  return new Set(data.map((r) => r.lesson_id))
}

export function computeResumePoint(tree: CourseTree, completed: Set<string>): ResumePoint {
  const flat = flattenLessons(tree)
  const firstIncomplete = flat.find((f) => !completed.has(f.lesson.id))
  const isCourseComplete = !firstIncomplete
  const current = firstIncomplete ?? flat[flat.length - 1]
  if (!current) throw new Error('computeResumePoint: empty curriculum')

  const siblings = current.chapter.lessons
  const lessonNumber = siblings.findIndex((l) => l.id === current.lesson.id) + 1

  return {
    current,
    lessonNumber,
    lessonsInChapter: siblings.length,
    completedCount: completed.size,
    totalLessons: flat.length,
    coursePercent: flat.length === 0 ? 0 : Math.round((completed.size / flat.length) * 100),
    upcoming: flat.slice(current.index + 1, current.index + 4),
    isCourseComplete,
  }
}
