// Preview by default. --apply adds internal email identities without changing passwords or UUIDs.
import { createClient } from '@supabase/supabase-js'
import { normalizePhone, memberLoginEmail, staffLoginEmail, validStaffLoginId } from '../server/login-identity.js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY locally. Never paste the service key into chat.')
  process.exit(1)
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const apply = process.argv.includes('--apply')
async function allRows(table, columns) {
  const rows = []
  for (let start = 0; ; start += 1000) {
    const { data, error } = await admin.from(table).select(columns).order(table === 'members' ? 'id' : 'user_id').range(start, start + 999)
    if (error) throw new Error(`Cannot read ${table}. Run supabase/login-ids.sql first.`)
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}
try {
  const staff = await allRows('staff_profiles', 'user_id,display_name,login_id,role')
  const members = await allRows('members', 'id,phone')
  if (members.some(member => staff.some(person => person.user_id === member.id))) throw new Error('An account has both staff and member profiles. Resolve this account before migration.')
  const used = new Set(staff.filter(row => row.login_id).map(row => row.login_id))
  const plan = []
  for (const person of staff) {
    let id = person.login_id
    if (!id) {
      id = person.role === 'owner' && !used.has('owner') ? 'owner' : `${person.role}_${person.user_id.replaceAll('-', '').slice(0, 12)}`
      if (used.has(id)) throw new Error('A generated staff user ID conflicts. Assign login_id manually before retrying.')
      used.add(id)
    }
    if (!validStaffLoginId(id)) throw new Error('Invalid staff login_id. Correct it before migration.')
    plan.push({ uuid: person.user_id, email: staffLoginEmail(id), loginId: id, name: person.display_name })
  }
  for (const member of members) plan.push({ uuid: member.id, email: memberLoginEmail(normalizePhone(member.phone)) })
  // Preflight every account before changing any account. Existing real email identities are retained.
  for (const entry of plan) {
    const { data, error } = await admin.auth.admin.getUserById(entry.uuid)
    if (error || !data.user) throw new Error('An existing auth account could not be read.')
    if (data.user.email && data.user.email !== entry.email) throw new Error('An account already has a different email. Review it before replacing its login identity.')
  }
  for (const entry of plan) {
    if (apply) {
      const { error } = await admin.auth.admin.updateUserById(entry.uuid, { email: entry.email, email_confirm: true })
      if (error) throw new Error('Auth migration stopped. No passwords were changed. Correct the account and rerun safely.')
      if (entry.loginId) {
        const { error: profileError } = await admin.from('staff_profiles').update({ login_id: entry.loginId }).eq('user_id', entry.uuid)
        if (profileError) throw new Error('Staff profile migration stopped. Rerun to finish linking its user ID.')
      }
    }
    if (entry.loginId) console.log(`${apply ? 'Ready' : 'Planned'}: ${entry.name} — user ID: ${entry.loginId}`)
  }
  console.log(`${apply ? 'Migrated' : 'Previewed'} ${staff.length} staff and ${members.length} members. Passwords, roles, balances and account UUIDs are unchanged.`)
  if (!apply) console.log('Review the staff IDs, then rerun with --apply.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
