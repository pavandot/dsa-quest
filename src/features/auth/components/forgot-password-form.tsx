'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword } from '@/features/auth/actions'
import { AuthMessage } from './auth-message'

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPassword, null)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>We&apos;ll email you a link to set a new one.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <AuthMessage state={state} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to login
        </Link>
      </CardFooter>
    </Card>
  )
}
