/**
 *  forcify.ts
 *
 *  Core of Forcify: the public class, the event emitter and the per-press
 *  gesture state that every input module feeds into.
 *  created by @huxpro
 */

import { defaults } from './defaults'
import { detection } from './detection'
import { haptic, type HapticStyle } from './haptics'
import { bindMouseForce } from './inputs/mouse-force'
import { bindNativeGestures } from './inputs/native-gestures'
import { bindPen } from './inputs/pen'
import { bindPress } from './inputs/press'
import { bindTouchForce } from './inputs/touch-force'
import type { Point } from './point'
import type {
  ForceEvent,
  ForceEventType,
  ForceSource,
  ForcifyDetection,
  ForcifyEventMap,
  ForcifyEventName,
  ForcifyHandler,
  ForcifyOptions,
  HoverEvent,
  PointerKind,
} from './types'
import { clamp01, listen, now, report, type Teardown } from './utils'

/** @internal State of the press currently held on an instance. */
export interface Gesture {
  pointerType: PointerKind
  /** Pointer id or touch identifier that owns the press. */
  id: number
  /** `null` until a force value has been produced. */
  source: ForceSource | null
  startTime: number
  /** Where the press started. */
  origin: Point
  /** Where the pointer is now. */
  point: Point
  /** Pending long-press timer. */
  timer: ReturnType<typeof setTimeout> | undefined
  /** Pending animation frame of the long-press ramp. */
  frame: number
  /** The latest DOM event of the press. */
  event: Event
  /** Listeners that only live as long as the press. */
  teardown: Teardown[]
  maxForce: number
  started: boolean
  peeked: boolean
  popped: boolean
}

type Target = Element | string

let uid = 0

function resolve(target: Target): HTMLElement {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el || typeof (el as Node).addEventListener !== 'function') {
    throw new TypeError(`Forcify: cannot find element ${String(target)}`)
  }
  return el as HTMLElement
}

/**
 * @class Forcify
 */
export default class Forcify {
  /** Library version. */
  static readonly version: string = __VERSION__

  /** Options every new instance starts from. */
  static defaults: ForcifyOptions = Object.assign({}, defaults)

  /** What Forcify has learned about the current device. */
  static readonly detection: ForcifyDetection = detection

  /**
   * Override default options globally.
   *
   * Accepts the options directly (`Forcify.config({ LONG_PRESS_DELAY: 300 })`)
   * or, as in Forcify 0.x, wrapped in `defaults`.
   */
  /**
   * Play a short haptic where the platform allows: `navigator.vibrate` on
   * Android, a system switch haptic on iOS 18+. Best-effort.
   * @returns whether a haptic mechanism was available.
   */
  static haptic(style?: HapticStyle): boolean {
    return haptic(style)
  }

  static config(config: Partial<ForcifyOptions> & { defaults?: Partial<ForcifyOptions> }): ForcifyOptions {
    const flat: Partial<ForcifyOptions> & { defaults?: unknown } = Object.assign({}, config)
    delete flat.defaults
    return Object.assign(Forcify.defaults, config.defaults, flat)
  }

  readonly uid: number
  readonly element: HTMLElement
  readonly options: ForcifyOptions

  /** The latest force value emitted, from 0 to 1. */
  force = 0

  /** @internal */ _gesture: Gesture | null = null
  /** @internal */ _lastTouch = -Infinity
  /** @internal */ _hovering = false
  private _lastKey = ''
  private _handlers: { [K in ForcifyEventName]?: Array<ForcifyHandler<K>> } = {}
  private _teardown: Teardown[] = []

  /**
   * @param target   Element, or a CSS selector for one.
   * @param options  Overrides for {@link Forcify.defaults}.
   */
  constructor(target: Target, options?: Partial<ForcifyOptions>) {
    this.uid = ++uid
    this.element = resolve(target)
    this.options = Object.assign({}, Forcify.defaults, options)
    this.options.POINTER_TYPES = this.options.POINTER_TYPES.slice()

    this._teardown.push(
      ...bindPress(this),
      ...bindPen(this),
      ...bindTouchForce(this),
      ...bindMouseForce(this),
      ...bindNativeGestures(this),
    )
  }

  /** Add an event listener. */
  on<K extends ForcifyEventName>(type: K, handler: ForcifyHandler<K>): this {
    const list = (this._handlers[type] ||= []) as Array<ForcifyHandler<K>>
    list.push(handler)
    return this
  }

  /** Remove one listener, every listener of a type, or every listener. */
  off<K extends ForcifyEventName>(type?: K, handler?: ForcifyHandler<K>): this {
    if (!type) this._handlers = {}
    else if (!handler) delete this._handlers[type]
    else {
      const list = this._handlers[type] as Array<ForcifyHandler<K>> | undefined
      const i = list ? list.indexOf(handler) : -1
      if (list && i > -1) list.splice(i, 1)
    }
    return this
  }

  /** Add a listener that removes itself after its first call. */
  once<K extends ForcifyEventName>(type: K, handler: ForcifyHandler<K>): this {
    const wrapper: ForcifyHandler<K> = function (this: Forcify, event) {
      this.off(type, wrapper)
      handler.call(this, event)
    }
    return this.on(type, wrapper)
  }

  /** Remove every listener Forcify added and restore the element. */
  destroy(): void {
    this._cancel()
    this._gesture?.teardown.forEach((fn) => fn())
    this._gesture = null
    this._state(false)
    if (this.options.CSS_VARIABLE) this.element.style.removeProperty(this.options.CSS_VARIABLE)
    this._teardown.forEach((fn) => fn())
    this._teardown = []
    this._handlers = {}
  }

  // ---------------------------------------------------------------------------
  // Gesture lifecycle, driven by the input modules.
  // ---------------------------------------------------------------------------

  /** @internal A press started. Starts the long-press fallback if appropriate. */
  _begin(pointerType: PointerKind, id: number, point: Point, event: Event): Gesture {
    if (this._gesture) return this._gesture
    if (this._hovering) this._hover(point, false, event)
    const gesture: Gesture = (this._gesture = {
      pointerType,
      id,
      source: null,
      startTime: now(),
      origin: point,
      point,
      timer: undefined,
      frame: 0,
      event,
      teardown: [],
      maxForce: 0,
      started: false,
      peeked: false,
      popped: false,
    })
    if (this._canFallback(pointerType)) {
      gesture.timer = setTimeout(() => this._longPress(), this.options.LONG_PRESS_DELAY)
    }
    return gesture
  }

  /** @internal The pressing pointer moved. Cancels a long press that has not started yet. */
  _move(point: Point, event: Event): void {
    const g = this._gesture
    if (!g) return
    g.event = event
    g.point = point
    if (g.timer === undefined) return
    const tolerance = this.options.LONG_PRESS_TOLERANCE
    const dx = point.x - g.origin.x
    const dy = point.y - g.origin.y
    if (dx * dx + dy * dy > tolerance * tolerance) {
      clearTimeout(g.timer)
      g.timer = undefined
    }
  }

  /** @internal A real pressure sample arrived. Replaces any emulation for this press. */
  _sample(source: ForceSource, force: number, nativeEvent: Event, point?: Point): void {
    const g = this._gesture
    if (!g) return
    g.event = nativeEvent
    if (point) g.point = point
    if (g.source !== source) {
      this._cancel()
      g.source = source
    }
    this._emit(g, force)
  }

  /** @internal A native force click (macOS) — pop right away. */
  _pop(nativeEvent: Event): void {
    const g = this._gesture
    if (!g || g.popped) return
    g.event = nativeEvent
    this._threshold(g, 'peek')
    this._threshold(g, 'pop')
  }

  /** @internal The press ended. Resets force to 0. */
  _end(nativeEvent: Event): void {
    const g = this._gesture
    if (!g) return
    this._cancel()
    g.teardown.forEach((fn) => fn())
    g.event = nativeEvent
    this._gesture = null
    if (this.force !== 0) this._emit(g, 0)
    if (!g.started) return
    this._state(false)
    this._dispatch('forceend', this._event('forceend', g))
    if (g.peeked && this.options.PREVENT_CLICK) this._swallowClick()
  }

  /** @internal Whether this kind of pointer may press, per POINTER_TYPES. */
  _accepts(pointerType: string): pointerType is PointerKind {
    return this.options.POINTER_TYPES.indexOf(pointerType as PointerKind) > -1
  }

  private _canFallback(pointerType: PointerKind): boolean {
    if (!this.options.FALLBACK_TO_LONGPRESS) return false
    // A 3D Touch screen or a pressure pen reports real force for every press,
    // so a light press really is force 0 and must not become a fake one.
    if (pointerType === 'touch') return !detection.TOUCH3D
    if (pointerType === 'pen') return !detection.PEN_PRESSURE
    return true
  }

  private _longPress(): void {
    const g = this._gesture
    if (!g) return
    g.timer = undefined
    if (g.source) return
    g.source = 'longpress'
    const { LONG_PRESS_DELAY: delay, LONG_PRESS_DURATION: duration, LONG_PRESS_EASING: ease } = this.options
    const start = g.startTime + delay
    const tick = (): void => {
      if (this._gesture !== g || g.source !== 'longpress') return
      const progress = duration > 0 ? clamp01((now() - start) / duration) : 1
      this._emit(g, ease(progress))
      if (progress < 1) g.frame = requestAnimationFrame(tick)
    }
    tick()
  }

  private _cancel(): void {
    const g = this._gesture
    if (!g) return
    clearTimeout(g.timer)
    cancelAnimationFrame(g.frame)
    g.timer = undefined
    g.frame = 0
  }

  /** @internal A pen is hovering over the element without touching it. */
  _hover(point: Point, hovering: boolean, nativeEvent: Event): void {
    this._hovering = hovering
    this._dispatch('hover', {
      type: 'hover',
      hovering,
      ...point,
      pointerType: 'pen',
      nativeEvent,
      target: this.element,
      instance: this,
      timeStamp: now(),
    } satisfies HoverEvent)
  }

  /** Emits when the force or, for real pressure, the pen position or angle changed. */
  private _emit(g: Gesture, value: number): void {
    const force = clamp01(value)
    const p = g.point
    const key = `${force},${p.x},${p.y},${p.tiltX},${p.tiltY},${p.twist}`
    if (force === this.force && (key === this._lastKey || force === 0)) return
    this.force = force
    this._lastKey = key
    if (force > g.maxForce) g.maxForce = force

    const variable = this.options.CSS_VARIABLE
    if (variable) this.element.style.setProperty(variable, String(force))

    if (!g.started && force > 0) {
      g.started = true
      this._state('pressing')
      this._dispatch('forcestart', this._event('forcestart', g))
    }
    this._dispatch('force', this._event('force', g))
    if (force >= this.options.PEEK_THRESHOLD) this._threshold(g, 'peek')
    if (force >= this.options.POP_THRESHOLD) this._threshold(g, 'pop')
  }

  private _threshold(g: Gesture, type: 'peek' | 'pop'): void {
    if (type === 'peek' ? g.peeked : g.popped) return
    if (type === 'peek') g.peeked = true
    else g.popped = true
    if (!g.started) {
      g.started = true
      this._dispatch('forcestart', this._event('forcestart', g))
    }
    this._state(type)
    if (this.options.HAPTICS) haptic(type === 'peek' ? 'light' : 'medium')
    this._dispatch(type, this._event(type, g))
  }

  private _event(type: ForceEventType, g: Gesture): ForceEvent {
    return {
      type,
      force: this.force,
      source: g.source || 'longpress',
      pointerType: g.pointerType,
      ...g.point,
      maxForce: g.maxForce,
      peeked: g.peeked,
      popped: g.popped,
      nativeEvent: g.event,
      target: this.element,
      instance: this,
      timeStamp: now(),
    }
  }

  private _state(state: 'pressing' | 'peek' | 'pop' | false): void {
    const attr = this.options.STATE_ATTRIBUTE
    if (!attr) return
    if (state) this.element.setAttribute(attr, state)
    else this.element.removeAttribute(attr)
  }

  /** A press that peeked should not also activate the element on release. */
  private _swallowClick(): void {
    const off = listen<MouseEvent>(this.element, 'click', (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      done()
    }, { capture: true })
    const timer = setTimeout(() => done(), 600)
    const done = () => {
      off()
      clearTimeout(timer)
      this._teardown = this._teardown.filter((fn) => fn !== done)
    }
    this._teardown.push(done)
  }

  private _dispatch<K extends ForcifyEventName>(type: K, event: ForcifyEventMap[K]): void {
    const list = this._handlers[type] as Array<ForcifyHandler<K>> | undefined
    if (!list) return
    for (const handler of list.slice()) {
      try {
        handler.call(this, event)
      } catch (error) {
        report(error)
      }
    }
  }
}
