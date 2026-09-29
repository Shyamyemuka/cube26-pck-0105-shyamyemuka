import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Admin client using SUPABASE_SERVICE_ROLE_KEY.
 * SERVER-ONLY! Bypasses Row-Level Security.
 * Permitted only in:
 * - scripts/seed.ts
 * - scripts/isolation-test.ts
 * - eval/
 * - /api/v1/evidence endpoints (ONLY AFTER validating bearer token and filtering org_id explicitly)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment'
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
