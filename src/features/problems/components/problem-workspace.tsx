'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckCircle2, ChevronDown, Lightbulb, Play, RotateCcw, Send, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toastAchievements } from '@/features/achievements/toast'
import { submitAttempt } from '@/features/problems/actions'
import { browserExecutor } from '@/features/problems/executor/browser-executor'
import type { RunSummary } from '@/features/problems/executor/types'
import type { WorkspaceProblem } from '@/features/problems/server/queries'
import { useWorkspaceStore } from '@/stores/workspace-store'

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-80 w-full" />,
})

const DIFFICULTY_STYLE = {
  easy: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  hard: 'bg-red-500/10 text-red-600 border-red-500/30',
} as const

export function ProblemWorkspace({
  problem,
  initiallySolved,
}: {
  problem: WorkspaceProblem
  initiallySolved: boolean
}) {
  const router = useRouter()
  const draft = useWorkspaceStore((s) => s.drafts[problem.id])
  const setDraft = useWorkspaceStore((s) => s.setDraft)
  const code = draft ?? problem.starterCode

  const [running, setRunning] = useState(false)
  const [submitting, startSubmit] = useTransition()
  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [mode, setMode] = useState<'run' | 'submit' | null>(null)
  const [solved, setSolved] = useState(initiallySolved)
  const [hintsOpen, setHintsOpen] = useState(0)

  const visibleTests = problem.testCases.filter((t) => !t.hidden)

  const run = useCallback(async () => {
    setRunning(true)
    setMode('run')
    const result = await browserExecutor({
      code,
      functionName: problem.functionName,
      tests: visibleTests,
      timeLimitMs: problem.timeLimitMs,
    })
    setSummary(result)
    setRunning(false)
  }, [code, problem, visibleTests])

  const submit = useCallback(async () => {
    setRunning(true)
    setMode('submit')
    const result = await browserExecutor({
      code,
      functionName: problem.functionName,
      tests: problem.testCases,
      timeLimitMs: problem.timeLimitMs,
    })
    setSummary(result)
    setRunning(false)

    startSubmit(async () => {
      const response = await submitAttempt({
        problemId: problem.id,
        language: 'javascript',
        code,
        verdict: result.verdict,
        passedCount: result.passedCount,
        totalCount: result.totalCount,
        runtimeMs: Math.round(result.totalTimeMs),
        testResults: result.results.map((r) => ({
          passed: r.passed,
          timeMs: Math.round(r.timeMs * 100) / 100,
          hidden: r.hidden,
        })),
      })
      if (!response.ok) {
        toast.error(response.error)
        return
      }
      toastAchievements(response.newAchievements)
      const dueDays = response.reviewDueAt
        ? Math.max(1, Math.round((new Date(response.reviewDueAt).getTime() - Date.now()) / 864e5))
        : null
      if (result.verdict === 'passed') {
        setSolved(true)
        if (response.reviewAdvanced) {
          if (response.reviewStatus === 'mastered') {
            toast.success(`Review complete — Mastered! +${response.reviewXp} XP`, {
              description: `Top of the ladder. Next review in ${dueDays} days.`,
            })
          } else {
            toast.success(`Review complete! +${response.reviewXp} XP`, {
              description: `Next review in ${dueDays} day${dueDays === 1 ? '' : 's'} · now ${response.reviewStatus} · Streak: ${response.streak}`,
            })
          }
        } else if (response.firstSolve) {
          toast.success(`Solved! +${response.xpAwarded} XP`, {
            description: `Review scheduled for tomorrow · Streak: ${response.streak} day${response.streak === 1 ? '' : 's'}`,
          })
        } else {
          toast.success('Passed again — already in your review queue.')
        }
        router.refresh()
      } else if (response.reviewLapsed) {
        toast.warning('Review lapsed — back to the start of the ladder. Due again tomorrow.')
        router.refresh()
      }
    })
  }, [code, problem, router])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* left: description */}
      <div className="grid content-start gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{problem.title}</h1>
          <Badge variant="outline" className={DIFFICULTY_STYLE[problem.difficulty]}>
            {problem.difficulty}
          </Badge>
          {solved && (
            <Badge className="gap-1 bg-emerald-600">
              <CheckCircle2 className="size-3" /> Solved
            </Badge>
          )}
          <span className="text-muted-foreground text-xs">{problem.xpReward} XP</span>
        </div>

        <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{problem.description_md}</Markdown>
        </div>

        {problem.hints.length > 0 && (
          <Card>
            <CardContent className="grid gap-2 pt-2">
              {problem.hints.map((hint, i) => (
                <div key={i}>
                  {i < hintsOpen ? (
                    <p className="flex gap-2 text-sm">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      {hint}
                    </p>
                  ) : i === hintsOpen ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground gap-1"
                      onClick={() => setHintsOpen((n) => n + 1)}
                    >
                      <ChevronDown className="size-4" /> Reveal hint {i + 1} of{' '}
                      {problem.hints.length}
                    </Button>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* right: editor + results */}
      <div className="grid content-start gap-3">
        <div className="overflow-hidden rounded-lg border">
          <Editor
            height="380px"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setDraft(problem.id, value ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={run}
            disabled={running || submitting}
            variant="secondary"
            className="gap-2"
          >
            <Play className="size-4" /> {running && mode === 'run' ? 'Running…' : 'Run'}
          </Button>
          <Button onClick={submit} disabled={running || submitting} className="gap-2">
            <Send className="size-4" />{' '}
            {running && mode === 'submit' ? 'Judging…' : submitting ? 'Recording…' : 'Submit'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground ml-auto gap-1"
            onClick={() => setDraft(problem.id, problem.starterCode)}
          >
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        </div>

        {summary && <ResultsPanel summary={summary} mode={mode} />}
      </div>
    </div>
  )
}

function ResultsPanel({ summary, mode }: { summary: RunSummary; mode: 'run' | 'submit' | null }) {
  const headline =
    summary.verdict === 'passed'
      ? mode === 'submit'
        ? 'Accepted'
        : 'All visible tests passed'
      : summary.verdict === 'failed'
        ? 'Wrong answer'
        : summary.verdict === 'timeout'
          ? 'Time limit exceeded'
          : 'Runtime error'

  return (
    <Card>
      <CardContent className="grid gap-3 pt-2">
        <div className="flex items-baseline justify-between">
          <p
            className={cn(
              'font-semibold',
              summary.verdict === 'passed' ? 'text-emerald-600' : 'text-destructive'
            )}
          >
            {headline}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {summary.passedCount}/{summary.totalCount} tests · {Math.round(summary.totalTimeMs)} ms
          </p>
        </div>

        {summary.setupError && (
          <pre className="bg-destructive/10 text-destructive overflow-x-auto rounded-md p-3 text-xs whitespace-pre-wrap">
            {summary.setupError}
          </pre>
        )}

        <div className="grid gap-1.5">
          {summary.results.map((r, i) => (
            <div key={i} className="rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                {r.passed ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="text-destructive size-4 shrink-0" />
                )}
                <span className="font-medium">
                  Test {i + 1}
                  {r.hidden ? ' (hidden)' : ''}
                </span>
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                  {r.timeMs.toFixed(1)} ms
                </span>
              </div>
              {!r.passed && !r.hidden && (
                <div className="text-muted-foreground mt-1 grid gap-0.5 pl-6 font-mono text-xs">
                  {r.error ? (
                    <span className="text-destructive">{r.error}</span>
                  ) : (
                    <>
                      <span>expected: {JSON.stringify(r.expected)}</span>
                      <span>received: {JSON.stringify(r.output)}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
