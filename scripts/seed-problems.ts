/**
 * Seeds problems + lesson links from supabase/seed/problems.json.
 * Idempotent — problems upsert by slug, links by (lesson_id, problem_id).
 *
 * Run: npm run seed:problems
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '../src/lib/database.types'

type ProblemSeed = {
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  function_name: string
  time_limit_ms: number
  xp_reward: number
  description_md: string
  hints: string[]
  starter_code: Record<string, string>
  solution_code: Record<string, string>
  test_cases: { input: unknown[]; expected: unknown; hidden?: boolean }[]
  lesson?: { week: string; chapter: string; lesson: string; position: number }
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
  const problems = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../supabase/seed/problems.json'), 'utf8')
  ) as ProblemSeed[]

  for (const p of problems) {
    const { lesson: link, ...row } = p
    const { data: problem, error } = await db
      .from('problems')
      .upsert(
        {
          ...row,
          hints: row.hints as unknown as Json,
          starter_code: row.starter_code as unknown as Json,
          solution_code: row.solution_code as unknown as Json,
          test_cases: row.test_cases as unknown as Json,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()
    if (error) throw new Error(`problem ${p.slug}: ${error.message}`)

    if (link) {
      const { data: week } = await db.from('weeks').select('id').eq('slug', link.week).single()
      const { data: chapter } = await db
        .from('chapters')
        .select('id')
        .eq('week_id', week!.id)
        .eq('slug', link.chapter)
        .single()
      const { data: lesson } = await db
        .from('lessons')
        .select('id')
        .eq('chapter_id', chapter!.id)
        .eq('slug', link.lesson)
        .single()
      const { error: linkErr } = await db.from('lesson_problems').upsert(
        {
          lesson_id: lesson!.id,
          problem_id: problem.id,
          position: link.position,
          is_required: true,
        },
        { onConflict: 'lesson_id,problem_id' }
      )
      if (linkErr) throw new Error(`link ${p.slug}: ${linkErr.message}`)
    }
    console.log(`✓ ${p.slug}${link ? ` → ${link.week}/${link.chapter}/${link.lesson}` : ''}`)
  }
  console.log(`seeded ${problems.length} problems`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
