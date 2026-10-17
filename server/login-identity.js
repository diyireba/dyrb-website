import { createHash } from 'node:crypto'

export function normalizePhone(raw) {
  const value = String(raw || '').trim().replace(/[\s()-]/g, '')
  if (value.startsWith('+')) return value
  if (value.startsWith('60')) return `+${value}`
  if (value.startsWith('0')) return `+60${value.slice(1)}`
  return `+60${value}`
}

export function staffLoginId(raw) { return String(raw || '').trim().toLowerCase() }
export function validStaffLoginId(value) { return /^[a-z][a-z0-9._-]{2,31}$/.test(value) }
export function staffLoginEmail(id) {
  if (!validStaffLoginId(id)) throw new Error('Invalid staff user ID.')
  return `staff.${id}@login.dyrb.invalid`
}
export function memberLoginEmail(phone) {
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('Invalid member phone.')
  return `member.${createHash('sha256').update(phone).digest('hex')}@login.dyrb.invalid`
}
