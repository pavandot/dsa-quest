import 'server-only'
import { createStaticClient } from '@/lib/supabase/static'

export type ContentBlock =
  | { type: 'text'; md: string }
  | { type: 'code'; language: string; code: string; caption?: string }
  | { type: 'callout'; variant: 'info' | 'tip' | 'warning'; md: string }
  | { type: 'visualization'; kind: string; config?: Record<string, unknown> }

export type QuizQuestion = {
  prompt: string
  options: string[]
  correct_index: number
  explanation: string
}

export async function getLessonContent(lessonId: string): Promise<ContentBlock[]> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('lessons')
    .select('content')
    .eq('id', lessonId)
    .single()
  if (error) throw new Error(`getLessonContent: ${error.message}`)
  return (data.content ?? []) as ContentBlock[]
}

export async function getQuiz(lessonId: string) {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('quizzes')
    .select('id, title, pass_threshold, questions')
    .eq('lesson_id', lessonId)
    .maybeSingle()
  if (error) throw new Error(`getQuiz: ${error.message}`)
  if (!data) return null
  return {
    id: data.id,
    title: data.title,
    passThreshold: data.pass_threshold,
    questions: (data.questions ?? []) as QuizQuestion[],
  }
}
