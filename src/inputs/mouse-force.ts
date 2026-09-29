/**
 *  mouse-force.ts
 *
 *  macOS Force Touch trackpads: Safari reports pressure as
 *  `MouseEvent.webkitForce` and fires `webkitmouseforce*` events.
 *
 *  webkitForce is 0–1 while the finger rests on the trackpad, 1 at a normal
 *  click (WEBKIT_FORCE_AT_MOUSE_DOWN), 2 at a force click
 *  (WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN) and up to 3 at maximum pressure.
 *  Forcify maps the range after the click, 1–3, onto 0–1.
 */

import { detection } from '../detection'
import type Forcify from '../forcify'
import { clamp01, listen, type Teardown } from '../utils'

type ForceMouseEvent = MouseEvent & { webkitForce?: number }

const MOUSE_DOWN = 1
const MAX = 3

export const normalizeWebkitForce = (webkitForce: number): number =>
  clamp01((webkitForce - MOUSE_DOWN) / (MAX - MOUSE_DOWN))

export function bindMouseForce(f: Forcify): Teardown[] {
  const el = f.element

  return [
    listen<ForceMouseEvent>(el, 'webkitmouseforcewillbegin', (e) => {
      detection.OSXFORCE = true
      // Stops Look Up / Quick Look from taking over the force click.
      if (f.options.DISABLE_NATIVE_GESTURES) e.preventDefault()
    }),
    // Decided per press, so a Mac that switches between a Force Touch
    // trackpad and a regular mouse gets real force on one and the
    // long-press fallback on the other.
    listen<ForceMouseEvent>(el, 'mousedown', (e) => {
      const g = f._gesture
      if (!g || g.pointerType !== 'mouse' || !(e.webkitForce! > 0)) return
      detection.OSXFORCE = true
      f._sample('forcetouch', normalizeWebkitForce(e.webkitForce!), e)
    }),
    listen<ForceMouseEvent>(el, 'webkitmouseforcechanged', (e) => {
      if (f._gesture?.source === 'forcetouch') {
        f._sample('forcetouch', normalizeWebkitForce(e.webkitForce || 0), e)
      }
    }),
  ]
}
