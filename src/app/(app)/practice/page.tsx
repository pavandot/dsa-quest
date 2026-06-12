import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Practice — DSA Quest' }

export default function PracticePage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          The problem-solving workspace (Monaco editor, test runner) arrives in Phase D.
        </CardContent>
      </Card>
    </main>
  )
}
