import { describe, expect, it } from 'vitest'
import Forcify from '../src'
import type { ForceEvent, HoverEvent } from '../src'
import { sphericalToTilt, tiltToSpherical } from '../src/point'
import { advance, fire, last, makeTouch, pointer, record, setup, target, touchEvent } from './helpers'

setup()

const pen = (el: EventTarget, type: string, props: Record<string, unknown> = {}) =>
  pointer(el, type, { pointerType: 'pen', pressure: 0, buttons: 1, tiltX: 0, tiltY: 0, twist: 0, ...props })

describe('pen pressure (Pointer Events)', () => {
  it('reports PointerEvent.pressure as force', () => {
    const f = new Forcify(target())
    const events = record(f)
    pen(target(), 'pointerdown', { pressure: 0.3 })
    expect(Forcify.detection.PEN_PRESSURE).toBe(true)
    expect(last(events)).toEqual({ force: 0.3, source: 'pen', pointerType: 'pen' })
    pen(document, 'pointermove', { pressure: 0.8 })
    expect(f.force).toBe(0.8)
    pen(document, 'pointerup', { pressure: 0 })
    expect(f.force).toBe(0)
  })

  it('follows the pen outside the element', () => {
    const f = new Forcify(target())
    pen(target(), 'pointerdown', { pressure: 0.3 })
    pen(document.body, 'pointermove', { pressure: 0.6 })
    expect(f.force).toBe(0.6)
  })

  it('emits when the pen moves or tilts at the same pressure', () => {
    const f = new Forcify(target())
    const events: ForceEvent[] = []
    f.on('force', (e) => events.push(e))
    pen(target(), 'pointerdown', { pressure: 0.3 })
    pen(document, 'pointermove', { pressure: 0.3, clientX: 5 })
    pen(document, 'pointermove', { pressure: 0.3, clientX: 5, tiltX: 30 })
    pen(document, 'pointermove', { pressure: 0.3, clientX: 5, tiltX: 30 })
    expect(events.map((e) => [e.x, e.tiltX])).toEqual([[0, 0], [5, 0], [5, 30]])
  })

  it('carries position and angles, deriving altitude/azimuth from tilt', () => {
    const f = new Forcify(target())
    let event: ForceEvent | undefined
    f.on('force', (e) => { event = e })
    pen(target(), 'pointerdown', { pressure: 0.4, clientX: 10, clientY: 20, tiltX: 45, tiltY: 0, twist: 90 })
    expect(event).toMatchObject({ x: 10, y: 20, tiltX: 45, tiltY: 0, twist: 90, azimuthAngle: 0 })
    expect(event!.altitudeAngle).toBeCloseTo(Math.PI / 4)
  })

  it('prefers native altitudeAngle/azimuthAngle when the browser has them', () => {
    const f = new Forcify(target())
    let event: ForceEvent | undefined
    f.on('force', (e) => { event = e })
    pen(target(), 'pointerdown', { pressure: 0.4, altitudeAngle: 1, azimuthAngle: 2 })
    expect(event).toMatchObject({ altitudeAngle: 1, azimuthAngle: 2 })
  })

  it('a pen stuck at 0.5 has no pressure hardware and falls back to long press', () => {
    const f = new Forcify(target())
    const events = record(f)
    pen(target(), 'pointerdown', { pressure: 0.5 })
    pen(document, 'pointermove', { pressure: 0.5 })
    expect(events).toEqual([])
    advance(1200)
    expect(last(events)).toEqual({ force: 1, source: 'longpress', pointerType: 'pen' })
  })

  it('once pen pressure is known, 0.5 is trusted and there is no fallback', () => {
    Forcify.detection.PEN_PRESSURE = true
    const f = new Forcify(target())
    const events = record(f)
    pen(target(), 'pointerdown', { pressure: 0.5 })
    advance(1200)
    expect(events).toEqual([{ force: 0.5, source: 'pen', pointerType: 'pen' }])
  })

  it('mouse pressure (always 0.5) is never read', () => {
    const f = new Forcify(target(), { FALLBACK_TO_LONGPRESS: false })
    const events = record(f)
    pointer(target(), 'pointerdown', { pointerType: 'mouse', pressure: 0.5 })
    pointer(document, 'pointermove', { pointerType: 'mouse', pressure: 0.7 })
    expect(events).toEqual([])
  })
})

describe('pen hover', () => {
  it('emits hover while a pen moves above the element, and hovering: false when it leaves', () => {
    const f = new Forcify(target())
    const events: HoverEvent[] = []
    f.on('hover', (e) => events.push(e))
    pen(target(), 'pointermove', { buttons: 0, clientX: 3, tiltY: 20 })
    expect(Forcify.detection.PEN_HOVER).toBe(true)
    expect(events[0]).toMatchObject({ type: 'hover', hovering: true, x: 3, tiltY: 20, pointerType: 'pen' })
    pen(target(), 'pointerleave', { buttons: 0 })
    expect(last(events).hovering).toBe(false)
  })

  it('ends hovering when the pen touches down', () => {
    const f = new Forcify(target())
    const events: boolean[] = []
    f.on('hover', (e) => events.push(e.hovering))
    pen(target(), 'pointermove', { buttons: 0 })
    pen(target(), 'pointerdown', { pressure: 0.2 })
    pen(target(), 'pointermove', { pressure: 0.3 })
    expect(events).toEqual([true, false])
  })

  it('ignores mouse and touch hover', () => {
    const f = new Forcify(target())
    const events: unknown[] = []
    f.on('hover', (e) => events.push(e))
    pointer(target(), 'pointermove', { pointerType: 'mouse', buttons: 0 })
    expect(events).toEqual([])
  })
})

describe('Apple Pencil through Touch Events (iPadOS without Pointer Events)', () => {
  it('reads Touch.force of a stylus touch as pen pressure', () => {
    Forcify.detection.POINTER_EVENTS = false
    const f = new Forcify(target())
    const events = record(f)
    const t = makeTouch({ touchType: 'stylus', force: 0.25, altitudeAngle: Math.PI / 4, azimuthAngle: 0 })
    touchEvent(target(), 'touchstart', t)
    expect(last(events)).toEqual({ force: 0.25, source: 'pen', pointerType: 'pen' })
    expect(Forcify.detection.TOUCH3D).toBe(false)
    touchEvent(target(), 'touchend', t)
    expect(f.force).toBe(0)
  })

  it('leaves stylus touches to Pointer Events when they exist', () => {
    const f = new Forcify(target(), { FALLBACK_TO_LONGPRESS: false })
    const events = record(f)
    touchEvent(target(), 'touchstart', makeTouch({ touchType: 'stylus', force: 0.25 }))
    advance(50)
    expect(events).toEqual([])
    expect(Forcify.detection.TOUCH3D).toBe(false)
  })
})

describe('touchforcechange (iOS 10+)', () => {
  it('samples force immediately when the event fires', () => {
    const f = new Forcify(target())
    pointer(target(), 'pointerdown')
    touchEvent(target(), 'touchstart', makeTouch({ force: 0 }))
    touchEvent(target(), 'touchforcechange', makeTouch({ force: 0.55 }))
    expect(f.force).toBe(0.55)
  })
})

describe('POINTER_TYPES', () => {
  it('limits which pointers may press', () => {
    const f = new Forcify(target(), { POINTER_TYPES: ['pen'] })
    const events = record(f)
    pointer(target(), 'pointerdown')
    touchEvent(target(), 'touchstart', makeTouch({ force: 0.5 }))
    advance(1200)
    pointer(document, 'pointerup')
    expect(events).toEqual([])
    pen(target(), 'pointerdown', { pressure: 0.3 })
    expect(last(events).source).toBe('pen')
  })

  it('applies to the legacy mouse path too', () => {
    Forcify.detection.POINTER_EVENTS = false
    const f = new Forcify(target(), { POINTER_TYPES: ['touch'] })
    const events = record(f)
    fire(target(), 'mousedown', { button: 0, clientX: 0, clientY: 0 })
    advance(1200)
    expect(events).toEqual([])
  })

  it('is copied per instance', () => {
    const f = new Forcify(target())
    f.options.POINTER_TYPES.pop()
    expect(Forcify.defaults.POINTER_TYPES).toEqual(['mouse', 'touch', 'pen'])
  })
})

describe('tilt ⇄ altitude/azimuth', () => {
  it('matches the Pointer Events spec for the axes', () => {
    expect(tiltToSpherical(0, 0)).toEqual({ altitudeAngle: Math.PI / 2, azimuthAngle: 0 })
    expect(tiltToSpherical(0, 30).azimuthAngle).toBeCloseTo(Math.PI / 2)
    expect(tiltToSpherical(-30, 0).azimuthAngle).toBeCloseTo(Math.PI)
    expect(tiltToSpherical(0, -30).azimuthAngle).toBeCloseTo((3 * Math.PI) / 2)
    expect(tiltToSpherical(90, 0).altitudeAngle).toBe(0)
  })

  it('round-trips', () => {
    for (const [tx, ty] of [[20, 35], [-40, 10], [15, -60], [-25, -25]]) {
      const { altitudeAngle, azimuthAngle } = tiltToSpherical(tx, ty)
      const back = sphericalToTilt(altitudeAngle, azimuthAngle)
      expect(back.tiltX).toBeCloseTo(tx)
      expect(back.tiltY).toBeCloseTo(ty)
    }
  })

  it('handles a pen lying flat', () => {
    expect(sphericalToTilt(0, 0)).toEqual({ tiltX: 90, tiltY: 0 })
    expect(sphericalToTilt(0, Math.PI / 2)).toEqual({ tiltX: 0, tiltY: 90 })
  })
})
