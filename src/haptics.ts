/**
 *  haptics.ts
 *
 *  3D Touch came with the Taptic Engine: every peek and pop was felt as well
 *  as seen. The web never got a haptics API on iOS, but two things work:
 *
 *  - `navigator.vibrate()` on Android (Chrome, Firefox, Samsung Internet).
 *  - On iOS 18+, Safari plays a system haptic when an
 *    `<input type="checkbox" switch>` is toggled — including through a
 *    `<label>` click. Forcify toggles a hidden switch to borrow it.
 *
 *  Both are best-effort: browsers may ignore them without a prior user
 *  gesture on the page, and neither reports whether anything was felt.
 */

import { detection } from './detection'

export type HapticStyle = 'light' | 'medium' | 'heavy'

const VIBRATION: Record<HapticStyle, number | number[]> = {
  light: 8,
  medium: 16,
  heavy: [16, 40, 16],
}

function tick(): void {
  const label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.head.appendChild(label)
  label.click()
  document.head.removeChild(label)
}

/**
 * Play a short haptic, where the platform allows one.
 * @returns whether a haptic mechanism was available.
 */
export function haptic(style: HapticStyle = 'light'): boolean {
  if (detection.HAPTICS === 'vibrate') {
    try {
      return navigator.vibrate(VIBRATION[style])
    } catch {
      return false
    }
  }
  if (detection.HAPTICS === 'switch') {
    tick()
    // iOS has a single switch haptic; play it twice for a heavy one.
    if (style === 'heavy') setTimeout(tick, 60)
    return true
  }
  return false
}
