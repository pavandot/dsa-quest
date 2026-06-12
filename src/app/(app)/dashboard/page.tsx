import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from '@/features/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Dashboard — DSA Quest' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login') // middleware handles this; belt and suspenders

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, xp, level, role')
    .eq('id', user.id)
    .single()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Welcome, {profile?.display_name ?? profile?.username ?? 'adventurer'}
          </CardTitle>
          <CardDescription>
            The real dashboard arrives in the next feature. Auth works — that&apos;s what this page
            proves.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Badge variant="secondary">Level {profile?.level ?? 1}</Badge>
          <Badge variant="secondary">{profile?.xp ?? 0} XP</Badge>
          <Badge variant="outline">@{profile?.username}</Badge>
          <form action={signOut} className="ml-auto">
            <Button variant="outline" type="submit">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
