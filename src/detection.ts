import type { ForcifyDetection } from './types'

const hasWindow = typeof window !== 'undefined'
const nav: Partial<Navigator> = typeof navigator !== 'undefined' ? navigator : {}
const ua = nav.userAgent || ''

// iPadOS 13+ asks for desktop sites and reports itself as a Mac; a Mac with
// a touch screen is the giveaway.
const ios = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1)

// Safari 18 plays a haptic when a switch toggles. Newer builds reflect the
// attribute as a property; fall back to the Safari version for the rest.
const switchHaptics =
  ios &&
  hasWindow &&
  ('switch' in HTMLInputElement.prototype || Number((/Version\/(\d+)/.exec(ua) || /OS (\d+)_/.exec(ua) || [])[1]) >= 18)

const haptics: ForcifyDetection['HAPTICS'] =
  switchHaptics ? 'switch'
  : typeof nav.vibrate === 'function' && (nav.maxTouchPoints || 0) > 0 ? 'vibrate'
  : false

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
  IOS: ios,
  POINTER_EVENTS: hasWindow && typeof window.PointerEvent === 'function',
  TOUCH_FORCE_EVENT: hasWindow && 'ontouchforcechange' in window,
  PEN_PRESSURE: false,
  PEN_HOVER: false,
  HAPTICS: haptics,
}
