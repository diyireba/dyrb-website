import { createRequire } from 'node:module'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const viteRequire = createRequire(require.resolve('vite'))
const { build } = viteRequire('esbuild')

await mkdir('output', { recursive: true })
const directory = await mkdtemp(resolve('output/netlify-check-'))
try {
  for (const name of ['admin', 'member-auth', 'telegram', 'telegram-events']) {
    const outfile = resolve(directory, `${name}.mjs`)
    await build({ entryPoints: [`netlify/functions/${name}.mts`], bundle: true, platform: 'node', target: 'node22', format: 'esm', outfile })
    const { default: handler } = await import(pathToFileURL(outfile).href)
    const response = await handler(new Request(`https://example.netlify.app/api/${name}`))
    assert.equal(response.status, 405, name)
    assert.match(response.headers.get('content-type'), /application\/json/)
    assert.deepEqual(await response.json(), { error: 'Method not allowed.' })
    console.log(`Netlify bundle + handler passed: /api/${name}`)
  }
} finally {
  // This verified temporary directory is created above inside this project's output folder.
  await rm(directory, { recursive: true })
}
