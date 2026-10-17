import { createClient } from '@supabase/supabase-js'
import { createWebhookHandler } from '../server/telegram.js'

export const config = { maxDuration: 60 }

export default async function handler(req: any, res: any) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const db = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null
  return createWebhookHandler({ db, token: process.env.TELEGRAM_BOT_TOKEN, secret: process.env.TELEGRAM_WEBHOOK_SECRET })(req, res)
}
