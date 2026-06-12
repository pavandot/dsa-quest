/**
 * Seeds the curriculum skeleton from supabase/seed/roadmap.json.
 *
 * Idempotent: every level upserts on its slug-based unique constraint, so the
 * script can run any number of times — edits to roadmap.json propagate, user
 * progress rows are never touched.
 *
 * Run: npm run seed:curriculum
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient, type PostgrestSingleResponse } from '@supabase/supabase-js'
import type { Database } from '../src/lib/database.types'

type ChapterSeed = { slug: string; title: string; description: string }
type WeekSeed = { slug: string; title: string; goal: string; chapters: ChapterSeed[] }
type PhaseSeed = { slug: string; title: string; description: string; weeks: WeekSeed[] }
type Roadmap = {
  course: { slug: string; title: string; description: string }
  phases: PhaseSeed[]
}

// every chapter expands into the same five-lesson rhythm
const LESSON_TEMPLATE = [
  { slug: 'theory', title: 'Theory', type: 'theory', xp_reward: 10, estimated_minutes: 10 },
  {
    slug: 'guided-example',
    title: 'Guided Example',
    type: 'example',
    xp_reward: 10,
    estimated_minutes: 10,
  },
  { slug: 'quiz', title: 'Quick Quiz', type: 'quiz', xp_reward: 15, estimated_minutes: 5 },
  { slug: 'practice', title: 'Practice', type: 'practice', xp_reward: 25, estimated_minutes: 25 },
  { slug: 'revision', title: 'Revision', type: 'revision', xp_reward: 20, estimated_minutes: 15 },
] as const

function loadEnv(file: string) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && m[1] && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

function ok<T>(res: PostgrestSingleResponse<T>, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`)
  return res.data
}

async function main() {
  loadEnv(resolve(import.meta.dirname, '../.env.local'))
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

  const db = createClient<Database>(url, key, { auth: { persistSession: false } })
  const roadmap = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../supabase/seed/roadmap.json'), 'utf8')
  ) as Roadmap

  // course
  const course = ok(
    await db
      .from('courses')
      .upsert({ ...roadmap.course, is_published: true }, { onConflict: 'slug' })
      .select('id, slug')
      .single(),
    'upsert course'
  )
  console.log(`course   ✓ ${course.slug}`)

  // phases
  const phaseRows = roadmap.phases.map((p, i) => ({
    course_id: course.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    position: i + 1,
  }))
  const phases = ok(
    await db.from('phases').upsert(phaseRows, { onConflict: 'course_id,slug' }).select('id, slug'),
    'upsert phases'
  )
  const phaseId = new Map(phases.map((p) => [p.slug, p.id]))

  // weeks — position is the GLOBAL week number (1–20) so "Week 3" is storable
  let weekNumber = 0
  const weekRows = roadmap.phases.flatMap((p) =>
    p.weeks.map((w) => {
      weekNumber += 1
      const phase_id = phaseId.get(p.slug)
      if (!phase_id) throw new Error(`unknown phase ${p.slug}`)
      return {
        phase_id,
        slug: w.slug,
        title: w.title,
        goal: w.goal,
        position: weekNumber,
      }
    })
  )
  const weeks = ok(
    await db.from('weeks').upsert(weekRows, { onConflict: 'phase_id,slug' }).select('id, slug'),
    'upsert weeks'
  )
  const weekId = new Map(weeks.map((w) => [w.slug, w.id]))

  // chapters — slugs repeat across weeks, so key the map by week_id:slug
  const chapterRows = roadmap.phases.flatMap((p) =>
    p.weeks.flatMap((w) =>
      w.chapters.map((c, i) => {
        const week_id = weekId.get(w.slug)
        if (!week_id) throw new Error(`unknown week ${w.slug}`)
        return {
          week_id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          position: i + 1,
        }
      })
    )
  )
  const chapters = ok(
    await db
      .from('chapters')
      .upsert(chapterRows, { onConflict: 'week_id,slug' })
      .select('id, week_id, slug'),
    'upsert chapters'
  )

  // lessons — five per chapter from the template
  const lessonRows = chapters.flatMap((c) =>
    LESSON_TEMPLATE.map((l, i) => ({
      chapter_id: c.id,
      slug: l.slug,
      title: l.title,
      type: l.type,
      xp_reward: l.xp_reward,
      estimated_minutes: l.estimated_minutes,
      position: i + 1,
    }))
  )
  const lessons = ok(
    await db.from('lessons').upsert(lessonRows, { onConflict: 'chapter_id,slug' }).select('id'),
    'upsert lessons'
  )

  console.log(`phases   ✓ ${phases.length}`)
  console.log(`weeks    ✓ ${weeks.length}`)
  console.log(`chapters ✓ ${chapters.length}`)
  console.log(`lessons  ✓ ${lessons.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
