import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Cookie-less anon client for world-readable data (curriculum, achievements).
 * Safe inside unstable_cache because it never touches request state.
 */
export function createStaticClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
