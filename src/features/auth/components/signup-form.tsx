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
import { Separator } from '@/components/ui/separator'
import { signup } from '@/features/auth/actions'
import { AuthMessage } from './auth-message'
import { GoogleButton } from './google-button'

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, null)

  if (state?.success) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Confirm your email</CardTitle>
          <CardDescription>{state.success}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center text-sm">
          <Link href="/login" className="underline-offset-4 hover:underline">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Start your quest</CardTitle>
        <CardDescription>20 weeks from arrays to dynamic programming.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="text-muted-foreground text-xs">At least 8 characters.</p>
          </div>
          <AuthMessage state={state} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <div className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <Separator className="flex-1" />
        </div>
        <GoogleButton />
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <span className="text-muted-foreground">Already have an account?&nbsp;</span>
        <Link href="/login" className="underline-offset-4 hover:underline">
          Log in
        </Link>
      </CardFooter>
    </Card>
  )
}
