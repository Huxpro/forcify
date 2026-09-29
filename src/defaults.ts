import type { ForcifyOptions } from './types'

export const defaults: ForcifyOptions = {
  LONG_PRESS_DELAY: 200,
  LONG_PRESS_DURATION: 1000,
  LONG_PRESS_TOLERANCE: 10,
  FALLBACK_TO_LONGPRESS: true,
  SHIM_WEIRD_BROWSER: true,
  DISABLE_NATIVE_GESTURES: true,
  POINTER_TYPES: ['mouse', 'touch', 'pen'],
}
