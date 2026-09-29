export type Teardown = () => void

export const clamp01 = (n: number): number => (n > 0 ? (n < 1 ? n : 1) : 0)

export const now = (): number =>
  typeof performance !== 'undefined' ? performance.now() : Date.now()

export function listen<E extends Event = Event>(
  target: EventTarget,
  type: string,
  handler: (event: E) => void,
  options?: AddEventListenerOptions,
): Teardown {
  const fn = handler as EventListener
  target.addEventListener(type, fn, options)
  return () => target.removeEventListener(type, fn, options)
}

/** Report an error thrown by a user handler without breaking the gesture. */
export function report(error: unknown): void {
  const g = (typeof self !== 'undefined' ? self : undefined) as { reportError?: (e: unknown) => void } | undefined
  if (g && typeof g.reportError === 'function') g.reportError(error)
  else setTimeout(() => { throw error })
}

/** Set inline style properties and return a function that restores the old values. */
export function setStyles(el: HTMLElement, styles: Record<string, string>): Teardown {
  const previous: Array<[string, string, string]> = []
  for (const prop of Object.keys(styles)) {
    previous.push([prop, el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)])
    el.style.setProperty(prop, styles[prop])
  }
  // Restore in reverse: some properties alias each other (Chrome treats
  // -webkit-user-select as user-select), so the first saved value wins.
  return () => {
    for (const [prop, value, priority] of previous.reverse()) {
      if (value) el.style.setProperty(prop, value, priority)
      else el.style.removeProperty(prop)
    }
  }
}
