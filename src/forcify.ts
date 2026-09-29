/**
 *  forcify.ts
 *
 *  Core of Forcify: the public class, the event emitter and the per-press
 *  gesture state that every input module feeds into.
 *  created by @huxpro
 */

import { defaults } from './defaults'
import { detection } from './detection'
import { bindMouseForce } from './inputs/mouse-force'
import { bindNativeGestures } from './inputs/native-gestures'
import { bindPress } from './inputs/press'
import { bindTouchForce } from './inputs/touch-force'
import type {
  ForceEvent,
  ForceSource,
  ForcifyDetection,
  ForcifyEventMap,
  ForcifyEventName,
  ForcifyHandler,
  ForcifyOptions,
  PointerKind,
} from './types'
import { clamp01, now, report, type Teardown } from './utils'

/** @internal State of the press currently held on an instance. */
export interface Gesture {
  pointerType: PointerKind
  /** Pointer id or touch identifier that owns the press. */
  id: number
  /** `null` until a force value has been produced. */
  source: ForceSource | null
  startTime: number
  startX: number
  startY: number
  /** Pending long-press timer. */
  timer: ReturnType<typeof setTimeout> | undefined
  /** Pending animation frame of the long-press ramp. */
  frame: number
  /** The latest DOM event of the press. */
  event: Event
  /** Listeners that only live as long as the press. */
  teardown: Teardown[]
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

    this._teardown.push(
      ...bindPress(this),
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
    this._gesture = null
    this._teardown.forEach((fn) => fn())
    this._teardown = []
    this._handlers = {}
  }

  // ---------------------------------------------------------------------------
  // Gesture lifecycle, driven by the input modules.
  // ---------------------------------------------------------------------------

  /** @internal A press started. Starts the long-press fallback if appropriate. */
  _begin(pointerType: PointerKind, id: number, x: number, y: number, event: Event): Gesture {
    if (this._gesture) return this._gesture
    const gesture: Gesture = (this._gesture = {
      pointerType,
      id,
      source: null,
      startTime: now(),
      startX: x,
      startY: y,
      timer: undefined,
      frame: 0,
      event,
      teardown: [],
    })
    if (this._canFallback(pointerType)) {
      gesture.timer = setTimeout(() => this._longPress(), this.options.LONG_PRESS_DELAY)
    }
    return gesture
  }

  /** @internal The pressing pointer moved. Cancels a long press that has not started yet. */
  _move(x: number, y: number, event: Event): void {
    const g = this._gesture
    if (!g) return
    g.event = event
    if (g.timer === undefined) return
    const tolerance = this.options.LONG_PRESS_TOLERANCE
    const dx = x - g.startX
    const dy = y - g.startY
    if (dx * dx + dy * dy > tolerance * tolerance) {
      clearTimeout(g.timer)
      g.timer = undefined
    }
  }

  /** @internal A real pressure sample arrived. Replaces any emulation for this press. */
  _sample(source: ForceSource, force: number, nativeEvent: Event): void {
    const g = this._gesture
    if (!g) return
    g.event = nativeEvent
    if (g.source !== source) {
      this._cancel()
      g.source = source
    }
    this._emit(g, force)
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
  }

  private _canFallback(pointerType: PointerKind): boolean {
    if (!this.options.FALLBACK_TO_LONGPRESS) return false
    // A 3D Touch screen reports real force for every touch, so a light touch
    // really is force 0 and must not be turned into a fake press.
    return !(pointerType === 'touch' && detection.TOUCH3D)
  }

  private _longPress(): void {
    const g = this._gesture
    if (!g) return
    g.timer = undefined
    if (g.source) return
    g.source = 'longpress'
    const { LONG_PRESS_DELAY: delay, LONG_PRESS_DURATION: duration } = this.options
    const start = g.startTime + delay
    const tick = (): void => {
      if (this._gesture !== g || g.source !== 'longpress') return
      const progress = duration > 0 ? (now() - start) / duration : 1
      this._emit(g, progress)
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

  private _emit(g: Gesture, value: number): void {
    const force = clamp01(value)
    if (force === this.force) return
    this.force = force
    this._dispatch('force', {
      type: 'force',
      force,
      source: g.source || 'longpress',
      pointerType: g.pointerType,
      nativeEvent: g.event,
      target: this.element,
      instance: this,
      timeStamp: now(),
    } satisfies ForceEvent)
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
