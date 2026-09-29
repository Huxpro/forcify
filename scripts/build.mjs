/**
 * Builds the distributable files:
 *
 *   dist/forcify.mjs      ES module
 *   dist/forcify.cjs      UMD (CommonJS, AMD and <script>)
 *   dist/forcify.umd.js   same, for <script> tags
 *   dist/forcify.min.js   minified UMD, the file CDN links point at
 *   dist/*.d.ts           type declarations
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { build } from 'esbuild'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const banner = `/*! Forcify v${pkg.version} | MIT License | https://github.com/Huxpro/forcify */`

const umdHead =
  '(function (root, factory) {' +
  "if (typeof define === 'function' && define.amd) define([], factory);" +
  "else if (typeof module === 'object' && module.exports) module.exports = factory();" +
  'else root.Forcify = factory();' +
  "})(typeof self !== 'undefined' ? self : this, function () {"

const common = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  target: 'es2015',
  define: { __VERSION__: JSON.stringify(pkg.version) },
  logLevel: 'warning',
}

rmSync('dist', { recursive: true, force: true })

await build({ ...common, format: 'esm', outfile: 'dist/forcify.mjs', banner: { js: banner }, sourcemap: true })

for (const [outfile, minify] of [
  ['dist/forcify.cjs', false],
  ['dist/forcify.umd.js', false],
  ['dist/forcify.min.js', true],
]) {
  await build({
    ...common,
    format: 'iife',
    globalName: '__forcify',
    outfile,
    minify,
    banner: { js: `${banner}\n${umdHead}` },
    footer: { js: 'return __forcify.default;\n});' },
  })
}

execFileSync('npx', ['tsc', '-p', 'tsconfig.build.json'], { stdio: 'inherit' })
// CommonJS consumers get the class itself from require('forcify').
const typeNames = [...readFileSync('src/index.ts', 'utf8').matchAll(/^\s+(\w+),$/gm)].map((m) => m[1])
writeFileSync(
  'dist/index.d.cts',
  [
    "import type _Forcify from './index.js'",
    "import type * as T from './index.js'",
    'declare const Forcify: typeof _Forcify',
    'type Forcify = _Forcify',
    'declare namespace Forcify {',
    ...typeNames.map((name) =>
      name === 'ForcifyHandler'
        ? '  type ForcifyHandler<K extends T.ForcifyEventName = T.ForcifyEventName> = T.ForcifyHandler<K>'
        : `  type ${name} = T.${name}`,
    ),
    '}',
    'export = Forcify',
    '',
  ].join('\n'),
)

const min = readFileSync('dist/forcify.min.js')
console.log(`dist/forcify.min.js  ${(min.length / 1024).toFixed(1)} kB, ${(gzipSync(min).length / 1024).toFixed(1)} kB gzipped`)
