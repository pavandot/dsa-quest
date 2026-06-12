'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { completeLesson } from '@/features/progress/actions'
import type { QuizQuestion } from '@/features/lessons/server/queries'

type Phase = 'answering' | 'review'

export function QuizRunner({
  lessonId,
  title,
  passThreshold,
  questions,
  nextHref,
  isCompleted,
}: {
  lessonId: string
  title: string
  passThreshold: number
  questions: QuizQuestion[]
  nextHref: string
  isCompleted: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null))
  const [phase, setPhase] = useState<Phase>('answering')

  const answeredAll = answers.every((a) => a !== null)
  const correct = questions.filter((q, i) => answers[i] === q.correct_index).length
  const score = Math.round((correct / questions.length) * 100)
  const passed = score >= passThreshold

  function submit() {
    setPhase('review')
    if (!passed) return
    startTransition(async () => {
      const result = await completeLesson({ lessonId, quizScore: score })
      if (!result.ok) toast.error(result.error)
      else if (result.xpAwarded > 0)
        toast.success(`Quiz passed — +${result.xpAwarded} XP`, {
          description: `Score: ${score}%`,
        })
    })
  }

  function retry() {
    setAnswers(questions.map(() => null))
    setPhase('answering')
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {title} · pass at {passThreshold}%
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {questions.map((q, qi) => (
            <fieldset key={qi} className="grid gap-2">
              <legend className="text-sm leading-relaxed font-medium whitespace-pre-wrap">
                {qi + 1}. {q.prompt}
              </legend>
              <div className="grid gap-1.5">
                {q.options.map((option, oi) => {
                  const chosen = answers[qi] === oi
                  const isCorrect = q.correct_index === oi
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={phase === 'review'}
                      onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        phase === 'answering' && chosen && 'border-primary bg-primary/5',
                        phase === 'answering' && !chosen && 'hover:bg-muted/50',
                        phase === 'review' &&
                          isCorrect &&
                          'border-emerald-500/50 bg-emerald-500/10',
                        phase === 'review' &&
                          chosen &&
                          !isCorrect &&
                          'border-destructive/50 bg-destructive/10'
                      )}
                    >
                      {phase === 'review' && isCorrect && (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      )}
                      {phase === 'review' && chosen && !isCorrect && (
                        <XCircle className="text-destructive size-4 shrink-0" />
                      )}
                      {option}
                    </button>
                  )
                })}
              </div>
              {phase === 'review' && answers[qi] !== q.correct_index && (
                <p className="text-muted-foreground text-xs">{q.explanation}</p>
              )}
            </fieldset>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        {phase === 'answering' ? (
          <Button onClick={submit} disabled={!answeredAll || pending}>
            {answeredAll ? 'Submit answers' : 'Answer all questions to submit'}
          </Button>
        ) : passed || isCompleted ? (
          <>
            <p className="text-sm font-medium">
              Score: {score}% — {passed ? 'passed' : 'previously passed'} 🎉
            </p>
            <Button onClick={() => router.push(nextHref)} className="gap-2">
              Continue <ArrowRight className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">
              Score: {score}% — below {passThreshold}%
            </p>
            <Button variant="outline" onClick={retry} className="gap-2">
              <RotateCcw className="size-4" /> Review & retry
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
