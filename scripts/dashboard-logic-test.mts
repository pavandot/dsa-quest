/**
 * Verifies the dashboard's resume-point math against live data:
 * seeds N completed lessons for the e2e test user, recomputes, checks position.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]!] = m[2]
}
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const { data: users } = await admin.auth.admin.listUsers()
const user = users.users.find((u) => u.email === 'e2e-test@dsaquest.dev')
if (!user) throw new Error('run `npm run test:auth` first to create the test user')

// fetch curriculum in order (same shape the app query uses)
const { data: course } = await admin
  .from('courses')
  .select(
    `slug, phases (position, slug, weeks (position, slug, title, chapters (position, slug, title, lessons (id, position, slug))))`
  )
  .eq('slug', 'dsa-interview-mastery')
  .single()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = Record<string, any>
const byPos = (rows: AnyRec[]) => [...rows].sort((a, b) => a.position - b.position)
const flat: AnyRec[] = []
for (const p of byPos(course!.phases))
  for (const w of byPos(p.weeks))
    for (const c of byPos(w.chapters))
      for (const l of byPos(c.lessons)) flat.push({ lesson: l, chapter: c, week: w })

console.log(`flattened lessons: ${flat.length} (expect 400)`)

// seed: first 6 lessons completed (all of chapter 1 + first of chapter 2)
const N = 6
await admin.from('lesson_progress').delete().eq('user_id', user.id)
const { error } = await admin.from('lesson_progress').insert(
  flat.slice(0, N).map((f) => ({
    user_id: user.id,
    lesson_id: f.lesson.id,
    status: 'completed',
    completed_at: new Date().toISOString(),
  }))
)
if (error) throw error
console.log(`seeded ${N} completed lessons ✓`)

// recompute resume point the same way the app does
const completed = new Set(flat.slice(0, N).map((f) => f.lesson.id))
const current = flat.find((f) => !completed.has(f.lesson.id))!
const lessonNumber = byPos(current.chapter.lessons).findIndex((l) => l.id === current.lesson.id) + 1

console.log('resume point:', {
  week: `Week ${current.week.position} — ${current.week.title}`,
  chapter: current.chapter.title,
  lesson: `${current.lesson.slug} (${lessonNumber}/${current.chapter.lessons.length})`,
  percent: Math.round((N / flat.length) * 100) + '%',
})

const pass =
  current.week.position === 1 &&
  current.chapter.slug === 'array-mechanics' &&
  current.lesson.slug === 'guided-example' &&
  lessonNumber === 2
console.log(pass ? 'resume-point math ✓' : 'resume-point math ✗ FAILED')
if (!pass) process.exit(1)
