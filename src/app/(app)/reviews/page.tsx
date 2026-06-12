import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Reviews — DSA Quest' }

export default function ReviewsPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          Your spaced-repetition queue lives here once problems ship (Phase D/E).
        </CardContent>
      </Card>
    </main>
  )
}
