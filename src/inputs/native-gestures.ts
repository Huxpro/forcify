/**
 *  native-gestures.ts
 *
 *  A long or hard press on a web page usually triggers something of the
 *  platform's own: the iOS callout or link preview, text selection, drag and
 *  drop, or the Android context menu. Forcify turns those off on its element
 *  so the press belongs to the page.
 */

import type Forcify from '../forcify'
import { listen, setStyles, type Teardown } from '../utils'

export function bindNativeGestures(f: Forcify): Teardown[] {
  if (!f.options.DISABLE_NATIVE_GESTURES) return []
  const el = f.element

  return [
    setStyles(el, {
      '-webkit-touch-callout': 'none',
      '-webkit-user-select': 'none',
      'user-select': 'none',
      '-webkit-user-drag': 'none',
    }),
    // Android opens the context menu on long press. A right click still works.
    listen<MouseEvent>(el, 'contextmenu', (e) => {
      const g = f._gesture
      if (g && g.pointerType !== 'mouse') e.preventDefault()
    }),
    listen<DragEvent>(el, 'dragstart', (e) => {
      if (f._gesture) e.preventDefault()
    }),
  ]
}
