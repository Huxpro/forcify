import type { ForcifyDetection } from './types'

const hasWindow = typeof window !== 'undefined'
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

/**
 * Environment detection shared by every instance.
 *
 * Pressure hardware cannot be feature-detected — an iPhone without 3D Touch
 * reports `force: 0` just like an iPhone with 3D Touch that is being touched
 * lightly — so the runtime flags start `false` and flip to `true` the first
 * time a real sample is observed.
 */
export const detection: ForcifyDetection = {
  TOUCH3D: false,
  OSXFORCE: false,
  WEIRD_CHROME: false,
  ANDROID: /Android/i.test(ua),
  POINTER_EVENTS: hasWindow && typeof window.PointerEvent === 'function',
}
