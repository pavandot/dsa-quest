import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FlatLesson } from '@/features/curriculum/server/queries'

export function UpcomingLessons({ upcoming }: { upcoming: FlatLesson[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Up next</CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">You&apos;re at the end of the course.</p>
        ) : (
          <ul className="grid gap-3">
            {upcoming.map((f) => (
              <li key={f.lesson.id} className="flex items-center gap-2 text-sm">
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {f.chapter.title} — {f.lesson.title}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    Week {f.week.position} · {f.week.title}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
