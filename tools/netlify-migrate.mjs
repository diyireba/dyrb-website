// Opt-in only: Netlify runs this after a successful build, before publishing.
if (process.env.MIGRATE_LOGIN_ON_DEPLOY === 'true') {
  if (process.env.NETLIFY !== 'true' || process.env.CONTEXT !== 'production') {
    console.error('Login migration is restricted to Netlify production builds. No accounts changed.')
    process.exitCode = 1
  } else {
    process.argv.push('--apply')
    await import('./migrate-login.mjs')
  }
} else {
  console.log('Login migration is off. Set MIGRATE_LOGIN_ON_DEPLOY=true for the one-time production migration.')
}

if (!process.exitCode && process.env.SETUP_TELEGRAM_ON_DEPLOY === 'true') {
  if (process.env.NETLIFY !== 'true' || process.env.CONTEXT !== 'production') {
    console.error('Telegram setup is restricted to Netlify production builds. No webhook changed.')
    process.exitCode = 1
  } else {
    await import('./setup-telegram.mjs')
  }
}
