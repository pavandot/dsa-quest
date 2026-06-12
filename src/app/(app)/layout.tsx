import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MainNav } from '@/components/app-shell/main-nav'
import { UserMenu } from '@/components/app-shell/user-menu'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-svh">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/dashboard" className="font-semibold tracking-tight whitespace-nowrap">
            ⚔️ DSA Quest
          </Link>
          <MainNav />
          <div className="ml-auto">
            <UserMenu
              username={profile?.username ?? 'user'}
              displayName={profile?.display_name ?? null}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
