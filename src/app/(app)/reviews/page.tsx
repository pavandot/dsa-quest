import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Brain, CalendarClock, CheckCircle2, GraduationCap, Repeat2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getReviewQueue, type MasteryStatus, type ReviewItem } from '@/features/reviews/server/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Reviews — DSA Quest' }

const LADDER = [1, 3, 7, 14, 30]

const DIFFICULTY_STYLE = {
  easy: 'text-emerald-600',
  medium: 'text-amber-600',
  hard: 'text-red-600',
} as const

const MASTERY_STYLE: Record<MasteryStatus, string> = {
  new: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
  learning: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  practicing: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  mastered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
}

function relativeDue(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const hours = Math.round(diffMs / 36e5)
  if (hours <= 0) return 'due now'
  if (hours < 24) return `in ${hours}h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

export default async function ReviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { due, upcoming, counts } = await getReviewQueue(user.id)

  return (
    <main className="mx-auto grid max-w-4xl gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground text-sm">
          Spaced repetition on a 1 · 3 · 7 · 14 · 30-day ladder. Re-solve a due problem to climb it;
          slip up and it resets. Clear these before new lessons.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={<Repeat2 className="size-4" />} label="Due now" value={counts.due} />
        <StatChip icon={<Brain className="size-4" />} label="Learning" value={counts.learning} />
        <StatChip
          icon={<GraduationCap className="size-4" />}
          label="Practicing"
          value={counts.practicing}
        />
        <StatChip
          icon={<CheckCircle2 className="size-4" />}
          label="Mastered"
          value={counts.mastered}
        />
      </div>

      {counts.total === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground grid gap-3 py-12 text-center text-sm">
            <p>Your review queue is empty.</p>
            <p>
              Every problem you solve enters spaced repetition automatically.{' '}
              <Link href="/practice" className="text-foreground underline underline-offset-4">
                Solve your first problem
              </Link>{' '}
              to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-3">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="size-4" /> Due now
              <Badge variant="secondary" className="tabular-nums">
                {due.length}
              </Badge>
            </h2>
            {due.length === 0 ? (
              <Card>
                <CardContent className="text-muted-foreground py-8 text-center text-sm">
                  All caught up — nothing due right now.
                  {upcoming[0] && <> Next review {relativeDue(upcoming[0].dueAt)}.</>}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="grid divide-y p-0">
                  {due.map((item) => (
                    <DueRow key={item.problemId} item={item} />
                  ))}
                </CardContent>
              </Card>
            )}
          </section>

          {upcoming.length > 0 && (
            <section className="grid gap-3">
              <h2 className="text-muted-foreground text-sm font-medium">Upcoming</h2>
              <Card>
                <CardContent className="grid divide-y p-0">
                  {upcoming.map((item) => (
                    <div
                      key={item.problemId}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                      <Badge variant="outline" className={cn('text-xs', MASTERY_STYLE[item.status])}>
                        {item.status}
                      </Badge>
                      <span className="text-muted-foreground w-24 text-right text-xs tabular-nums">
                        {relativeDue(item.dueAt)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </main>
  )
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <div className="bg-muted text-muted-foreground rounded-md p-2">{icon}</div>
        <div>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DueRow({ item }: { item: ReviewItem }) {
  const step = item.intervalIndex + 1
  const nextInterval = LADDER[Math.min(item.intervalIndex + 1, LADDER.length - 1)]
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="text-muted-foreground text-xs">
          Step {step} of {LADDER.length} · pass to schedule +{nextInterval}d
          {item.lapses > 0 && ` · ${item.lapses} lapse${item.lapses === 1 ? '' : 's'}`}
        </p>
      </div>
      <Badge variant="outline" className={cn('text-xs', MASTERY_STYLE[item.status])}>
        {item.status}
      </Badge>
      <span className={cn('text-xs capitalize', DIFFICULTY_STYLE[item.difficulty])}>
        {item.difficulty}
      </span>
      <Button asChild size="sm" className="gap-1">
        <Link href={`/practice/${item.slug}`}>Review</Link>
      </Button>
    </div>
  )
}
