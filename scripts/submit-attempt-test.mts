/** Exercises submit_problem_attempt: first-solve XP, idempotency, review enrollment. */
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
  .select('id, xp_reward')
  .eq('slug', 'two-sum')
  .single()

// clean slate for this problem
await admin.from('problem_attempts').delete().eq('user_id', user.id).eq('problem_id', problem!.id)
await admin.from('review_queue').delete().eq('user_id', user.id).eq('problem_id', problem!.id)
const { data: before } = await admin.from('profiles').select('xp').eq('id', user.id).single()

let failures = 0
const check = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗ FAILED'} ${name}`)
  if (!cond) failures++
}

const rpc = (verdict: string, passed: number, total: number) =>
  admin.rpc('submit_problem_attempt', {
    p_user_id: user.id,
    p_problem_id: problem!.id,
    p_language: 'javascript',
    p_code: 'function twoSum() {}',
    p_verdict: verdict,
    p_passed: passed,
    p_total: total,
    p_runtime_ms: 12,
    p_test_results: [{ passed: true, timeMs: 0.5, hidden: false }],
  })

// 1. failed attempt: recorded, no XP, no review entry
const failed = await rpc('failed', 2, 5)
check('failed attempt awards no xp', failed.data?.xp_awarded === 0)
const { count: rq0 } = await admin
  .from('review_queue')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('problem_id', problem!.id)
check('failed attempt does not enter review queue', rq0 === 0)

// 2. first solve: XP + review queue due ~tomorrow
const solve = await rpc('passed', 5, 5)
check(
  'first solve awards problem xp',
  solve.data?.first_solve === true && solve.data?.xp_awarded === problem!.xp_reward
)
const { data: rq } = await admin
  .from('review_queue')
  .select('status, interval_index, due_at')
  .eq('user_id', user.id)
  .eq('problem_id', problem!.id)
  .single()
const hoursUntilDue = (new Date(rq!.due_at).getTime() - Date.now()) / 36e5
check(
  `review queued: learning, due in ~24h (${hoursUntilDue.toFixed(1)}h)`,
  rq?.status === 'learning' && rq?.interval_index === 0 && hoursUntilDue > 23 && hoursUntilDue < 25
)

// 3. re-solve: no double XP, queue untouched
const resolve = await rpc('passed', 5, 5)
check('re-solve awards 0 xp', resolve.data?.first_solve === false && resolve.data?.xp_awarded === 0)

// 4. profile xp delta is exactly one reward
const { data: after } = await admin.from('profiles').select('xp').eq('id', user.id).single()
check(
  `profile xp +${problem!.xp_reward} exactly once`,
  after!.xp - before!.xp === problem!.xp_reward
)

// 5. attempts history: 3 rows
const { count: attempts } = await admin
  .from('problem_attempts')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('problem_id', problem!.id)
check('3 attempts recorded', attempts === 3)

console.log(failures === 0 ? '\nall submission checks passed' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
