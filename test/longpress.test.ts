import { describe, expect, it } from 'vitest'
import Forcify from '../src'
import { advance, last, fire, makeTouch, pointer, record, setup, target, touchEvent } from './helpers'

setup()

describe('long-press fallback (Pointer Events)', () => {
  it('ramps force from 0 to 1 after the delay, then resets on release', () => {
    const f = new Forcify(target())
    const events = record(f)
    pointer(target(), 'pointerdown')
    advance(199)
    expect(events).toEqual([])

    advance(501)
    const mid = last(events)
    expect(mid.source).toBe('longpress')
    expect(mid.pointerType).toBe('touch')
    expect(mid.force).toBeGreaterThan(0.45)
    expect(mid.force).toBeLessThanOrEqual(0.5)

    advance(1000)
    expect(last(events).force).toBe(1)
    const count = events.length
    advance(1000)
    expect(events.length).toBe(count) // no duplicate values

    pointer(document, 'pointerup')
    expect(last(events).force).toBe(0)
    expect(f.force).toBe(0)
  })

  it('a short tap emits nothing', () => {
    const f = new Forcify(target())
    const events = record(f)
    pointer(target(), 'pointerdown')
    advance(100)
    pointer(document, 'pointerup')
    advance(2000)
    expect(events).toEqual([])
  })

  it('respects LONG_PRESS_DELAY and LONG_PRESS_DURATION', () => {
    const f = new Forcify(target(), { LONG_PRESS_DELAY: 50, LONG_PRESS_DURATION: 100 })
    const events = record(f)
    pointer(target(), 'pointerdown')
    advance(100)
    expect(last(events).force).toBeCloseTo(0.5, 1)
    advance(60)
    expect(last(events).force).toBe(1)
  })

  it('jumps straight to 1 with a zero duration', () => {
    const f = new Forcify(target(), { LONG_PRESS_DURATION: 0 })
    const events = record(f)
    pointer(target(), 'pointerdown')
    advance(200)
    expect(events).toEqual([{ force: 1, source: 'longpress', pointerType: 'touch' }])
  })

  it('does nothing with FALLBACK_TO_LONGPRESS: false', () => {
    const f = new Forcify(target(), { FALLBACK_TO_LONGPRESS: false })
    const events = record(f)
    pointer(target(), 'pointerdown')
    advance(2000)
    expect(events).toEqual([])
  })

  it('moving beyond LONG_PRESS_TOLERANCE cancels a pending press', () => {
    const f = new Forcify(target())
    const events = record(f)
    pointer(target(), 'pointerdown')
    pointer(document, 'pointermove', { clientX: 11 })
    advance(2000)
    expect(events).toEqual([])
  })

  it('moving within tolerance, or after the press started, does not cancel', () => {
    const f = new Forcify(target())
    const events = record(f)
    pointer(target(), 'pointerdown')
    pointer(document, 'pointermove', { clientX: 6, clientY: 6 })
    advance(300)
    pointer(document, 'pointermove', { clientX: 100 })
    advance(2000)
    expect(last(events).force).toBe(1)
  })

  it('pointercancel (e.g. the page started scrolling) ends the press', () => {
    const f = new Forcify(target())
    const events = record(f)
    pointer(target(), 'pointerdown')
    advance(500)
    pointer(document, 'pointercancel')
    expect(last(events).force).toBe(0)
  })

  it('ignores other pointers, secondary buttons and non-primary pointers', () => {
    const f = new Forcify(target())
    const events = record(f)
    pointer(target(), 'pointerdown', { pointerType: 'mouse', button: 2 })
    pointer(target(), 'pointerdown', { isPrimary: false })
    advance(2000)
    expect(events).toEqual([])

    pointer(target(), 'pointerdown', { pointerId: 7 })
    advance(500)
    pointer(document, 'pointerup', { pointerId: 8 })
    expect(f.force).toBeGreaterThan(0)
    pointer(document, 'pointerup', { pointerId: 7 })
    expect(f.force).toBe(0)
  })

  it('tracks a mouse released outside the element', () => {
    const f = new Forcify(target())
    pointer(target(), 'pointerdown', { pointerType: 'mouse' })
    advance(500)
    pointer(document.body, 'pointerup', { pointerType: 'mouse' })
    expect(f.force).toBe(0)
  })

  it('instances are independent', () => {
    document.body.innerHTML += '<div id="other"></div>'
    const a = new Forcify(target())
    const b = new Forcify('#other')
    const ea = record(a)
    const eb = record(b)
    pointer(target(), 'pointerdown', { pointerId: 1 })
    advance(500)
    pointer(document.getElementById('other')!, 'pointerdown', { pointerId: 2 })
    advance(500)
    expect(a.force).toBeGreaterThan(b.force)
    expect(eb.length).toBeGreaterThan(0)
    pointer(document, 'pointerup', { pointerId: 1 })
    expect(a.force).toBe(0)
    expect(b.force).toBeGreaterThan(0)
    expect(last(ea).force).toBe(0)
  })
})

describe('long-press fallback (Touch/Mouse Events)', () => {
  it('works with touches', () => {
    Forcify.detection.POINTER_EVENTS = false
    const f = new Forcify(target())
    const events = record(f)
    const t = makeTouch()
    touchEvent(target(), 'touchstart', t)
    advance(1200)
    expect(last(events)).toEqual({ force: 1, source: 'longpress', pointerType: 'touch' })
    touchEvent(target(), 'touchend', t)
    expect(f.force).toBe(0)
  })

  it('cancels when a touch moves too far', () => {
    Forcify.detection.POINTER_EVENTS = false
    const f = new Forcify(target())
    const events = record(f)
    touchEvent(target(), 'touchstart', makeTouch())
    touchEvent(target(), 'touchmove', makeTouch({ clientY: 30 }))
    advance(1200)
    expect(events).toEqual([])
  })

  it('works with the mouse, and ignores mouse events that follow a touch', () => {
    Forcify.detection.POINTER_EVENTS = false
    const f = new Forcify(target())
    const events = record(f)
    fire(target(), 'mousedown', { button: 0, clientX: 0, clientY: 0 })
    advance(1200)
    expect(last(events)).toEqual({ force: 1, source: 'longpress', pointerType: 'mouse' })
    fire(document, 'mouseup')
    expect(f.force).toBe(0)

    const t = makeTouch()
    touchEvent(target(), 'touchstart', t)
    touchEvent(target(), 'touchend', t)
    events.length = 0
    fire(target(), 'mousedown', { button: 0, clientX: 0, clientY: 0 })
    advance(1200)
    expect(events).toEqual([])
  })
})
