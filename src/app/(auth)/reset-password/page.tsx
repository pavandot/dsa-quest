import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'

export const metadata: Metadata = { title: 'New password — DSA Quest' }

// requires the temporary session granted by the recovery email link
export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/forgot-password')

  return <ResetPasswordForm />
}
