import { createClient } from '@supabase/supabase-js'

type VercelRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body?: any }
type VercelResponse = { status(code: number): VercelResponse; json(body: Record<string, unknown>): void }

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const allowedRoles = ['owner', 'boss', 'manager', 'staff', 'singer']

function reply(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body)
}

function normalizePhone(raw: unknown) {
  const value = String(raw || '').trim().replace(/[\s()-]/g, '')
  if (value.startsWith('+')) return value
  if (value.startsWith('60')) return `+${value}`
  if (value.startsWith('0')) return `+60${value.slice(1)}`
  return `+60${value}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed.' })
  if (!url || !anonKey || !serviceKey) return reply(res, 503, { error: 'Supabase server credentials are not configured.' })
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return reply(res, 401, { error: 'Sign in again to continue.' })

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) return reply(res, 401, { error: 'Sign in again to continue.' })
  const actorId = authData.user.id
  const { data: actor } = await admin.from('staff_profiles').select('role,active,display_name').eq('user_id', actorId).maybeSingle()
  if (!actor?.active) return reply(res, 403, { error: 'An active staff account is required.' })

  let body: any
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}) }
  catch { return reply(res, 400, { error: 'Invalid request. Please try again.' }) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(res, 400, { error: 'Invalid request.' })
  const action = String(body.action || '')
  const { data: actorPermissions } = await admin.from('role_permissions').select('permission_key').eq('role', actor.role).eq('enabled', true)
  const can = (key: string) => actor.role === 'owner' || Boolean(actorPermissions?.some((x) => x.permission_key === key))
  const canManageStaff = can('staff.manage')
  const canEnroll = can('members.enroll')
  const phone = normalizePhone(body.phone)
  const pin = String(body.pin || '')
  const name = String(body.name || '').trim()
  const validPhone = /^\+?[1-9]\d{7,14}$/.test(phone)
  const validPin = /^\d{6}$/.test(pin)

  try {
    if (action === 'enroll-member') {
      if (!canEnroll) return reply(res, 403, { error: 'Your role cannot enroll members.' })
      if (!name || name.length > 100 || !validPhone || !validPin) return reply(res, 400, { error: 'Enter a name, valid phone number, and 6-digit PIN.' })
      const { data: created, error: createError } = await admin.auth.admin.createUser({ phone, password: pin, phone_confirm: true, user_metadata: { display_name: name, account_type: 'member' } })
      if (createError || !created.user) return reply(res, 400, { error: 'Could not create that member account. Check whether the phone number is already registered.' })
      const { error: rowError } = await admin.from('members').insert({ id: created.user.id, display_name: name, phone, active: true })
      if (rowError) { await admin.auth.admin.deleteUser(created.user.id); return reply(res, 400, { error: 'Could not save the member record.' }) }
      await admin.from('audit_log').insert({ actor_id: actorId, action: 'member.enroll', entity: 'members', entity_id: created.user.id, details: { display_name: name } })
      return reply(res, 201, { id: created.user.id, name, phone })
    }

    if (action === 'reset-member-pin') {
      if (!canEnroll) return reply(res, 403, { error: 'Your role cannot reset member PINs.' })
      const id = String(body.id || '')
      if (!id || !validPin) return reply(res, 400, { error: 'Enter a new 6-digit PIN.' })
      const { data: member } = await admin.from('members').select('id,display_name').eq('id', id).maybeSingle()
      if (!member) return reply(res, 404, { error: 'Member not found.' })
      const { error } = await admin.auth.admin.updateUserById(id, { password: pin })
      if (error) return reply(res, 400, { error: 'Could not reset the PIN.' })
      await admin.from('audit_log').insert({ actor_id: actorId, action: 'member.pin.reset', entity: 'members', entity_id: id })
      return reply(res, 200, { ok: true })
    }

    if (action === 'add-staff') {
      if (!canManageStaff) return reply(res, 403, { error: 'Your role cannot manage staff accounts.' })
      if (!name || name.length > 100 || !validPhone || !validPin) return reply(res, 400, { error: 'Enter a name, valid phone number, and 6-digit PIN.' })
      const requestedRole = String(body.role || 'staff')
      const role = actor.role === 'owner' ? requestedRole : 'staff'
      if (!allowedRoles.includes(role)) return reply(res, 400, { error: 'Choose a valid staff role.' })
      const { data: created, error: createError } = await admin.auth.admin.createUser({ phone, password: pin, phone_confirm: true, user_metadata: { display_name: name, account_type: 'staff' } })
      if (createError || !created.user) return reply(res, 400, { error: 'Could not create that staff account. Check whether the phone number is already registered.' })
      const { error: rowError } = await admin.from('staff_profiles').insert({ user_id: created.user.id, display_name: name, phone, role, active: true })
      if (rowError) { await admin.auth.admin.deleteUser(created.user.id); return reply(res, 400, { error: 'Could not save the staff profile.' }) }
      await admin.from('audit_log').insert({ actor_id: actorId, action: 'staff.create', entity: 'staff_profiles', entity_id: created.user.id, details: { role } })
      return reply(res, 201, { id: created.user.id, name, phone, role, active: true })
    }

    if (action === 'toggle-staff') {
      if (!canManageStaff) return reply(res, 403, { error: 'Your role cannot manage staff accounts.' })
      const id = String(body.id || '')
      if (typeof body.active !== 'boolean') return reply(res, 400, { error: 'Choose a valid account status.' })
      const active = body.active
      if (!id || id === actorId) return reply(res, 400, { error: 'You cannot change your own account status here.' })
      const { data: target } = await admin.from('staff_profiles').select('role').eq('user_id', id).maybeSingle()
      if (!target || (actor.role !== 'owner' && ['owner', 'boss'].includes(target.role))) return reply(res, 403, { error: 'This staff account cannot be changed by your role.' })
      if (target.role === 'owner' && !active && actor.role === 'owner') {
        const { count } = await admin.from('staff_profiles').select('user_id', { count: 'exact', head: true }).eq('role', 'owner').eq('active', true)
        if ((count || 0) <= 1) return reply(res, 400, { error: 'At least one active owner account must remain.' })
      }
      const { error } = await admin.from('staff_profiles').update({ active }).eq('user_id', id)
      if (error) return reply(res, 400, { error: 'Could not update the staff account.' })
      await admin.from('audit_log').insert({ actor_id: actorId, action: active ? 'staff.activate' : 'staff.deactivate', entity: 'staff_profiles', entity_id: id })
      return reply(res, 200, { ok: true })
    }

    if (action === 'set-staff-role') {
      if (actor.role !== 'owner') return reply(res, 403, { error: 'Only the owner can change staff roles.' })
      const id = String(body.id || '')
      const role = String(body.role || '')
      if (!id || id === actorId || !allowedRoles.includes(role)) return reply(res, 400, { error: 'Choose a valid role for another staff account.' })
      const { data: target } = await admin.from('staff_profiles').select('role').eq('user_id', id).maybeSingle()
      if (!target) return reply(res, 404, { error: 'Staff account not found.' })
      const { error } = await admin.from('staff_profiles').update({ role }).eq('user_id', id)
      if (error) return reply(res, 400, { error: 'Could not update the role.' })
      await admin.from('audit_log').insert({ actor_id: actorId, action: 'staff.role.change', entity: 'staff_profiles', entity_id: id, details: { role } })
      return reply(res, 200, { ok: true })
    }
    return reply(res, 400, { error: 'Unknown admin action.' })
  } catch (error) {
    console.error('Admin action failed', error)
    return reply(res, 500, { error: 'The action could not be completed.' })
  }
}
