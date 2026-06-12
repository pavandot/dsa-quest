import 'server-only'
import { unstable_cache } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'

export type LessonNode = {
  id: string
  slug: string
  title: string
  type: 'theory' | 'example' | 'quiz' | 'practice' | 'revision'
  position: number
  xp_reward: number
  estimated_minutes: number
}

export type ChapterNode = {
  id: string
  slug: string
  title: string
  description: string | null
  position: number
  lessons: LessonNode[]
}

export type WeekNode = {
  id: string
  slug: string
  title: string
  goal: string | null
  position: number // global week number 1–20
  chapters: ChapterNode[]
}

export type PhaseNode = {
  id: string
  slug: string
  title: string
  description: string | null
  position: number
  weeks: WeekNode[]
}

export type CourseTree = {
  id: string
  slug: string
  title: string
  description: string | null
  phases: PhaseNode[]
}

async function fetchCourseTree(courseSlug: string): Promise<CourseTree> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('courses')
    .select(
      `id, slug, title, description,
       phases (
         id, slug, title, description, position,
         weeks (
           id, slug, title, goal, position,
           chapters (
             id, slug, title, description, position,
             lessons ( id, slug, title, type, position, xp_reward, estimated_minutes )
           )
         )
       )`
    )
    .eq('slug', courseSlug)
    .single()
  if (error) throw new Error(`fetchCourseTree: ${error.message}`)

  const byPosition = <T extends { position: number }>(rows: T[]) =>
    [...rows].sort((a, b) => a.position - b.position)

  return {
    ...data,
    phases: byPosition(data.phases).map((p) => ({
      ...p,
      weeks: byPosition(p.weeks).map((w) => ({
        ...w,
        chapters: byPosition(w.chapters).map((c) => ({
          ...c,
          lessons: byPosition(c.lessons),
        })),
      })),
    })),
  }
}

/** Cached curriculum tree — shared across all users, busted via the 'curriculum' tag. */
export const getCourseTree = unstable_cache(fetchCourseTree, ['course-tree'], {
  revalidate: 3600,
  tags: ['curriculum'],
})

export const DEFAULT_COURSE_SLUG = 'dsa-interview-mastery'

/** A lesson with its full ancestry, in curriculum order. */
export type FlatLesson = {
  lesson: LessonNode
  chapter: ChapterNode
  week: WeekNode
  phase: PhaseNode
  /** 0-based position in the whole course */
  index: number
}

export function flattenLessons(tree: CourseTree): FlatLesson[] {
  const out: FlatLesson[] = []
  for (const phase of tree.phases)
    for (const week of phase.weeks)
      for (const chapter of week.chapters)
        for (const lesson of chapter.lessons)
          out.push({ lesson, chapter, week, phase, index: out.length })
  return out
}
