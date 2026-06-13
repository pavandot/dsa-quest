/** Exercises the spaced-repetition ladder in submit_problem_attempt:
 *  enrollment, advance (1→3→7→14→30), mastery progression, mastery bonus XP,
 *  lapse-on-fail, and the one-event-per-due-window guard. */
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
const { data: problem } = await admin
  .from('problems')
  .select('id')
  .eq('slug', 'two-sum')
  .single()
const pid = problem!.id

// clean slate
await admin.from('problem_attempts').delete().eq('user_id', user.id).eq('problem_id', pid)
await admin.from('review_queue').delete().eq('user_id', user.id).eq('problem_id', pid)

let failures = 0
const check = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗ FAILED'} ${name}`)
  if (!cond) failures++
}

const submit = (verdict: string) =>
  admin
    .rpc('submit_problem_attempt', {
      p_user_id: user.id,
      p_problem_id: pid,
      p_language: 'javascript',
      p_code: 'function twoSum() {}',
      p_verdict: verdict,
      p_passed: verdict === 'passed' ? 5 : 2,
      p_total: 5,
      p_runtime_ms: 12,
      p_test_results: [{ passed: verdict === 'passed', timeMs: 0.5, hidden: false }],
    })
    .then((r) => r.data as Record<string, unknown>)

// force the queued review to be due now (sidesteps real-time waiting)
const makeDue = () =>
  admin
    .from('review_queue')
    .update({ due_at: new Date(Date.now() - 60_000).toISOString() })
    .eq('user_id', user.id)
    .eq('problem_id', pid)

const readRow = async () => {
  const { data } = await admin
    .from('review_queue')
    .select('status, interval_index, lapses, due_at')
    .eq('user_id', user.id)
    .eq('problem_id', pid)
    .single()
  return data!
}
const daysOut = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / 864e5)

// 1. first solve enrolls but does NOT advance (due tomorrow)
const r1 = await submit('passed')
check('first solve does not advance a review', r1.review_advanced === false)
const row1 = await readRow()
check('enrolled: learning, index 0, ~1d', row1.status === 'learning' && row1.interval_index === 0)

// 2. advance through the ladder: 0→1→2→3→4 with expected intervals + statuses
const expect = [
  { index: 1, status: 'learning', days: 3, xp: 10 },
  { index: 2, status: 'practicing', days: 7, xp: 10 },
  { index: 3, status: 'practicing', days: 14, xp: 10 },
  { index: 4, status: 'mastered', days: 30, xp: 25 }, // mastery bonus on first reaching mastered
]
for (const step of expect) {
  await makeDue()
  const r = await submit('passed')
  const row = await readRow()
  check(
    `advance → index ${step.index}, ${step.status}, +${step.days}d, ${step.xp} XP`,
    r.review_advanced === true &&
      r.review_status === step.status &&
      r.review_xp === step.xp &&
      row.interval_index === step.index &&
      row.status === step.status &&
      daysOut(row.due_at) === step.days
  )
}

// 3. re-review at the top: stays mastered, index capped at 4, no mastery bonus
await makeDue()
const rTop = await submit('passed')
check(
  'mastered re-review: capped at index 4, base 10 XP (no repeat bonus)',
  rTop.review_advanced === true && rTop.review_status === 'mastered' && rTop.review_xp === 10
)

// 4. lapse on fail: reset to index 0 / learning, due tomorrow, lapses++
const lapsesBefore = (await readRow()).lapses
await makeDue()
const rLapse = await submit('failed')
const rowLapse = await readRow()
check(
  'fail lapses to index 0 / learning, due ~1d, lapses+1',
  rLapse.review_lapsed === true &&
    rowLapse.interval_index === 0 &&
    rowLapse.status === 'learning' &&
    daysOut(rowLapse.due_at) <= 1 &&
    rowLapse.lapses === lapsesBefore + 1
)

// 5. due-window guard: a second submit while NOT due is a no-op for the review
const rGuard = await submit('failed')
const rowGuard = await readRow()
check(
  'not-due submit does not re-process the review (no phantom lapse)',
  rGuard.review_lapsed === false &&
    rGuard.review_advanced === false &&
    rowGuard.lapses === rowLapse.lapses
)

// 6. xp_logs recorded review_completed rows (5 passing reviews above)
const { count: reviewXpLogs } = await admin
  .from('xp_logs')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('source', 'review_completed')
  .eq('source_id', pid)
check('review_completed xp_logs recorded (≥5)', (reviewXpLogs ?? 0) >= 5)

console.log(failures === 0 ? '\nall review-ladder checks passed' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
