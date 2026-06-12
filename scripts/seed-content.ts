/**
 * Seeds lesson content + quizzes from supabase/seed/content.json.
 * Idempotent — updates lessons.content in place, upserts quizzes by lesson_id.
 *
 * Run: npm run seed:content
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '../src/lib/database.types'

type QuizSeed = {
  title: string
  pass_threshold: number
  questions: { prompt: string; options: string[]; correct_index: number; explanation: string }[]
}
type Entry = {
  week: string
  chapter: string
  lesson: string
  content?: Json
  quiz?: QuizSeed
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
  const entries = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../supabase/seed/content.json'), 'utf8')
  ) as Entry[]

  for (const entry of entries) {
    // resolve lesson id through its ancestry (slugs repeat across parents)
    const { data: week, error: weekErr } = await db
      .from('weeks')
      .select('id')
      .eq('slug', entry.week)
      .single()
    if (weekErr) throw new Error(`week ${entry.week}: ${weekErr.message}`)

    const { data: chapter, error: chErr } = await db
      .from('chapters')
      .select('id')
      .eq('week_id', week.id)
      .eq('slug', entry.chapter)
      .single()
    if (chErr) throw new Error(`chapter ${entry.chapter}: ${chErr.message}`)

    const { data: lesson, error: lsErr } = await db
      .from('lessons')
      .select('id')
      .eq('chapter_id', chapter.id)
      .eq('slug', entry.lesson)
      .single()
    if (lsErr) throw new Error(`lesson ${entry.lesson}: ${lsErr.message}`)

    if (entry.content) {
      const { error } = await db
        .from('lessons')
        .update({ content: entry.content })
        .eq('id', lesson.id)
      if (error) throw new Error(`content ${entry.lesson}: ${error.message}`)
    }

    if (entry.quiz) {
      const { error } = await db.from('quizzes').upsert(
        {
          lesson_id: lesson.id,
          title: entry.quiz.title,
          pass_threshold: entry.quiz.pass_threshold,
          questions: entry.quiz.questions as unknown as Json,
        },
        { onConflict: 'lesson_id' }
      )
      if (error) throw new Error(`quiz ${entry.lesson}: ${error.message}`)
    }

    console.log(`✓ ${entry.week}/${entry.chapter}/${entry.lesson}`)
  }
  console.log(`seeded ${entries.length} lessons`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
