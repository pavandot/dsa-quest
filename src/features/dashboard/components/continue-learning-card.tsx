import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ResumePoint } from '@/features/progress/server/queries'

const LESSON_TYPE_LABEL: Record<string, string> = {
  theory: 'Theory',
  example: 'Guided Example',
  quiz: 'Quick Quiz',
  practice: 'Practice',
  revision: 'Revision',
}

export function ContinueLearningCard({ resume }: { resume: ResumePoint }) {
  const { current, lessonNumber, lessonsInChapter, coursePercent, isCourseComplete } = resume
  const hasStarted = resume.completedCount > 0

  const lessonHref = `/learn/${current.week.slug}/${current.chapter.slug}/${current.lesson.slug}`

  return (
    <Card className="border-primary/20 from-primary/5 bg-gradient-to-br to-transparent">
      <CardContent className="flex flex-col gap-4 pt-2">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">
            Phase {current.phase.position} · {current.phase.title}
          </Badge>
          <Badge variant="outline">
            Week {current.week.position} · {current.week.title}
          </Badge>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {isCourseComplete ? 'Course complete — legendary.' : current.chapter.title}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {isCourseComplete ? (
              'Every lesson is done. Keep your skills sharp in Reviews.'
            ) : (
              <>
                {LESSON_TYPE_LABEL[current.lesson.type] ?? current.lesson.title} · Lesson{' '}
                {lessonNumber}/{lessonsInChapter}
                <span className="mx-2">·</span>
                <Clock className="mb-0.5 inline size-3.5" /> ~{current.lesson.estimated_minutes} min
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Progress value={coursePercent} className="h-2 flex-1" />
          <span className="text-muted-foreground text-xs tabular-nums">
            {coursePercent}% of course
          </span>
        </div>

        <div>
          <Button asChild size="lg" className="gap-2">
            <Link href={isCourseComplete ? '/reviews' : lessonHref}>
              {isCourseComplete
                ? 'Go to Reviews'
                : hasStarted
                  ? 'Continue Learning'
                  : 'Start Learning'}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
