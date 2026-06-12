import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ProblemWorkspace } from '@/features/problems/components/problem-workspace'
import { getSolvedProblemIds, getWorkspaceProblem } from '@/features/problems/server/queries'
import { createClient } from '@/lib/supabase/server'

type Params = { problemSlug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { problemSlug } = await params
  return { title: `${problemSlug} — DSA Quest` }
}

export default async function ProblemPage({ params }: { params: Promise<Params> }) {
  const { problemSlug } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [problem, solved] = await Promise.all([
    getWorkspaceProblem(problemSlug),
    getSolvedProblemIds(user.id),
  ])
  if (!problem) notFound()

  return (
    <main className="mx-auto grid max-w-6xl gap-4 p-4 md:p-6">
      <Link
        href="/practice"
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" /> All problems
      </Link>
      <ProblemWorkspace problem={problem} initiallySolved={solved.has(problem.id)} />
    </main>
  )
}
