import type Forcify from './forcify'
import type { Point } from './point'

/**
 * Where a force value came from.
 *
 * - `touch3d`    — iPhone 3D Touch, read from `Touch.force`.
 * - `forcetouch` — macOS Force Touch trackpad, read from `MouseEvent.webkitForce`.
 * - `pen`        — a pressure-sensitive stylus such as Apple Pencil, Surface Pen,
 *                  S Pen or a Wacom tablet, read from `PointerEvent.pressure`.
 * - `longpress`  — emulated: the value ramps from 0 to 1 while the press is held.
 */
export type ForceSource = 'touch3d' | 'forcetouch' | 'pen' | 'longpress'

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
  /** Which pointers may press. Use `['pen']` for a stylus-only surface. */
  POINTER_TYPES: PointerKind[]
  /** Force at which `peek` fires, once per press. */
  PEEK_THRESHOLD: number
  /** Force at which `pop` fires, once per press. A macOS force click always pops. */
  POP_THRESHOLD: number
  /** Play a haptic on peek and pop where the platform allows (Android, iOS 18+). */
  HAPTICS: boolean
  /** Swallow the click that follows a press that reached peek. */
  PREVENT_CLICK: boolean
  /** Shapes the emulated ramp: receives linear progress 0–1, returns force 0–1. */
  LONG_PRESS_EASING: (progress: number) => number
  /** CSS custom property set to the force on the element, or `false`. */
  CSS_VARIABLE: string | false
  /** Attribute set to `pressing`, `peek` or `pop` on the element during a press, or `false`. */
  STATE_ATTRIBUTE: string | false
}

export type { Point }

/** Fields shared by every Forcify event. */
export interface ForcifyEventBase {
  pointerType: PointerKind
  /** The DOM event that produced this value. */
  nativeEvent: Event
  /** The element the Forcify instance is attached to. */
  target: HTMLElement
  instance: Forcify
  /** `performance.now()` when the event was emitted. */
  timeStamp: number
}

/** Types of the events that describe a press. */
export type ForceEventType = 'force' | 'forcestart' | 'peek' | 'pop' | 'forceend'

export interface ForceEvent extends ForcifyEventBase, Point {
  /**
   * - `forcestart` — force rose above 0 for the first time in this press.
   * - `force`      — force (or, for real pressure, pen position) changed.
   * - `peek`       — force reached PEEK_THRESHOLD.
   * - `pop`        — force reached POP_THRESHOLD, or a macOS force click.
   * - `forceend`   — a press that had force ended.
   */
  type: ForceEventType
  /** Normalized force, from 0 (no force) to 1 (maximum). */
  force: number
  source: ForceSource
  /** Highest force reached so far in this press. */
  maxForce: number
  /** Whether this press has reached `peek`. */
  peeked: boolean
  /** Whether this press has reached `pop`. */
  popped: boolean
}

/**
 * A pen hovering above the element without touching it (Apple Pencil hover
 * on iPadOS 16.1+, and most desktop pen tablets).
 */
export interface HoverEvent extends ForcifyEventBase, Point {
  type: 'hover'
  pointerType: 'pen'
  /** `false` once the pen leaves the element, touches down or moves out of range. */
  hovering: boolean
}

export interface ForcifyEventMap {
  force: ForceEvent
  forcestart: ForceEvent
  peek: ForceEvent
  pop: ForceEvent
  forceend: ForceEvent
  hover: HoverEvent
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
  /** The browser fires `touchforcechange` (iOS 10+). */
  TOUCH_FORCE_EVENT: boolean
  /** A pen with real pressure has been seen. Detected at runtime. */
  PEN_PRESSURE: boolean
  /** A pen hovering above the screen has been seen. Detected at runtime. */
  PEN_HOVER: boolean
  /** iOS or iPadOS, including iPadOS asking for desktop sites. */
  IOS: boolean
  /** How {@link Forcify.haptic} plays haptics: `navigator.vibrate`, the iOS 18+ switch, or not at all. */
  HAPTICS: 'vibrate' | 'switch' | false
}
