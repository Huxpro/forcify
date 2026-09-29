/**
 * Assembles the website into _site/:
 *
 *   _site/            site/ (the docs and demos)
 *   _site/dist/       the built library, at the URLs the old site served
 *   _site/examples/   the example pages
 *
 * Run `npm run build` first.
 */
import { cpSync, existsSync, rmSync } from 'node:fs'

if (!existsSync('dist/forcify.mjs')) {
  console.error('dist/ is missing: run `npm run build` first.')
  process.exit(1)
}

rmSync('_site', { recursive: true, force: true })
cpSync('site', '_site', { recursive: true })
cpSync('dist', '_site/dist', { recursive: true, filter: (src) => !/\.d\.c?ts$|[\/]inputs$/.test(src) })
cpSync('examples', '_site/examples', { recursive: true })
console.log('Built _site/ — preview with `npx serve _site`')
