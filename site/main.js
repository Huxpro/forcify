/**
 * Runs the Forcify site.
 *
 * Every demo is a <section class="demo"> with a .stage for its HTML and a
 * <script type="text/forcify"> for its code. The code shown on the page is
 * exactly the code that runs, with these in scope:
 *
 *   Forcify   the library (instances are tracked so "reset" can destroy them)
 *   demo      the demo's .stage element
 *   $(sel)    demo.querySelector(sel)
 *   $$(sel)   demo.querySelectorAll(sel)
 *   log(msg)  add a line to the demo's event log
 *   every(ms, fn)  an interval that "reset" clears
 */

import Forcify from './dist/forcify.mjs'

window.Forcify = Forcify // handy in the console

const root = document.documentElement
const lang = () => (root.dataset.lang === 'zh' ? 'zh' : 'en')

/** The text of an element in the current language. */
function said(el) {
  if (!el) return ''
  const own = el.querySelector(`[lang="${lang()}"]`)
  return (own || el).textContent.trim()
}

// ------------------------------------------------------------------- hero

const disc = document.querySelector('.disc')
const ring = document.querySelector('.hold-ring')
const readout = document.querySelector('.readout')
const DISC = 104
const WRAP = 132

// The ring is Hux's HoldRing: it shows up only in the second half of the
// way to pop, a little outside the disc, and closes onto its edge as the
// press arrives. A tap never sees it.
function paintRing(force, pop) {
  const progress = Math.min(force / pop, 1)
  const scale = 1 + force * 0.22
  const diameter = DISC * scale * (1 + 0.3 * (1 - progress))
  ring.style.opacity = String(Math.max(0, (progress - 0.4) / 0.6))
  ring.style.transform = `scale(${diameter / WRAP})`
  ring.toggleAttribute('data-closed', progress >= 1)
}

new Forcify(disc)
  .on('force', (e) => {
    paintRing(e.force, e.instance.options.POP_THRESHOLD)
    readout.innerHTML = `<b>${e.force.toFixed(3)}</b><span>${e.source} · ${e.pointerType}${e.popped ? ' · pop' : e.peeked ? ' · peek' : ''}</span>`
  })
  .on('forceend', (e) => {
    paintRing(0, 1)
    readout.innerHTML = `<b>0.000</b><span>max ${e.maxForce.toFixed(3)} · ${e.source}${e.popped ? ' · popped' : ''}</span>`
  })

const install = document.querySelector('.install')
install.addEventListener('click', async () => {
  const text = install.textContent
  try {
    await navigator.clipboard.writeText('npm i forcify')
    install.textContent = lang() === 'zh' ? '已复制' : 'copied'
  } catch {
    getSelection()?.selectAllChildren(install)
    return
  }
  setTimeout(() => (install.textContent = text), 1200)
})

// λhux scrambles into its command on hover, like hux.pro's SystemNav.
const GLYPHS = 'abcdefghijklmnopqrstuvwxyz~/._λ'
document.querySelectorAll('[data-scramble]').forEach((el) => {
  const rest = el.textContent
  const to = el.dataset.scramble
  let frame = 0
  const run = (target) => {
    cancelAnimationFrame(frame)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return void (el.textContent = target)
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / 260, 1)
      const settled = Math.floor(t * target.length)
      el.textContent = [...target]
        .map((c, i) => (i < settled ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join('')
      if (t < 1) frame = requestAnimationFrame(tick)
      else el.textContent = target
    }
    frame = requestAnimationFrame(tick)
  }
  el.addEventListener('mouseenter', () => run(to))
  el.addEventListener('mouseleave', () => run(rest))
  el.addEventListener('focus', () => run(to))
  el.addEventListener('blur', () => run(rest))
})

document.querySelectorAll('[data-version]').forEach((el) => (el.textContent = `v${Forcify.version}`))

// ------------------------------------------------------------ highlighter

const TOKENS =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|\b(\d+(?:\.\d+)?(?:ms|px|deg|s|%)?)\b|\b(const|let|var|new|return|if|else|for|of|in|function|class|extends|import|from|export|default|true|false|null|undefined|this|typeof|await|async)\b|([A-Za-z_$][\w$]*)(?=\s*\()|([{}()[\];,.=>+\-*/:?!<&|%]+)/g

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
  const widget = section.querySelector('.widget')
  const logList = section.querySelector('.log')
  const code = dedent(script.textContent)
  const template = stage.innerHTML

  const blocks = [codeBlock('js', code)]
  if (style) blocks.unshift(codeBlock('css', dedent(style.textContent)))
  widget.after(...blocks)

  const reset = document.createElement('button')
  reset.type = 'button'
  reset.className = 'reset pressable'
  reset.textContent = 'reset'
  section.querySelector('header').append(reset)

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
    const every = (ms, fn) => timers.push(setInterval(fn, ms))
    try {
      new Function('Forcify', 'demo', '$', '$$', 'log', 'every', code)(TrackedForcify, stage, $, $$, log, every)
    } catch (error) {
      log(`error  ${error.message}`)
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

const MEANING = {
  TOUCH3D: ['An iPhone 3D Touch sample has been seen.', '已收到 iPhone 3D Touch 的数据。'],
  OSXFORCE: ['A Mac Force Touch trackpad event has been seen.', '已收到 Mac Force Touch 触控板的事件。'],
  WEIRD_CHROME: ['A touch reported the bogus force: 1 / webkitForce: 1 pair.', '有触摸报告了错误的 force: 1 / webkitForce: 1。'],
  ANDROID: ["Android, whose Touch.force is contact area, not pressure.", 'Android，它的 Touch.force 是接触面积，不是压力。'],
  POINTER_EVENTS: ['The browser supports Pointer Events.', '浏览器支持 Pointer Events。'],
  TOUCH_FORCE_EVENT: ['The browser fires touchforcechange (iOS 10+).', '浏览器会触发 touchforcechange（iOS 10+）。'],
  PEN_PRESSURE: ['A pen with real pressure has been seen.', '已收到带真实压力的笔。'],
  PEN_HOVER: ['A pen hovering over the page has been seen.', '已收到悬停在页面上方的笔。'],
  IOS: ['iOS or iPadOS, including iPadOS asking for desktop sites.', 'iOS 或 iPadOS，包括请求桌面版网站的 iPadOS。'],
  HAPTICS: ["How Forcify.haptic() plays: 'vibrate', 'switch' (iOS 18+) or false.", "Forcify.haptic() 的方式：'vibrate'、'switch'（iOS 18+）或 false。"],
}
const detectionBody = document.querySelector('#detection-table tbody')
function renderDetection() {
  detectionBody.innerHTML = Object.entries(Forcify.detection)
    .map(([key, value]) => {
      const [en, zh] = MEANING[key] || ['', '']
      return `<tr><td><code>${key}</code></td><td><span class="flag"${value ? ' data-on' : ''}>${JSON.stringify(value)}</span></td><td><span lang="en">${en}</span><span lang="zh">${zh}</span></td></tr>`
    })
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

// ------------------------------------------------------------- language

function setLang(next) {
  root.dataset.lang = next
  root.lang = next === 'zh' ? 'zh-CN' : 'en'
  try {
    localStorage.setItem('forcify_lang', next)
  } catch {}
}

// --------------------------------------------------------------- palette

const prompt = document.querySelector('.prompt')
let palette = null

function entries() {
  const list = []
  document.querySelectorAll('main > section.group').forEach((group) => {
    const label = group.querySelector(':scope > .label')?.textContent.trim() || 'guide'
    list.push({ group: label, name: said(group.querySelector('h2')), href: `#${group.id}` })
    group.querySelectorAll('section.demo').forEach((demo) => {
      list.push({ group: label, name: demo.querySelector('h3').textContent.trim(), href: `#${demo.id}`, code: true })
    })
  })
  list.push({
    group: 'settings',
    name: lang() === 'zh' ? 'Language: English' : '语言：中文',
    run: () => setLang(lang() === 'zh' ? 'en' : 'zh'),
  })
  return list
}

function openPalette() {
  if (palette) return
  const all = entries()
  let shown = all
  let active = 0

  const scrim = document.createElement('div')
  scrim.className = 'palette-scrim system-chrome'
  scrim.innerHTML = `
    <div class="palette" role="dialog" aria-label="Search">
      <input type="text" id="palette-input" autocomplete="off" spellcheck="false" role="combobox" aria-controls="palette-list" aria-expanded="true">
      <ul id="palette-list" role="listbox"></ul>
    </div>`
  const input = scrim.querySelector('input')
  const ul = scrim.querySelector('ul')
  input.placeholder = lang() === 'zh' ? '想找什么？' : 'what are you looking for?'

  const render = () => {
    if (!shown.length) {
      ul.innerHTML = `<li class="empty">${lang() === 'zh' ? '没有匹配的结果' : 'nothing matches'}</li>`
      return
    }
    let html = ''
    let group = null
    shown.forEach((entry, i) => {
      if (entry.group !== group) {
        group = entry.group
        html += `<li class="group-label" role="presentation">${escape(group)}</li>`
      }
      const name = entry.code ? `<code>${escape(entry.name)}</code>` : escape(entry.name)
      html += `<li role="option" id="palette-${i}" data-i="${i}" aria-selected="${i === active}">${name}<span>${escape(entry.href || '')}</span></li>`
    })
    ul.innerHTML = html
    input.setAttribute('aria-activedescendant', `palette-${active}`)
    ul.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }

  const choose = (entry) => {
    closePalette()
    if (!entry) return
    if (entry.run) entry.run()
    else {
      history.replaceState(null, '', entry.href)
      document.querySelector(entry.href)?.scrollIntoView({ block: 'start' })
    }
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase()
    shown = q ? all.filter((e) => `${e.name} ${e.group}`.toLowerCase().includes(q)) : all
    active = 0
    render()
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      active = (active + step + shown.length) % Math.max(shown.length, 1)
      render()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(shown[active])
    } else if (e.key === 'Escape') {
      closePalette()
    }
  })
  ul.addEventListener('click', (e) => {
    const li = e.target.closest('[data-i]')
    if (li) choose(shown[Number(li.dataset.i)])
  })
  ul.addEventListener('pointermove', (e) => {
    const li = e.target.closest('[data-i]')
    if (li && Number(li.dataset.i) !== active) {
      active = Number(li.dataset.i)
      ul.querySelectorAll('[aria-selected]').forEach((el) => el.setAttribute('aria-selected', String(el === li)))
    }
  })
  scrim.addEventListener('pointerdown', (e) => {
    if (e.target === scrim) closePalette()
  })

  document.body.append(scrim)
  palette = scrim
  prompt.hidden = true
  render()
  input.focus()
}

function closePalette() {
  if (!palette) return
  palette.remove()
  palette = null
  prompt.hidden = false
  prompt.focus({ preventScroll: true })
}

prompt.addEventListener('click', openPalette)
document.addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    palette ? closePalette() : openPalette()
  } else if (e.key === '/' && !typing && !palette) {
    e.preventDefault()
    openPalette()
  } else if (e.key === 'Escape' && palette) {
    closePalette()
  }
})
