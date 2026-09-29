/**
 * Runs the demos on the Forcify site.
 *
 * Every demo is a <section class="demo"> containing a .stage with its HTML
 * and a <script type="text/forcify"> with its code. The code shown on the
 * page is exactly the code that runs: it is executed with these helpers in
 * scope:
 *
 *   Forcify   the library (instances are tracked so "Reset" can destroy them)
 *   demo      the demo's .stage element
 *   $(sel)    demo.querySelector(sel)
 *   $$(sel)   demo.querySelectorAll(sel)
 *   log(msg)  append a line to the demo's event log
 */

import Forcify from './dist/forcify.mjs'

// Handy in the console.
window.Forcify = Forcify

// ------------------------------------------------------------------ hero

const orb = document.querySelector('.orb')
const hero = document.querySelector('.hero')
const readout = document.querySelector('.readout')
new Forcify(orb)
  .on('force', (e) => {
    hero.style.setProperty('--force', e.force)
    readout.innerHTML = `force ${e.force.toFixed(3)}<small>${e.source} · ${e.pointerType}</small>`
  })
  .on('pop', () => (readout.querySelector('small').textContent += ' · pop!'))

document.querySelectorAll('[data-version]').forEach((el) => (el.textContent = `v${Forcify.version}`))

// ------------------------------------------------------------ highlighter

const TOKENS =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|\b(\d+(?:\.\d+)?(?:ms|px|deg|s)?)\b|\b(const|let|var|new|return|if|else|for|of|in|function|class|extends|import|from|export|default|true|false|null|undefined|this|typeof|await|async)\b|([A-Za-z_$][\w$]*)(?=\s*\()|([{}()[\];,.=>+\-*/:?!<&|%]+)/g

const escape = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

function highlight(code) {
  let html = ''
  let last = 0
  for (const m of code.matchAll(TOKENS)) {
    html += escape(code.slice(last, m.index))
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : m[4] ? 'k' : m[5] ? 'f' : 'p'
    html += `<span class="tok-${cls}">${escape(m[0])}</span>`
    last = m.index + m[0].length
  }
  return html + escape(code.slice(last))
}

function dedent(text) {
  const lines = text.replace(/^\n+|\s+$/g, '').split('\n')
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length))
  return lines.map((l) => l.slice(indent)).join('\n')
}

function codeBlock(lang, code) {
  const pre = document.createElement('pre')
  pre.className = 'code'
  pre.innerHTML = `<span class="lang">${lang}</span><code>${highlight(code)}</code>`
  return pre
}

// ------------------------------------------------------------------ demos

function setupDemo(section) {
  const stage = section.querySelector('.stage')
  const script = section.querySelector('script[type="text/forcify"]')
  const style = section.querySelector('style[data-show]')
  const code = dedent(script.textContent)
  const template = stage.innerHTML
  const logList = section.querySelector('.log')

  // Code column
  const column = document.createElement('div')
  if (style) column.append(codeBlock('css', dedent(style.textContent)))
  column.append(codeBlock('js', code))
  column.style.background = 'var(--code-bg)'
  section.querySelector('.body').append(column)

  // Reset button
  const header = section.querySelector('header')
  const reset = document.createElement('button')
  reset.className = 'reset'
  reset.textContent = '↺ Reset'
  header.append(reset)

  let instances = []
  let timers = []
  class TrackedForcify extends Forcify {
    constructor(...args) {
      super(...args)
      instances.push(this)
    }
    destroy() {
      instances = instances.filter((i) => i !== this)
      super.destroy()
    }
  }

  const log = (msg) => {
    if (!logList) return console.log(msg)
    const li = document.createElement('li')
    li.textContent = msg
    logList.prepend(li)
    while (logList.children.length > 40) logList.lastChild.remove()
  }

  const run = () => {
    const $ = (sel) => stage.querySelector(sel)
    const $$ = (sel) => stage.querySelectorAll(sel)
    // Let demos schedule work that "Reset" cancels.
    const every = (ms, fn) => timers.push(setInterval(fn, ms))
    try {
      new Function('Forcify', 'demo', '$', '$$', 'log', 'every', code)(TrackedForcify, stage, $, $$, log, every)
    } catch (error) {
      log(`Error: ${error.message}`)
      logList?.firstChild?.classList.add('error')
      console.error(error)
    }
  }

  reset.addEventListener('click', () => {
    instances.slice().forEach((i) => i.destroy())
    instances = []
    timers.forEach(clearInterval)
    timers = []
    stage.innerHTML = template
    if (logList) logList.textContent = ''
    run()
  })

  run()
}

document.querySelectorAll('section.demo').forEach(setupDemo)

// ------------------------------------------------------------- detection

const detectionTable = document.querySelector('#detection-table tbody')
const DETECTION_NOTES = {
  TOUCH3D: 'An iPhone 3D Touch sample has been seen. Press something to find out.',
  OSXFORCE: 'A Mac Force Touch trackpad event has been seen.',
  PEN_PRESSURE: 'A pen with real pressure (Apple Pencil, Surface Pen, S Pen, Wacom) has been seen.',
  PEN_HOVER: 'A pen hovering over the page has been seen (Apple Pencil hover, pen tablets).',
  WEIRD_CHROME: 'A touch reported the bogus force: 1 / webkitForce: 1 pair.',
  POINTER_EVENTS: 'The browser supports Pointer Events.',
  TOUCH_FORCE_EVENT: 'The browser fires touchforcechange (iOS 10+).',
  IOS: 'iOS or iPadOS, including iPadOS asking for desktop sites.',
  ANDROID: 'Android, whose Touch.force is contact area rather than pressure.',
  HAPTICS: "How Forcify.haptic() plays haptics: 'vibrate', 'switch' (iOS 18+) or false.",
}
function renderDetection() {
  detectionTable.innerHTML = Object.entries(Forcify.detection)
    .map(
      ([key, value]) =>
        `<tr><td><code>${key}</code></td><td><span class="badge ${value ? 'on' : ''}">${JSON.stringify(value)}</span></td><td>${DETECTION_NOTES[key] || ''}</td></tr>`,
    )
    .join('')
}
renderDetection()
let lastDetection = JSON.stringify(Forcify.detection)
setInterval(() => {
  const now = JSON.stringify(Forcify.detection)
  if (now !== lastDetection) {
    lastDetection = now
    renderDetection()
  }
}, 250)
