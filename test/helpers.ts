import { afterEach, beforeEach, vi } from 'vitest'
import Forcify from '../src'

const initialDetection = { ...Forcify.detection }
const initialDefaults = { ...Forcify.defaults }

export function setup() {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.assign(Forcify.detection, initialDetection, { POINTER_EVENTS: true })
    Object.assign(Forcify.defaults, initialDefaults)
    document.body.innerHTML = '<div id="target"><span id="child"></span></div>'
  })
  afterEach(() => {
    vi.useRealTimers()
  })
}

export const target = () => document.getElementById('target') as HTMLElement

/** Dispatch an event carrying arbitrary properties, like the ones browsers add. */
export function fire(el: EventTarget, type: string, props: Record<string, unknown> = {}): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  for (const key of Object.keys(props)) {
    Object.defineProperty(event, key, { value: props[key], configurable: true })
  }
  el.dispatchEvent(event)
  return event
}

export const pointer = (el: EventTarget, type: string, props: Record<string, unknown> = {}) =>
  fire(el, type, {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    button: 0,
    clientX: 0,
    clientY: 0,
    ...props,
  })

export interface FakeTouch {
  identifier: number
  force?: number
  webkitForce?: number
  clientX: number
  clientY: number
  [key: string]: unknown
}

export const makeTouch = (props: Partial<FakeTouch> = {}): FakeTouch => ({
  identifier: 0,
  clientX: 0,
  clientY: 0,
  ...props,
})

export const touchEvent = (el: EventTarget, type: string, touch: FakeTouch, active = type !== 'touchend' && type !== 'touchcancel') =>
  fire(el, type, {
    touches: active ? [touch] : [],
    targetTouches: active ? [touch] : [],
    changedTouches: [touch],
  })

/** Advance fake time, running timers and animation frames. */
export const advance = (ms: number) => vi.advanceTimersByTime(ms)

export function record(f: Forcify, type: 'force' = 'force') {
  const events: Array<{ force: number; source: string; pointerType: string }> = []
  f.on(type, (e) => events.push({ force: e.force, source: e.source, pointerType: e.pointerType }))
  return events
}

export const last = <T>(list: T[]): T => {
  if (!list.length) throw new Error('expected at least one event')
  return list[list.length - 1]
}
