import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** PKCE code exchange — lands here from OAuth and Supabase email links. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const target = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${target}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
