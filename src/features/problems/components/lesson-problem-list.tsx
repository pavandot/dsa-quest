import Link from 'next/link'
import { CheckCircle2, Circle, Code2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type LinkedProblem = {
  id: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  xp_reward: number
  isRequired: boolean
}

const DIFFICULTY_STYLE = {
  easy: 'text-emerald-600',
  medium: 'text-amber-600',
  hard: 'text-red-600',
} as const

export function LessonProblemList({
  problems,
  solvedIds,
}: {
  problems: LinkedProblem[]
  solvedIds: Set<string>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code2 className="size-4" /> Problems in this lesson
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        {problems.map((p) => (
          <Link
            key={p.id}
            href={`/practice/${p.slug}`}
            className="hover:bg-muted/50 flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors"
          >
            {solvedIds.has(p.id) ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="text-muted-foreground/40 size-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
            <span className={cn('text-xs capitalize', DIFFICULTY_STYLE[p.difficulty])}>
              {p.difficulty}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">{p.xp_reward} XP</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
