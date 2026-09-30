import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Supabase credentials missing on server' }, { status: 500 });
    }

    // Authenticate with Supabase Auth
    const client = createSupabaseClient(url, anonKey);
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Fetch user profile from public.profiles
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    const orgId = profile?.org_id || authData.user.user_metadata?.org_id || 'org_demo_alpha';
    const displayName = profile?.display_name || authData.user.user_metadata?.display_name || email.split('@')[0];

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        display_name: displayName,
        org_id: orgId,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
