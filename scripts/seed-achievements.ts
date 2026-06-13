/**
 * Seeds achievement definitions from supabase/seed/achievements.json.
 * Idempotent — upserts by slug, so re-running updates titles/XP/criteria in place.
 *
 * Run: npm run seed:achievements
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '../src/lib/database.types'

type AchievementSeed = {
  slug: string
  title: string
  description: string
  icon: string
  category: string
  xp_reward: number
  criteria: Json
}

function loadEnv(file: string) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && m[1] && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

async function main() {
  loadEnv(resolve(import.meta.dirname, '../.env.local'))
  const db = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  const achievements = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../supabase/seed/achievements.json'), 'utf8')
  ) as AchievementSeed[]

  const { error } = await db
    .from('achievements')
    .upsert(achievements, { onConflict: 'slug' })
  if (error) throw new Error(error.message)

  for (const a of achievements) console.log(`✓ ${a.slug} — ${a.title}`)
  console.log(`seeded ${achievements.length} achievements`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
