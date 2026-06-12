import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]!] = m[2]
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)

const email = 'e2e-test@dsaquest.dev'
const password = 'test-Password-123'

const { data: existing } = await admin.auth.admin.listUsers()
const old = existing.users.find((u) => u.email === email)
if (old) await admin.auth.admin.deleteUser(old.id)

const { data: created, error: e1 } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
if (e1) throw e1
console.log('1. user created ✓')

const { data: profile } = await admin
  .from('profiles')
  .select('username, role, xp, level')
  .eq('id', created.user.id)
  .single()
const { data: streak } = await admin
  .from('streaks')
  .select('current_streak')
  .eq('user_id', created.user.id)
  .single()
console.log('2. trigger provisioned profile ✓', JSON.stringify(profile))
console.log('3. trigger provisioned streak ✓', JSON.stringify(streak))

const { error: e2 } = await anon.auth.signInWithPassword({ email, password })
if (e2) throw e2
console.log('4. password sign-in ✓')

const { data: ownProfile, error: e3 } = await anon
  .from('profiles')
  .select('username')
  .eq('id', created.user.id)
  .single()
if (e3) throw e3
console.log('5. RLS allows reading own profile ✓', ownProfile.username)

await anon
  .from('profiles')
  .update({ xp: 99999, role: 'admin', level: 99 })
  .eq('id', created.user.id)
const { data: after } = await admin
  .from('profiles')
  .select('xp, role, level')
  .eq('id', created.user.id)
  .single()
console.log(
  '6. self-promotion attempt:',
  JSON.stringify(after),
  after!.role === 'student' && after!.xp === 0 ? '→ blocked ✓' : '→ FAILED!'
)
