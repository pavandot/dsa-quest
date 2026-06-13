/** Exercises evaluate_achievements: threshold logic, awarding, XP logging,
 *  and idempotency (a second pass earns nothing new). */
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
const { data: problem } = await admin.from('problems').select('id').eq('slug', 'two-sum').single()

let failures = 0
const check = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗ FAILED'} ${name}`)
  if (!cond) failures++
}

type Earned = { slug: string; title: string; xp: number }
const evaluate = () =>
  admin.rpc('evaluate_achievements', { p_user_id: user.id }).then((r) => r.data as Earned[])
const uaCount = async () => {
  const { count } = await admin
    .from('user_achievements')
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  return count ?? 0
}
const achXpLogCount = async () => {
  const { count } = await admin
    .from('xp_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('source', 'achievement')
  return count ?? 0
}

// guarantee at least one passed problem, then reset achievement state for a clean award pass
await admin.rpc('submit_problem_attempt', {
  p_user_id: user.id,
  p_problem_id: problem!.id,
  p_language: 'javascript',
  p_code: 'function twoSum() {}',
  p_verdict: 'passed',
  p_passed: 5,
  p_total: 5,
  p_runtime_ms: 10,
  p_test_results: [{ passed: true, timeMs: 0.4, hidden: false }],
})
await admin.from('user_achievements').delete().eq('user_id', user.id)
await admin.from('xp_logs').delete().eq('user_id', user.id).eq('source', 'achievement')

// 1. first evaluation awards the milestones the user already qualifies for
const earned = await evaluate()
check('awards at least one achievement', earned.length > 0)
check('awards First Blood (>=1 problem solved)', earned.some((e) => e.slug === 'first-blood'))
check('does NOT award Centurion (50 problems)', !earned.some((e) => e.slug === 'centurion'))
check('user_achievements rows == awarded count', (await uaCount()) === earned.length)

// 2. XP logged once per awarded achievement that carries XP
const withXp = earned.filter((e) => e.xp > 0).length
check(`achievement xp_logs == awarded-with-xp (${withXp})`, (await achXpLogCount()) === withXp)

// 3. idempotency: re-evaluating earns nothing new and adds no rows
const countBefore = await uaCount()
const again = await evaluate()
check('second evaluation awards nothing new', again.length === 0)
check('user_achievements count unchanged', (await uaCount()) === countBefore)

console.log(failures === 0 ? '\nall achievement checks passed' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
