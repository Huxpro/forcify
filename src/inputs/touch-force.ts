/**
 *  touch-force.ts
 *
 *  iPhone 3D Touch: reads `Touch.force` while a finger is down. Also owns
 *  the start and end of touch presses on browsers without Pointer Events,
 *  and Apple Pencil pressure on iPadOS versions without Pointer Events.
 *
 *  It's hard to judge if 3D Touch is truly supported:
 *
 *  - Touches on a 3D Touch iPhone start at force 0,
 *  - touches on an iPhone without 3D Touch stay at force 0,
 *    so we never know whether a device is unsupported or just not pressed yet.
 *  - Chrome Mobile reports force 1 (and webkitForce 1) for every touch,
 *  - some Android devices report the contact *area* as force.
 *
 *  So Forcify detects 3D Touch dynamically: the first touch with a force
 *  strictly between 0 and 1 on a non-Android device proves the hardware.
 *
 *  iOS 10+ fires `touchforcechange` when only the force changes. Older iOS
 *  fires nothing, but its Touch objects are live, so Forcify also polls the
 *  force every animation frame while the finger is down.
 */

import { detection } from '../detection'
import type Forcify from '../forcify'
import { fromTouch } from '../point'
import { listen, now, type Teardown } from '../utils'

type WebKitTouch = Touch & { webkitForce?: number; touchType?: 'direct' | 'stylus' }

function find(list: TouchList, id: number): Touch | undefined {
  for (let i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i]
  return undefined
}

const isStylus = (t: WebKitTouch) => t.touchType === 'stylus'

export function bindTouchForce(f: Forcify): Teardown[] {
  const el = f.element
  let touch: WebKitTouch | null = null
  let event: Event | null = null
  let frame = 0

  const stop = () => {
    cancelAnimationFrame(frame)
    touch = event = null
    frame = 0
  }

  /** Feed one sample to the instance. Returns false when this touch can never carry real force. */
  const read = (t: WebKitTouch, e: Event): boolean => {
    const force = t.force
    if (typeof force !== 'number') return false
    if (isStylus(t)) {
      if (force > 0) detection.PEN_PRESSURE = true
      f._sample('pen', force, e, fromTouch(t))
      return true
    }
    if (f.options.SHIM_WEIRD_BROWSER) {
      if (force === 1 && t.webkitForce === 1) detection.WEIRD_CHROME = true
      if (detection.WEIRD_CHROME || detection.ANDROID) return false
      if (force > 0 && force < 1) detection.TOUCH3D = true
      // Keep watching: this may be a 3D Touch screen that is not pressed yet.
      if (!detection.TOUCH3D) return true
    } else if (force <= 0 && f._gesture?.source !== 'touch3d') {
      return true
    }
    f._sample('touch3d', force, e, fromTouch(t))
    return true
  }

  const poll = () => {
    if (!touch || !event || !f._gesture) return stop()
    frame = read(touch, event) ? requestAnimationFrame(poll) : 0
  }

  const update = (e: TouchEvent) => {
    if (!touch) return
    const t = find(e.touches, touch.identifier)
    if (!t) return
    touch = t
    event = e
    if (e.type === 'touchforcechange' && f._gesture) read(t, e)
  }

  const release = (e: TouchEvent) => {
    f._lastTouch = now()
    if (!touch || !find(e.changedTouches, touch.identifier)) return
    stop()
    f._end(e)
  }

  return [
    listen<TouchEvent>(el, 'touchstart', (e) => {
      f._lastTouch = now()
      if (touch) return // one finger per element
      const t = e.targetTouches[0] as WebKitTouch | undefined
      if (!t) return
      const kind = isStylus(t) ? 'pen' : 'touch'
      // With Pointer Events, pen pressure comes from PointerEvent.pressure.
      if (kind === 'pen' && detection.POINTER_EVENTS) return
      if (!f._accepts(kind)) return
      const g = f._begin(kind, t.identifier, fromTouch(t), e)
      if (g.pointerType !== kind) return
      touch = t
      event = e
      poll()
    }, { passive: true }),
    listen<TouchEvent>(el, 'touchmove', update, { passive: true }),
    listen<TouchEvent>(el, 'touchforcechange', update, { passive: true }),
    listen<TouchEvent>(el, 'touchend', release),
    listen<TouchEvent>(el, 'touchcancel', release),
    stop,
  ]
}
