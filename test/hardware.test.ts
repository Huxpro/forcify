import { describe, expect, it } from 'vitest'
import Forcify from '../src'
import { advance, last, fire, makeTouch, pointer, record, setup, target, touchEvent } from './helpers'

setup()

/** Start a touch press the way Safari does: pointerdown, then touchstart. */
function touchDown(touch = makeTouch()) {
  pointer(target(), 'pointerdown')
  touchEvent(target(), 'touchstart', touch)
  return touch
}

function touchUp(touch: ReturnType<typeof makeTouch>) {
  pointer(document, 'pointerup')
  touchEvent(target(), 'touchend', touch)
}

describe('3D Touch', () => {
  it('detects real force and polls the live Touch object', () => {
    const f = new Forcify(target())
    const events = record(f)
    const t = touchDown(makeTouch({ force: 0 }))
    advance(50)
    expect(events).toEqual([])
    expect(Forcify.detection.TOUCH3D).toBe(false)

    t.force = 0.4
    advance(20)
    expect(Forcify.detection.TOUCH3D).toBe(true)
    expect(last(events)).toEqual({ force: 0.4, source: 'touch3d', pointerType: 'touch' })

    t.force = 0.9
    advance(20)
    expect(f.force).toBe(0.9)

    touchUp(t)
    expect(last(events).force).toBe(0)
  })

  it('reads force from touchmove when the browser replaces Touch objects', () => {
    const f = new Forcify(target())
    touchDown(makeTouch({ force: 0.2 }))
    touchEvent(target(), 'touchmove', makeTouch({ force: 0.7 }))
    advance(20)
    expect(f.force).toBe(0.7)
  })

  it('real force replaces an emulated press already in progress', () => {
    const f = new Forcify(target())
    const events = record(f)
    const t = touchDown(makeTouch({ force: 0 }))
    advance(600)
    expect(last(events).source).toBe('longpress')
    t.force = 0.3
    advance(100)
    expect(last(events)).toEqual({ force: 0.3, source: 'touch3d', pointerType: 'touch' })
  })

  it('once 3D Touch is known, a light press is just force 0 — no fallback', () => {
    Forcify.detection.TOUCH3D = true
    const f = new Forcify(target())
    const events = record(f)
    touchDown(makeTouch({ force: 0 }))
    advance(2000)
    expect(events).toEqual([])
  })

  it('an iPhone without 3D Touch (force stays 0) falls back to long press', () => {
    const f = new Forcify(target())
    const events = record(f)
    const t = touchDown(makeTouch({ force: 0 }))
    advance(1200)
    expect(last(events)).toEqual({ force: 1, source: 'longpress', pointerType: 'touch' })
    touchUp(t)
    expect(f.force).toBe(0)
  })

  it('ends the press from touchend alone', () => {
    const f = new Forcify(target())
    const t = touchDown(makeTouch({ force: 0.5 }))
    advance(20)
    touchEvent(target(), 'touchend', t)
    expect(f.force).toBe(0)
  })

  it('adopts a touch that arrives before its pointerdown', () => {
    const f = new Forcify(target())
    const t = makeTouch({ identifier: 9, force: 0.5 })
    touchEvent(target(), 'touchstart', t)
    pointer(target(), 'pointerdown', { pointerId: 3 })
    advance(20)
    expect(f.force).toBe(0.5)
    pointer(document, 'pointerup', { pointerId: 3 })
    expect(f.force).toBe(0)
  })
})

describe('shimming weird browsers', () => {
  it('Chrome reporting force 1 / webkitForce 1 is ignored and falls back', () => {
    const f = new Forcify(target())
    const events = record(f)
    touchDown(makeTouch({ force: 1, webkitForce: 1 }))
    expect(Forcify.detection.WEIRD_CHROME).toBe(true)
    advance(1200)
    expect(events.every((e) => e.source === 'longpress')).toBe(true)
  })

  it('Android force (contact area) is ignored', () => {
    Forcify.detection.ANDROID = true
    const f = new Forcify(target())
    const events = record(f)
    const t = touchDown(makeTouch({ force: 0.35 }))
    advance(100)
    t.force = 0.6
    advance(100)
    expect(events).toEqual([])
    expect(Forcify.detection.TOUCH3D).toBe(false)
  })

  it('SHIM_WEIRD_BROWSER: false trusts any positive force', () => {
    Forcify.detection.ANDROID = true
    const f = new Forcify(target(), { SHIM_WEIRD_BROWSER: false })
    touchDown(makeTouch({ force: 1, webkitForce: 1 }))
    advance(20)
    expect(f.force).toBe(1)
    expect(Forcify.detection.WEIRD_CHROME).toBe(false)
  })
})

describe('macOS Force Touch', () => {
  const mouseDown = (webkitForce: number) => {
    pointer(target(), 'pointerdown', { pointerType: 'mouse' })
    fire(target(), 'mousedown', { button: 0, webkitForce })
  }

  it('maps webkitForce 1–3 onto 0–1', () => {
    const f = new Forcify(target())
    const events = record(f)
    mouseDown(1)
    expect(Forcify.detection.OSXFORCE).toBe(true)
    fire(target(), 'webkitmouseforcechanged', { webkitForce: 2 })
    expect(last(events)).toEqual({ force: 0.5, source: 'forcetouch', pointerType: 'mouse' })
    fire(target(), 'webkitmouseforcechanged', { webkitForce: 3.4 })
    expect(f.force).toBe(1)
    pointer(document, 'pointerup', { pointerType: 'mouse' })
    expect(f.force).toBe(0)
  })

  it('does not fall back to long press on a Force Touch click', () => {
    const f = new Forcify(target())
    const events = record(f)
    mouseDown(1)
    advance(2000)
    expect(events).toEqual([])
  })

  it('still falls back for a regular mouse on the same Mac', () => {
    Forcify.detection.OSXFORCE = true
    const f = new Forcify(target())
    const events = record(f)
    mouseDown(0)
    fire(target(), 'webkitmouseforcechanged', { webkitForce: 0 })
    advance(1200)
    expect(last(events)).toEqual({ force: 1, source: 'longpress', pointerType: 'mouse' })
  })

  it('ignores force changes before the click', () => {
    const f = new Forcify(target())
    const events = record(f)
    fire(target(), 'webkitmouseforcechanged', { webkitForce: 0.5 })
    expect(events).toEqual([])
  })

  it('prevents Look Up on force click unless told not to', () => {
    new Forcify(target())
    expect(fire(target(), 'webkitmouseforcewillbegin').defaultPrevented).toBe(true)

    document.body.innerHTML = '<div id="target"></div>'
    new Forcify(target(), { DISABLE_NATIVE_GESTURES: false })
    expect(fire(target(), 'webkitmouseforcewillbegin').defaultPrevented).toBe(false)
  })
})

describe('native gestures', () => {
  it('turns off callouts, selection and dragging on the element', () => {
    new Forcify(target())
    expect(target().style.getPropertyValue('user-select')).toBe('none')
  })

  it('prevents the touch context menu during a press but keeps right click', () => {
    new Forcify(target())
    pointer(target(), 'pointerdown')
    expect(fire(target(), 'contextmenu').defaultPrevented).toBe(true)
    pointer(document, 'pointerup')

    pointer(target(), 'pointerdown', { pointerType: 'mouse' })
    expect(fire(target(), 'contextmenu').defaultPrevented).toBe(false)
  })

  it('leaves everything alone with DISABLE_NATIVE_GESTURES: false', () => {
    new Forcify(target(), { DISABLE_NATIVE_GESTURES: false })
    expect(target().style.getPropertyValue('user-select')).toBe('')
    pointer(target(), 'pointerdown')
    expect(fire(target(), 'contextmenu').defaultPrevented).toBe(false)
  })
})
