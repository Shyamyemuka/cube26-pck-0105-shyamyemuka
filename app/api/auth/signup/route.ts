import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, display_name, org_id, org_name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const assignedOrgId = (org_id || 'org_demo_alpha').trim();
    const assignedOrgName = (org_name || assignedOrgId).trim();
    const displayName = (display_name || email.split('@')[0]).trim();

    const supabase = createAdminClient();

    // 1. Ensure the Organization exists in public.orgs
    const { error: orgErr } = await supabase.from('orgs').upsert(
      { id: assignedOrgId, name: assignedOrgName },
      { onConflict: 'id' }
    );
    if (orgErr) {
      console.warn('Org upsert warning:', orgErr.message);
    }

    // 2. Create the user in Supabase Auth
    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        org_id: assignedOrgId,
      },
    });

    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 400 });
    }

    const userId = userData.user.id;

    // 3. Upsert user Profile in public.profiles
    const { error: profileErr } = await supabase.from('profiles').upsert(
      {
        user_id: userId,
        org_id: assignedOrgId,
        display_name: displayName,
        role: 'operator',
      },
      { onConflict: 'user_id' }
    );

    if (profileErr) {
      console.warn('Profile creation warning:', profileErr.message);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        display_name: displayName,
        org_id: assignedOrgId,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 });
  }
}
