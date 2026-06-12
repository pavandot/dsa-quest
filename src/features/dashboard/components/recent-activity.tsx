import { Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ActivityRow = {
  id: string
  activity_type: string
  created_at: string
  metadata: unknown
}

const TYPE_LABEL: Record<string, string> = {
  lesson: 'Completed a lesson',
  problem: 'Solved a problem',
  quiz: 'Passed a quiz',
  review: 'Finished a review',
}

function describe(row: ActivityRow): string {
  const meta = (row.metadata ?? {}) as { title?: string }
  const base = TYPE_LABEL[row.activity_type] ?? row.activity_type
  return meta.title ? `${base}: ${meta.title}` : base
}

export function RecentActivity({ rows }: { rows: ActivityRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing yet — your first lesson will show up here.
          </p>
        ) : (
          <ul className="grid gap-3">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-2 text-sm">
                <Activity className="text-muted-foreground size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{describe(row)}</span>
                <time className="text-muted-foreground shrink-0 text-xs">
                  {new Date(row.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
