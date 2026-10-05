import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS } from '../_shared/cors.ts'

// Admin-only actions on auth.users that the client-side Supabase SDK has no
// public-safe way to do itself (set someone else's password, ban/unban a
// login, or list every account's confirm/ban/last-login status) — all
// require the service_role key, which must never reach the browser. This
// function holds it instead; every request re-verifies the caller is
// actually GOD or holds `system_setting` before touching anything, never
// trusting the client's own UI gating alone.
//
// Deliberately does NOT cover: delete (the existing Member-tab flow —
// delete the profiles row — already cascades to auth.users via
// trg_delete_auth_user), resend-confirmation or reset-password emails
// (both public-safe client methods — supabaseClient.auth.resend() /
// resetPasswordForEmail()), or the project-wide "require email
// confirmation" toggle (a Management API setting, a different and more
// powerful credential than service_role — explicitly out of scope,
// decided against 2026-10-05).

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) throw new Error('Missing Authorization')

    // Verify the caller's own session is real (their JWT, their anon-key
    // client — never trust a userId passed in the body alone).
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser(jwt)
    if (callerErr || !caller) throw new Error('Invalid session')

    // Service-role client — for the caller's own admin-status check AND
    // the actual privileged work below.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('level, codename')
      .eq('id', caller.id)
      .single()
    if (!callerProfile) throw new Error('Profile not found')

    let authorized = callerProfile.level === 'god'
    if (!authorized) {
      const { data: access } = await admin
        .from('system_access')
        .select('system_setting')
        .eq('codename', callerProfile.codename)
        .single()
      authorized = !!access?.system_setting
    }
    if (!authorized) throw new Error('Forbidden — requires GOD or system_setting access')

    const { action, userId, newPassword } = await req.json()

    // list — powers the Access tab's table. auth.users isn't reachable via
    // the normal PostgREST client at all (not an exposed schema), so even
    // just listing confirm/ban/last-login status needs to go through here.
    if (action === 'list') {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (error) throw error
      const users = data.users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at,
        banned_until: u.banned_until,
        last_sign_in_at: u.last_sign_in_at,
      }))
      return new Response(JSON.stringify({ ok: true, users }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // Every other action targets one specific user — guard against
    // touching GOD accounts (privilege-escalation/lockout risk) and
    // against an admin banning their own session by mistake.
    if (!userId) throw new Error('Missing userId')
    const { data: targetProfile } = await admin.from('profiles').select('level').eq('id', userId).single()
    if (targetProfile?.level === 'god') throw new Error('Cannot modify a GOD account')

    if (action === 'set_password') {
      if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters')
      const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
      if (error) throw error
    } else if (action === 'ban') {
      if (userId === caller.id) throw new Error("Can't disable your own login")
      const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' }) // ~100 years, effectively indefinite until explicitly unbanned
      if (error) throw error
    } else if (action === 'unban') {
      const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' })
      if (error) throw error
    } else {
      throw new Error('Unknown action')
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
