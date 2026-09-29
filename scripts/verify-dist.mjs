/**
 * Loads each built file the way its consumers do and checks it exports the class.
 * Run after `npm run build`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const check = (Forcify, how) => {
  assert.equal(typeof Forcify, 'function', `${how}: not a class`)
  assert.equal(Forcify.version, pkg.version, `${how}: wrong version`)
  assert.equal(typeof Forcify.haptic, 'function', `${how}: missing statics`)
  console.log(`ok  ${how}`)
}

check((await import('forcify')).default, 'import "forcify"')
check(createRequire(import.meta.url)('forcify'), 'require("forcify")')

for (const file of ['dist/forcify.min.js', 'dist/forcify.umd.js']) {
  const code = readFileSync(file, 'utf8')

  const global = {}
  vm.runInNewContext(code, { self: global })
  check(global.Forcify, `${file} as <script>`)

  let amd
  const define = (deps, factory) => { amd = factory() }
  define.amd = true
  vm.runInNewContext(code, { define, self: {} })
  check(amd, `${file} with AMD`)
}
