'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

export type AuthState = { error?: string; success?: string } | null

const credentialsSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function safeNext(value: FormDataEntryValue | null): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/dashboard'
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: 'Invalid email or password.' }

  revalidatePath('/', 'layout')
  redirect(safeNext(formData.get('next')))
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
  })
  if (error) return { error: error.message }
  // Supabase signals "email already registered" with an empty identities array
  if (data.user && data.user.identities?.length === 0) {
    return { error: 'An account with this email already exists. Try logging in.' }
  }
  return { success: 'Check your inbox — we sent you a confirmation link.' }
}

export async function forgotPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.email('Enter a valid email address').safeParse(formData.get('email'))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  })
  // identical response whether or not the account exists — no email enumeration
  return { success: 'If an account exists for that email, a reset link is on its way.' }
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: 'Passwords do not match' })
    .safeParse({ password: formData.get('password'), confirm: formData.get('confirm') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
