import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  Award,
  BookCheck,
  BookOpen,
  Brain,
  CalendarCheck,
  Crown,
  Flame,
  GraduationCap,
  Grid3x3,
  Hash,
  Lock,
  Medal,
  Repeat2,
  Star,
  Swords,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { getAchievements, type AchievementView } from '@/features/achievements/server/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Achievements — DSA Quest' }

const ICONS: Record<string, LucideIcon> = {
  Target,
  Swords,
  Crown,
  BookOpen,
  GraduationCap,
  BookCheck,
  CalendarCheck,
  Flame,
  Repeat2,
  Brain,
  Star,
  Medal,
  Grid3x3,
  Hash,
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { groups, earnedCount, total, xpFromAchievements } = await getAchievements(user.id)

  return (
    <main className="mx-auto grid max-w-4xl gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground text-sm">
            Milestones across solving, learning, streaks, and mastery.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="size-5 text-amber-500" />
          <span className="font-semibold tabular-nums">
            {earnedCount}/{total}
          </span>
          <span className="text-muted-foreground">unlocked</span>
          {xpFromAchievements > 0 && (
            <span className="text-muted-foreground">· {xpFromAchievements} XP earned</span>
          )}
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.category} className="grid gap-3">
          <h2 className="text-muted-foreground text-sm font-medium">{group.category}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <AchievementCard key={item.slug} item={item} />
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}

function AchievementCard({ item }: { item: AchievementView }) {
  const Icon = (item.icon && ICONS[item.icon]) || Award
  const pct = item.target > 0 ? Math.round((item.current / item.target) * 100) : 0

  return (
    <Card className={cn(!item.earned && 'opacity-90')}>
      <CardContent className="flex gap-3 py-4">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg',
            item.earned ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground'
          )}
        >
          {item.earned ? <Icon className="size-5" /> : <Lock className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {item.xpReward} XP
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">{item.description}</p>
          {item.earned ? (
            <p className="mt-2 text-xs font-medium text-emerald-600">
              Unlocked
              {item.earnedAt && ` · ${new Date(item.earnedAt).toLocaleDateString()}`}
            </p>
          ) : item.target > 1 ? (
            <div className="mt-2 flex items-center gap-2">
              <Progress value={pct} className="h-1.5" />
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {item.current}/{item.target}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
