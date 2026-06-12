import { cn } from '@/lib/utils'
import type { AuthState } from '@/features/auth/actions'

export function AuthMessage({ state }: { state: AuthState }) {
  if (!state?.error && !state?.success) return null
  return (
    <p
      role="status"
      className={cn('text-sm', state.error ? 'text-destructive' : 'text-emerald-600')}
    >
      {state.error ?? state.success}
    </p>
  )
}
