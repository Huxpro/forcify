import type { ForcifyOptions } from './types'

export const defaults: ForcifyOptions = {
  LONG_PRESS_DELAY: 200,
  LONG_PRESS_DURATION: 1000,
  LONG_PRESS_TOLERANCE: 10,
  FALLBACK_TO_LONGPRESS: true,
  SHIM_WEIRD_BROWSER: true,
  DISABLE_NATIVE_GESTURES: true,
  POINTER_TYPES: ['mouse', 'touch', 'pen'],
  PEEK_THRESHOLD: 0.3,
  POP_THRESHOLD: 0.6,
  HAPTICS: true,
  PREVENT_CLICK: true,
  LONG_PRESS_EASING: (progress) => progress,
  CSS_VARIABLE: '--force',
  STATE_ATTRIBUTE: 'data-force-state',
}
