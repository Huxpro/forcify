/**
 *  press.ts
 *
 *  Tracks when a press starts, moves and ends. Uses Pointer Events where
 *  available and falls back to Touch/Mouse Events on older browsers.
 */

import { detection } from '../detection'
import type Forcify from '../forcify'
import { fromPointer, fromTouch } from '../point'
import { listen, now, type Teardown } from '../utils'

/** Mouse events a browser synthesizes after a touch arrive within this window. */
const COMPAT_MOUSE_WINDOW = 1000

export function bindPress(f: Forcify): Teardown[] {
  return detection.POINTER_EVENTS ? bindPointer(f) : bindLegacy(f)
}

function bindPointer(f: Forcify): Teardown[] {
  const el = f.element
  const doc = el.ownerDocument

  return [
    listen<PointerEvent>(el, 'pointerdown', (e) => {
      if (!e.isPrimary || e.button > 0 || !f._accepts(e.pointerType)) return
      const g = f._begin(e.pointerType, e.pointerId, fromPointer(e), e)
      if (g.teardown.length) return
      g.id = e.pointerId // the press may have begun from a touchstart
      const own = (fn: (e: PointerEvent) => void) => (ev: PointerEvent) => {
        if (ev.pointerId === g.id) fn(ev)
      }
      g.teardown.push(
        listen<PointerEvent>(doc, 'pointermove', own((ev) => f._move(fromPointer(ev), ev))),
        listen<PointerEvent>(doc, 'pointerup', own((ev) => f._end(ev))),
        listen<PointerEvent>(doc, 'pointercancel', own((ev) => f._end(ev))),
      )
    }),
  ]
}

function bindLegacy(f: Forcify): Teardown[] {
  const el = f.element
  const doc = el.ownerDocument
  const teardown: Teardown[] = []

  // Touch presses begin and end in touch-force.ts, which owns the touch.
  // Touches are implicitly captured by the element they start on, so an
  // element-level listener sees every move.
  teardown.push(
    listen<TouchEvent>(el, 'touchmove', (e) => {
      const g = f._gesture
      if (!g || g.pointerType !== 'touch') return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === g.id) f._move(fromTouch(t), e)
      }
    }, { passive: true }),
  )

  teardown.push(
    listen<MouseEvent>(el, 'mousedown', (e) => {
      if (e.button !== 0 || !f._accepts('mouse') || now() - f._lastTouch < COMPAT_MOUSE_WINDOW) return
      const g = f._begin('mouse', 1, fromPointer(e), e)
      if (g.teardown.length) return
      g.teardown.push(
        listen<MouseEvent>(doc, 'mousemove', (ev) => f._move(fromPointer(ev), ev)),
        listen<MouseEvent>(doc, 'mouseup', (ev) => f._end(ev)),
      )
    }),
  )

  return teardown
}
