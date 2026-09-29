import { describe, expect, it, vi } from 'vitest'
import Forcify from '../src'
import type { ForceEvent } from '../src'
import { advance, fire, pointer, setup, target } from './helpers'

setup()

function log(f: Forcify) {
  const events: string[] = []
  for (const type of ['forcestart', 'peek', 'pop', 'forceend'] as const) {
    f.on(type, (e) => events.push(`${type}@${e.force.toFixed(2)}`))
  }
  return events
}

describe('peek and pop', () => {
  it('fire once per press, in order, with forcestart and forceend around them', () => {
    const f = new Forcify(target(), { HAPTICS: false })
    const events = log(f)
    pointer(target(), 'pointerdown')
    advance(2000)
    pointer(document, 'pointerup')
    expect(events.map((e) => e.split('@')[0])).toEqual(['forcestart', 'peek', 'pop', 'forceend'])
    const at = (type: string) => Number(events.find((e) => e.startsWith(type))!.split('@')[1])
    expect(at('peek')).toBeGreaterThanOrEqual(0.3)
    expect(at('pop')).toBeGreaterThanOrEqual(0.6)
    expect(at('forceend')).toBe(0)
  })

  it('report maxForce, peeked and popped', () => {
    const f = new Forcify(target(), { HAPTICS: false })
    let end: ForceEvent | undefined
    f.on('forceend', (e) => { end = e })
    pointer(target(), 'pointerdown')
    advance(200 + 450)
    pointer(document, 'pointerup')
    expect(end).toMatchObject({ peeked: true, popped: false })
    expect(end!.maxForce).toBeGreaterThan(0.4)
    expect(end!.maxForce).toBeLessThan(0.6)
  })

  it('respect custom thresholds', () => {
    const f = new Forcify(target(), { HAPTICS: false, PEEK_THRESHOLD: 0.9, POP_THRESHOLD: 1 })
    const events = log(f)
    pointer(target(), 'pointerdown')
    advance(200 + 800)
    expect(events.map((e) => e.split('@')[0])).toEqual(['forcestart'])
    advance(300)
    expect(events.map((e) => e.split('@')[0])).toEqual(['forcestart', 'peek', 'pop'])
  })

  it('a tap produces no press events', () => {
    const f = new Forcify(target())
    const events = log(f)
    pointer(target(), 'pointerdown')
    pointer(document, 'pointerup')
    expect(events).toEqual([])
  })

  it('a macOS force click pops immediately', () => {
    const f = new Forcify(target(), { HAPTICS: false })
    const events = log(f)
    pointer(target(), 'pointerdown', { pointerType: 'mouse' })
    fire(target(), 'mousedown', { button: 0, webkitForce: 1 })
    fire(target(), 'webkitmouseforcechanged', { webkitForce: 1.9 })
    fire(target(), 'webkitmouseforcedown', { webkitForce: 2 })
    expect(events.map((e) => e.split('@')[0])).toEqual(['forcestart', 'peek', 'pop'])
  })
})

describe('LONG_PRESS_EASING', () => {
  it('shapes the emulated ramp', () => {
    const f = new Forcify(target(), { LONG_PRESS_EASING: (t) => t * t })
    pointer(target(), 'pointerdown')
    advance(200 + 500)
    expect(f.force).toBeGreaterThan(0.2)
    expect(f.force).toBeLessThanOrEqual(0.25)
  })
})

describe('haptics', () => {
  it('vibrates on peek and pop', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { ...navigator, vibrate })
    Forcify.detection.HAPTICS = 'vibrate'
    new Forcify(target())
    pointer(target(), 'pointerdown')
    advance(2000)
    expect(vibrate).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })

  it('toggles a hidden switch on iOS 18+', () => {
    Forcify.detection.HAPTICS = 'switch'
    const clicks: Element[] = []
    document.addEventListener('click', (e) => clicks.push(e.target as Element), { capture: true })
    expect(Forcify.haptic()).toBe(true)
    expect(clicks[0].tagName).toBe('LABEL')
    expect(clicks[0].querySelector('input')!.hasAttribute('switch')).toBe(true)
    expect(document.head.querySelector('label')).toBe(null) // cleaned up

    Forcify.haptic('heavy')
    advance(100)
    expect(clicks.filter((el) => el.tagName === 'LABEL').length).toBe(3)
  })

  it('does nothing when unsupported or disabled', () => {
    Forcify.detection.HAPTICS = false
    expect(Forcify.haptic()).toBe(false)

    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { ...navigator, vibrate })
    Forcify.detection.HAPTICS = 'vibrate'
    new Forcify(target(), { HAPTICS: false })
    pointer(target(), 'pointerdown')
    advance(2000)
    expect(vibrate).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

describe('CSS output', () => {
  it('sets --force and data-force-state during a press, and clears them after', () => {
    const f = new Forcify(target(), { HAPTICS: false })
    const el = target()
    pointer(el, 'pointerdown')
    advance(200 + 100)
    expect(Number(el.style.getPropertyValue('--force'))).toBeCloseTo(0.1, 1)
    expect(el.getAttribute('data-force-state')).toBe('pressing')
    advance(250)
    expect(el.getAttribute('data-force-state')).toBe('peek')
    advance(300)
    expect(el.getAttribute('data-force-state')).toBe('pop')
    pointer(document, 'pointerup')
    expect(el.style.getPropertyValue('--force')).toBe('0')
    expect(el.hasAttribute('data-force-state')).toBe(false)
    f.destroy()
    expect(el.style.getPropertyValue('--force')).toBe('')
  })

  it('can be renamed or turned off', () => {
    new Forcify(target(), { CSS_VARIABLE: '--pressure', STATE_ATTRIBUTE: false })
    pointer(target(), 'pointerdown')
    advance(600)
    expect(target().style.getPropertyValue('--pressure')).not.toBe('')
    expect(target().style.getPropertyValue('--force')).toBe('')
    expect(target().hasAttribute('data-force-state')).toBe(false)
  })
})

describe('PREVENT_CLICK', () => {
  const clickAfter = (ms: number, options = {}) => {
    new Forcify(target(), { HAPTICS: false, ...options })
    const onClick = vi.fn()
    target().addEventListener('click', onClick)
    pointer(target(), 'pointerdown')
    advance(ms)
    pointer(document, 'pointerup')
    const event = fire(target(), 'click')
    return { onClick, event }
  }

  it('swallows the click after a press that peeked', () => {
    const { onClick, event } = clickAfter(600)
    expect(onClick).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('lets a quick tap click', () => {
    const { onClick } = clickAfter(100)
    expect(onClick).toHaveBeenCalled()
  })

  it('only swallows one click, and only right after release', () => {
    const { onClick } = clickAfter(600)
    fire(target(), 'click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('expires if no click follows', () => {
    new Forcify(target(), { HAPTICS: false })
    const onClick = vi.fn()
    target().addEventListener('click', onClick)
    pointer(target(), 'pointerdown')
    advance(600)
    pointer(document, 'pointerup')
    advance(1000)
    fire(target(), 'click')
    expect(onClick).toHaveBeenCalled()
  })

  it('can be turned off', () => {
    const { onClick } = clickAfter(600, { PREVENT_CLICK: false })
    expect(onClick).toHaveBeenCalled()
  })
})

describe('detection', () => {
  const load = async (nav: Partial<Navigator>) => {
    vi.resetModules()
    vi.stubGlobal('navigator', { userAgent: '', maxTouchPoints: 0, ...nav })
    const { detection } = await import('../src/detection')
    vi.unstubAllGlobals()
    return detection
  }

  it('recognizes iPhone, and iPad asking for the desktop site', async () => {
    expect((await load({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })).IOS).toBe(true)
    const ipad = await load({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15', maxTouchPoints: 5 })
    expect(ipad.IOS).toBe(true)
    const mac = await load({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15' })
    expect(mac.IOS).toBe(false)
  })

  it('picks the switch haptic on iOS 18+ and vibrate on touch devices that have it', async () => {
    const proto = HTMLInputElement.prototype as unknown as Record<string, unknown>
    const had = 'switch' in proto
    expect((await load({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Version/18.1' })).HAPTICS).toBe('switch')
    expect((await load({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Version/17.5' })).HAPTICS).toBe(had ? 'switch' : false)
    expect((await load({ userAgent: 'Android', maxTouchPoints: 5, vibrate: () => true })).HAPTICS).toBe('vibrate')
    expect((await load({ userAgent: 'Windows', vibrate: () => true })).HAPTICS).toBe(false)
  })
})
