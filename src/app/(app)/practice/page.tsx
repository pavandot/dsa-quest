import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getSolvedProblemIds, listProblems } from '@/features/problems/server/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Practice — DSA Quest' }

const DIFFICULTY_STYLE = {
  easy: 'text-emerald-600',
  medium: 'text-amber-600',
  hard: 'text-red-600',
} as const

export default async function PracticePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [problems, solved] = await Promise.all([listProblems(), getSolvedProblemIds(user.id)])

  return (
    <main className="mx-auto grid max-w-4xl gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-muted-foreground text-sm">
          {solved.size}/{problems.length} solved · every solve enters your review queue
        </p>
      </div>

      <Card>
        <CardContent className="grid divide-y p-0">
          {problems.map((p) => (
            <Link
              key={p.id}
              href={`/practice/${p.slug}`}
              className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3 transition-colors"
            >
              {solved.has(p.id) ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="text-muted-foreground/40 size-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
              <span className={cn('text-xs capitalize', DIFFICULTY_STYLE[p.difficulty])}>
                {p.difficulty}
              </span>
              <div className="hidden gap-1 sm:flex">
                {p.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <span className="text-muted-foreground w-14 text-right text-xs tabular-nums">
                {p.xp_reward} XP
              </span>
            </Link>
          ))}
          {problems.length === 0 && (
            <p className="text-muted-foreground p-8 text-center text-sm">No problems yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
