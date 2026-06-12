import Link from 'next/link'
import { CheckCircle2, CirclePlay, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { flattenLessons, type CourseTree } from '@/features/curriculum/server/queries'

type ChapterState = 'completed' | 'current' | 'unlocked' | 'locked'

export function CurriculumMap({ tree, completed }: { tree: CourseTree; completed: Set<string> }) {
  const flat = flattenLessons(tree)
  const frontierIndex = flat.find((f) => !completed.has(f.lesson.id))?.index ?? flat.length
  const indexOf = new Map(flat.map((f) => [f.lesson.id, f.index]))

  return (
    <div className="grid gap-8">
      {tree.phases.map((phase) => (
        <section key={phase.id} className="grid gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Phase {phase.position} — {phase.title}
            </h2>
            {phase.description && (
              <p className="text-muted-foreground text-sm">{phase.description}</p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {phase.weeks.map((week) => {
              const weekLessons = week.chapters.flatMap((c) => c.lessons)
              const done = weekLessons.filter((l) => completed.has(l.id)).length
              const pct = Math.round((done / weekLessons.length) * 100)

              return (
                <Card key={week.id} className={cn(pct === 100 && 'border-emerald-500/40')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-baseline justify-between text-base">
                      <span>
                        Week {week.position} · {week.title}
                      </span>
                      <Badge variant={pct === 100 ? 'default' : 'secondary'}>
                        {done}/{weekLessons.length}
                      </Badge>
                    </CardTitle>
                    {week.goal && <p className="text-muted-foreground text-xs">{week.goal}</p>}
                    <Progress value={pct} className="mt-1 h-1.5" />
                  </CardHeader>
                  <CardContent className="grid gap-1">
                    {week.chapters.map((chapter) => {
                      const ids = chapter.lessons.map((l) => l.id)
                      const allDone = ids.every((id) => completed.has(id))
                      const firstIndex = indexOf.get(ids[0] ?? '') ?? Infinity
                      const containsFrontier =
                        frontierIndex >= firstIndex &&
                        frontierIndex <= (indexOf.get(ids[ids.length - 1] ?? '') ?? -1)
                      const state: ChapterState = allDone
                        ? 'completed'
                        : containsFrontier
                          ? 'current'
                          : firstIndex < frontierIndex
                            ? 'unlocked'
                            : 'locked'

                      const resumeLesson =
                        chapter.lessons.find((l) => !completed.has(l.id)) ?? chapter.lessons[0]
                      const href = resumeLesson
                        ? `/learn/${week.slug}/${chapter.slug}/${resumeLesson.slug}`
                        : '/learn'

                      const row = (
                        <span
                          className={cn(
                            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                            state === 'locked' && 'text-muted-foreground/60',
                            state === 'current' && 'bg-primary/5 font-medium',
                            state !== 'locked' && 'hover:bg-muted/60 transition-colors'
                          )}
                        >
                          {state === 'completed' ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                          ) : state === 'locked' ? (
                            <Lock className="size-3.5 shrink-0" />
                          ) : (
                            <CirclePlay className="text-primary size-4 shrink-0" />
                          )}
                          {chapter.title}
                          {state === 'current' && (
                            <Badge variant="secondary" className="ml-auto">
                              Continue
                            </Badge>
                          )}
                        </span>
                      )

                      return state === 'locked' ? (
                        <div key={chapter.id}>{row}</div>
                      ) : (
                        <Link key={chapter.id} href={href}>
                          {row}
                        </Link>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
