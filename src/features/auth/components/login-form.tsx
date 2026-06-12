'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
import { login } from '@/features/auth/actions'
import { AuthMessage } from './auth-message'
import { GoogleButton } from './google-button'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null)
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const linkError = searchParams.get('error')

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Pick up right where you left off.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          {next && <input type="hidden" name="next" value={next} />}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-muted-foreground text-xs underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <AuthMessage state={state} />
          {linkError && !state && (
            <p className="text-destructive text-sm">That link didn&apos;t work. Please log in.</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Logging in…' : 'Log in'}
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
        <span className="text-muted-foreground">New here?&nbsp;</span>
        <Link href="/signup" className="underline-offset-4 hover:underline">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  )
}
