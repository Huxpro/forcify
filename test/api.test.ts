import { describe, expect, it, vi } from 'vitest'
import Forcify from '../src'
import { advance, last, pointer, record, setup, target } from './helpers'

setup()

describe('constructor', () => {
  it('accepts an element or a selector', () => {
    expect(new Forcify(target()).element).toBe(target())
    expect(new Forcify('#target').element).toBe(target())
  })

  it('throws when the element does not exist', () => {
    expect(() => new Forcify('#nope')).toThrow(TypeError)
  })

  it('merges options over the defaults without touching them', () => {
    const f = new Forcify(target(), { LONG_PRESS_DELAY: 50 })
    expect(f.options.LONG_PRESS_DELAY).toBe(50)
    expect(f.options.LONG_PRESS_DURATION).toBe(Forcify.defaults.LONG_PRESS_DURATION)
    expect(Forcify.defaults.LONG_PRESS_DELAY).toBe(200)
  })

  it('gives every instance a unique uid', () => {
    expect(new Forcify(target()).uid).not.toBe(new Forcify(target()).uid)
  })
})

describe('statics', () => {
  it('exposes the version', () => {
    expect(Forcify.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('config() accepts flat options', () => {
    Forcify.config({ LONG_PRESS_DELAY: 300 })
    expect(Forcify.defaults.LONG_PRESS_DELAY).toBe(300)
    expect(new Forcify(target()).options.LONG_PRESS_DELAY).toBe(300)
  })

  it('config() accepts the 0.x { defaults } form', () => {
    Forcify.config({ defaults: { LONG_PRESS_DURATION: 500 } })
    expect(Forcify.defaults.LONG_PRESS_DURATION).toBe(500)
    expect('defaults' in Forcify.defaults).toBe(false)
  })
})

describe('events', () => {
  const press = (f: Forcify) => {
    pointer(f.element, 'pointerdown')
    advance(f.options.LONG_PRESS_DELAY + f.options.LONG_PRESS_DURATION)
    pointer(document, 'pointerup')
  }

  it('on() is chainable and calls handlers with the instance as this', () => {
    const f = new Forcify(target())
    let self: unknown
    expect(f.on('force', function () { self = this })).toBe(f)
    press(f)
    expect(self).toBe(f)
  })

  it('off() removes one handler, a type, or everything', () => {
    const f = new Forcify(target())
    const a = vi.fn()
    const b = vi.fn()
    f.on('force', a).on('force', b).off('force', a)
    press(f)
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalled()

    b.mockClear()
    f.off('force')
    press(f)
    expect(b).not.toHaveBeenCalled()

    f.on('force', b).off()
    press(f)
    expect(b).not.toHaveBeenCalled()
  })

  it('once() fires a single time', () => {
    const f = new Forcify(target())
    const fn = vi.fn()
    f.once('force', fn)
    press(f)
    press(f)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('a throwing handler does not stop the others', () => {
    const reportError = vi.fn()
    vi.stubGlobal('reportError', reportError)
    const f = new Forcify(target())
    const after = vi.fn()
    f.on('force', () => { throw new Error('boom') }).on('force', after)
    press(f)
    expect(after).toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('carries the element, instance and native event', () => {
    const f = new Forcify(target())
    let event: Parameters<Parameters<typeof f.on<'force'>>[1]>[0] | undefined
    f.once('force', (e) => { event = e })
    press(f)
    expect(event!.type).toBe('force')
    expect(event!.target).toBe(target())
    expect(event!.instance).toBe(f)
    expect(event!.nativeEvent.type).toBe('pointerdown')
  })

  it('bubbles: presses on children count', () => {
    const f = new Forcify(target())
    const events = record(f)
    pointer(document.getElementById('child')!, 'pointerdown')
    advance(1200)
    expect(last(events).force).toBe(1)
  })
})

describe('destroy()', () => {
  it('stops listening and restores inline styles', () => {
    target().style.setProperty('user-select', 'text')
    const f = new Forcify(target())
    expect(target().style.getPropertyValue('user-select')).toBe('none')
    const events = record(f)
    f.destroy()
    expect(target().style.getPropertyValue('user-select')).toBe('text')
    pointer(target(), 'pointerdown')
    advance(2000)
    expect(events).toEqual([])
  })

  it('stops a press in progress', () => {
    const f = new Forcify(target())
    const events = record(f)
    pointer(target(), 'pointerdown')
    advance(500)
    const count = events.length
    f.destroy()
    advance(1000)
    expect(events.length).toBe(count)
  })
})

describe('setStyles', () => {
  it('restores aliased properties to their original value', async () => {
    const { setStyles } = await import('../src/utils')
    // Simulate a browser where -webkit-user-select aliases user-select.
    const values: Record<string, string> = {}
    const alias = (p: string) => (p === '-webkit-user-select' ? 'user-select' : p)
    const el = {
      style: {
        getPropertyValue: (p: string) => values[alias(p)] || '',
        getPropertyPriority: () => '',
        setProperty: (p: string, v: string) => { values[alias(p)] = v },
        removeProperty: (p: string) => { delete values[alias(p)] },
      },
    } as unknown as HTMLElement
    const restore = setStyles(el, { '-webkit-user-select': 'none', 'user-select': 'none' })
    expect(values['user-select']).toBe('none')
    restore()
    expect(values['user-select']).toBeUndefined()
  })
})
