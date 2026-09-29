/**
 *  pen.ts
 *
 *  Pressure-sensitive pens through Pointer Events: Apple Pencil on iPadOS
 *  13+, Surface Pen and Wacom tablets on Windows, S Pen on Android, and
 *  Linux tablets. Also reports pens hovering above the screen, like Apple
 *  Pencil hover on iPadOS 16.1+.
 *
 *  Pointer Events report `pressure: 0.5` whenever a button is down on
 *  hardware without pressure, so 0.5 on its own proves nothing: Forcify
 *  waits for any other value before trusting a pen, and until then lets the
 *  long-press fallback run.
 */

import { detection } from '../detection'
import type Forcify from '../forcify'
import { fromPointer } from '../point'
import { listen, type Teardown } from '../utils'

const isPen = (e: PointerEvent) => e.pointerType === 'pen'

export function bindPen(f: Forcify): Teardown[] {
  if (!detection.POINTER_EVENTS) return []
  const el = f.element
  const doc = el.ownerDocument

  const sample = (e: PointerEvent) => {
    const pressure = e.pressure
    if (!detection.PEN_PRESSURE) {
      if (!(pressure > 0 && pressure < 1 && pressure !== 0.5)) return
      detection.PEN_PRESSURE = true
    }
    f._sample('pen', pressure, e, fromPointer(e))
  }

  return [
    // Registered after press.ts, so the press has already begun.
    listen<PointerEvent>(el, 'pointerdown', (e) => {
      const g = f._gesture
      if (!isPen(e) || !g || g.id !== e.pointerId || g.pointerType !== 'pen') return
      g.teardown.push(
        listen<PointerEvent>(doc, 'pointermove', (ev) => ev.pointerId === g.id && sample(ev)),
      )
      sample(e)
    }),
    listen<PointerEvent>(el, 'pointermove', (e) => {
      if (!isPen(e) || f._gesture || e.buttons !== 0 || !f._accepts('pen')) return
      detection.PEN_HOVER = true
      f._hover(fromPointer(e), true, e)
    }),
    listen<PointerEvent>(el, 'pointerleave', (e) => {
      if (isPen(e) && f._hovering) f._hover(fromPointer(e), false, e)
    }),
  ]
}
