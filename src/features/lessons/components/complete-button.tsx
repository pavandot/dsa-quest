'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { completeLesson } from '@/features/progress/actions'

export function CompleteButton({
  lessonId,
  nextHref,
  isCompleted,
}: {
  lessonId: string
  nextHref: string
  isCompleted: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (isCompleted) {
    return (
      <Button onClick={() => router.push(nextHref)} className="gap-2">
        <Check className="size-4" /> Completed — next lesson <ArrowRight className="size-4" />
      </Button>
    )
  }

  return (
    <Button
      disabled={pending}
      className="gap-2"
      onClick={() =>
        startTransition(async () => {
          const result = await completeLesson({ lessonId })
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          if (result.xpAwarded > 0) {
            toast.success(`+${result.xpAwarded} XP`, {
              description: `Streak: ${result.streak} day${result.streak === 1 ? '' : 's'} · Level ${result.level}`,
            })
          }
          router.push(nextHref)
        })
      }
    >
      {pending ? 'Saving…' : 'Mark complete & continue'}
      <ArrowRight className="size-4" />
    </Button>
  )
}
