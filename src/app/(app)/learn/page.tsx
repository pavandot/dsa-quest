import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Learn — DSA Quest' }

export default function LearnPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          The curriculum map lands here in the next feature — phases, weeks, and chapters with
          unlock states.
        </CardContent>
      </Card>
    </main>
  )
}
