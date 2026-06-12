import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityDay } from '@/features/dashboard/server/queries'

const LEVELS = [
  'bg-muted',
  'bg-emerald-200 dark:bg-emerald-900',
  'bg-emerald-400 dark:bg-emerald-700',
  'bg-emerald-500 dark:bg-emerald-600',
  'bg-emerald-600 dark:bg-emerald-500',
]

function intensity(count: number): string {
  return LEVELS[Math.min(count, LEVELS.length - 1)]!
}

/** GitHub-style study heatmap: 17 weeks × 7 days, server-rendered. */
export function StudyHeatmap({ activity }: { activity: ActivityDay[] }) {
  const counts = new Map(activity.map((a) => [a.date, a.count]))

  // grid ends today, starts on the Sunday 16 weeks back
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - start.getDay() - 16 * 7)

  const weeks: { date: string; count: number; future: boolean }[][] = []
  const cursor = new Date(start)
  for (let w = 0; w < 17; w++) {
    const week: { date: string; count: number; future: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10)
      week.push({ date: iso, count: counts.get(iso) ?? 0, future: cursor > today })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Study activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {weeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                  className={`size-3 rounded-[3px] ${day.future ? 'opacity-0' : intensity(day.count)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
