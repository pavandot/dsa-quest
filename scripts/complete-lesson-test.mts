/** Exercises the complete_lesson RPC: locking, XP idempotency, streaks, rollups. */
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
const user = users.users.find((u) => u.email === 'e2e-test@dsaquest.dev')!

// reset all progress for a clean run
for (const t of [
  'lesson_progress',
  'chapter_progress',
  'week_progress',
  'phase_progress',
  'xp_logs',
  'activity_logs',
]) {
  await admin
    .from(t as never)
    .delete()
    .eq('user_id', user.id)
}
await admin.from('profiles').update({ xp: 0, level: 1 }).eq('id', user.id)
await admin
  .from('streaks')
  .update({ current_streak: 0, longest_streak: 0, last_activity_date: null })
  .eq('user_id', user.id)

// fetch curriculum order
const { data: course } = await admin
  .from('courses')
  .select(
    `phases (position, weeks (position, chapters (id, position, slug, lessons (id, position, slug, type, xp_reward))))`
  )
  .eq('slug', 'dsa-interview-mastery')
  .single()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = Record<string, any>
const byPos = (r: AnyRec[]) => [...r].sort((a, b) => a.position - b.position)
const flat: AnyRec[] = []
for (const p of byPos(course!.phases as AnyRec[]))
  for (const w of byPos(p.weeks))
    for (const c of byPos(w.chapters))
      for (const l of byPos(c.lessons)) flat.push({ ...l, chapter: c })

const rpc = (lessonId: string, score?: number) =>
  admin.rpc('complete_lesson', {
    p_user_id: user.id,
    p_lesson_id: lessonId,
    p_quiz_score: score ?? undefined,
  })

let failures = 0
const check = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗ FAILED'} ${name}`)
  if (!cond) failures++
}

// 1. locked lesson rejected
const locked = await rpc(flat[5]!.id)
check('locked lesson rejected', !!locked.error && locked.error.message.includes('lesson_locked'))

// 2. first lesson completes, awards XP
const first = await rpc(flat[0]!.id)
check(
  'first completion awards xp + streak 1',
  first.data?.xp_awarded === flat[0]!.xp_reward && first.data?.streak === 1
)

// 3. idempotent — no double XP
const again = await rpc(flat[0]!.id)
check('re-completion awards 0 xp', again.data?.xp_awarded === 0 && again.data?.already_completed)

// 4. quiz gating: lesson 3 (index 2) is the quiz — but complete lesson 2 first
await rpc(flat[1]!.id)
const quizFail = await rpc(flat[2]!.id, 40)
check('quiz below threshold rejected', !!quizFail.error)
const quizPass = await rpc(flat[2]!.id, 80)
check('quiz at 80 passes', quizPass.data?.xp_awarded === flat[2]!.xp_reward)

// 5. chapter rollup after all 5 lessons
await rpc(flat[3]!.id)
const last = await rpc(flat[4]!.id)
check('5 lessons completed', !last.error)
const { data: ch } = await admin
  .from('chapter_progress')
  .select('status')
  .eq('user_id', user.id)
  .eq('chapter_id', flat[0]!.chapter.id)
  .single()
check('chapter rollup completed', ch?.status === 'completed')

// 6. profile totals
const { data: prof } = await admin.from('profiles').select('xp, level').eq('id', user.id).single()
const expectedXp = flat.slice(0, 5).reduce((s, f) => s + f.xp_reward, 0)
check(`profile xp ${prof?.xp} === ${expectedXp}`, prof?.xp === expectedXp)

// 7. frontier moved: lesson 6 now completable, lesson 8 still locked
const six = await rpc(flat[5]!.id)
check('frontier advanced to lesson 6', !six.error)
const eight = await rpc(flat[7]!.id)
check('lesson 8 still locked', !!eight.error)

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
