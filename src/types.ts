import type Forcify from './forcify'

/**
 * Where a force value came from.
 *
 * - `touch3d`    — iPhone 3D Touch, read from `Touch.force`.
 * - `forcetouch` — macOS Force Touch trackpad, read from `MouseEvent.webkitForce`.
 * - `longpress`  — emulated: the value ramps from 0 to 1 while the press is held.
 */
export type ForceSource = 'touch3d' | 'forcetouch' | 'longpress'

/** The kind of pointer driving a press. Mirrors `PointerEvent.pointerType`. */
export type PointerKind = 'mouse' | 'touch' | 'pen'

export interface ForcifyOptions {
  /** Milliseconds a press must be held before the emulated force starts. */
  LONG_PRESS_DELAY: number
  /** Milliseconds the emulated force takes to ramp from 0 to 1. */
  LONG_PRESS_DURATION: number
  /** Pixels a pointer may move before a pending long press is cancelled. */
  LONG_PRESS_TOLERANCE: number
  /** Emulate force with a long press on devices without pressure hardware. */
  FALLBACK_TO_LONGPRESS: boolean
  /** Ignore the bogus force values some browsers report (Chrome's constant 1, Android's contact area). */
  SHIM_WEIRD_BROWSER: boolean
  /**
   * Stop the platform's own long-press / force-press behaviour on the element:
   * the iOS callout and link preview, text selection, dragging, the Android
   * long-press context menu and the macOS force-click Look Up.
   */
  DISABLE_NATIVE_GESTURES: boolean
}

export interface ForceEvent {
  type: 'force'
  /** Normalized force, from 0 (no force) to 1 (maximum). */
  force: number
  source: ForceSource
  pointerType: PointerKind
  /** The DOM event that produced this value. */
  nativeEvent: Event
  /** The element the Forcify instance is attached to. */
  target: HTMLElement
  instance: Forcify
  /** `performance.now()` when the event was emitted. */
  timeStamp: number
}

export interface ForcifyEventMap {
  force: ForceEvent
}

export type ForcifyEventName = keyof ForcifyEventMap

export type ForcifyHandler<K extends ForcifyEventName = ForcifyEventName> = (
  this: Forcify,
  event: ForcifyEventMap[K],
) => void

export interface ForcifyDetection {
  /** An iPhone 3D Touch sample has been seen. Detected at runtime. */
  TOUCH3D: boolean
  /** A macOS Force Touch trackpad event has been seen. Detected at runtime. */
  OSXFORCE: boolean
  /** A touch reported the bogus `force: 1, webkitForce: 1` pair. Detected at runtime. */
  WEIRD_CHROME: boolean
  /** The user agent is Android, whose `Touch.force` reports contact area, not pressure. */
  ANDROID: boolean
  /** The browser supports Pointer Events. */
  POINTER_EVENTS: boolean
}
