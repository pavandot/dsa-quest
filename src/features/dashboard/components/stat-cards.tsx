import Link from 'next/link'
import { BookOpenCheck, Flame, Sparkles, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { levelProgress } from '@/features/gamification/levels'

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  href?: string
}) {
  const body = (
    <CardContent className="flex items-start gap-3 pt-2">
      <div className="bg-muted text-muted-foreground rounded-md p-2">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        {sub && <div className="text-muted-foreground mt-1 text-xs">{sub}</div>}
      </div>
    </CardContent>
  )
  return (
    <Card className={href ? 'hover:bg-muted/40 transition-colors' : undefined}>
      {href ? <Link href={href}>{body}</Link> : body}
    </Card>
  )
}

export function StatCards({
  streak,
  xp,
  reviewsDue,
  completedLessons,
  totalLessons,
}: {
  streak: number
  xp: number
  reviewsDue: number
  completedLessons: number
  totalLessons: number
}) {
  const lp = levelProgress(xp)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={<Flame className="size-4" />}
        label="Current streak"
        value={`${streak} day${streak === 1 ? '' : 's'}`}
        sub={streak === 0 ? 'Complete a lesson to start one' : 'Keep it alive today'}
      />
      <StatCard
        icon={<Zap className="size-4" />}
        label={`Level ${lp.level}`}
        value={`${xp} XP`}
        sub={
          <span className="flex items-center gap-2">
            <Progress value={lp.percent} className="h-1.5 w-full max-w-24" />
            <span className="tabular-nums">
              {lp.intoLevel}/{lp.needed}
            </span>
          </span>
        }
      />
      <StatCard
        icon={<Sparkles className="size-4" />}
        label="Today's reviews"
        value={reviewsDue}
        sub={reviewsDue > 0 ? 'Due now — reviews before new lessons' : 'Nothing due. Nice.'}
        href="/reviews"
      />
      <StatCard
        icon={<BookOpenCheck className="size-4" />}
        label="Lessons completed"
        value={`${completedLessons}/${totalLessons}`}
        sub="Across the whole course"
      />
    </div>
  )
}
