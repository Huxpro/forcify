# Forcify

> Use **force** on any device, today.

Forcify gives you one `force` value, from 0 to 1, whatever the hardware: 3D Touch iPhones, Force Touch trackpads, and pressure pens like Apple Pencil, Surface Pen, S Pen or Wacom tablets. On devices with no pressure at all, a long press stands in for it. It also adds Peek & Pop events, haptics and CSS hooks on top.

```js
import Forcify from 'forcify'

new Forcify('#card')
  .on('force', (e) => (e.target.style.scale = 1 + e.force / 2))
  .on('peek', () => showPreview())
  .on('pop', () => openCard())
```

**[Live demos and full documentation →](https://huxpro.github.io/forcify)**

## Install

```bash
npm install forcify
```

Or load it from a CDN:

```html
<!-- ES module -->
<script type="module">
  import Forcify from 'https://unpkg.com/forcify/dist/forcify.mjs'
</script>

<!-- classic script: exposes window.Forcify (also works with AMD) -->
<script src="https://unpkg.com/forcify/dist/forcify.min.js"></script>
```

`require('forcify')` returns the class, and TypeScript types are included.

## How it works

1. **Real pressure when there is some.** Forcify reads `Touch.force` on 3D Touch iPhones, `webkitForce` on Force Touch trackpads and `PointerEvent.pressure` on pens. 3D Touch and pen pressure cannot be feature-detected, so it watches for the first genuine sample and switches over as soon as one arrives.
2. **No bogus values.** Chrome used to report `force: 1` for every touch, and Android reports finger *area* as force. Forcify recognizes these cases and ignores them (`SHIM_WEIRD_BROWSER`).
3. **A long press everywhere else.** After `LONG_PRESS_DELAY` the force ramps from 0 to 1 over `LONG_PRESS_DURATION`. The ramp is cancelled if the pointer moves or the page scrolls. With the defaults, `peek` fires at 500 ms, the same timing as iOS Haptic Touch.

See [docs/compatibility.md](docs/compatibility.md) for the full matrix and for what changed across every iOS generation since 2015.

## Events

```js
const f = new Forcify(element, options)
f.on(type, handler)   // chainable; also once(type, handler) and off([type], [handler])
```

| Event | When |
| --- | --- |
| `forcestart` | force rises above 0 for the first time in a press |
| `force` | force changes (or, for pens, position or angle changes) |
| `peek` | force reaches `PEEK_THRESHOLD`, once per press |
| `pop` | force reaches `POP_THRESHOLD`, or a macOS force click, once per press |
| `forceend` | a press that had force ends |
| `hover` | a pen hovers over the element (Apple Pencil hover, pen tablets) |

Every force event carries:

```ts
{
  type, force,              // 0–1
  source,                   // 'touch3d' | 'forcetouch' | 'pen' | 'longpress'
  pointerType,              // 'touch' | 'mouse' | 'pen'
  x, y,                     // client coordinates
  tiltX, tiltY, twist,      // pen tilt and rotation, in degrees
  altitudeAngle, azimuthAngle, // pen angles, in radians
  maxForce, peeked, popped, // the press so far
  nativeEvent, target, instance, timeStamp,
}
```

`hover` events carry `hovering` (which is `false` when the pen leaves) plus the same position and angle fields.

## Options

Pass options to the constructor, or change the defaults for every new instance with `Forcify.config({ ... })`.

| Option | Default | |
| --- | --- | --- |
| `LONG_PRESS_DELAY` | `200` | ms before the emulated force starts |
| `LONG_PRESS_DURATION` | `1000` | ms for the emulated force to ramp from 0 to 1 |
| `LONG_PRESS_TOLERANCE` | `10` | px a pointer may move before a pending long press is cancelled |
| `LONG_PRESS_EASING` | `t => t` | shapes the emulated ramp |
| `FALLBACK_TO_LONGPRESS` | `true` | emulate force on devices without pressure |
| `SHIM_WEIRD_BROWSER` | `true` | ignore bogus force values from Chrome and Android |
| `POINTER_TYPES` | `['mouse', 'touch', 'pen']` | which pointers may press |
| `PEEK_THRESHOLD` | `0.3` | force at which `peek` fires |
| `POP_THRESHOLD` | `0.6` | force at which `pop` fires |
| `HAPTICS` | `true` | play a haptic on peek and pop (Android, iOS 18+) |
| `PREVENT_CLICK` | `true` | swallow the click after a press that peeked |
| `DISABLE_NATIVE_GESTURES` | `true` | turn off the iOS callout and link preview, selection, dragging, the Android context menu and macOS Look Up on the element |
| `CSS_VARIABLE` | `'--force'` | CSS custom property that mirrors the force, or `false` |
| `STATE_ATTRIBUTE` | `'data-force-state'` | attribute set to `pressing`, `peek` or `pop` during a press, or `false` |

With the CSS hooks you can often skip JavaScript entirely:

```css
.card { scale: calc(1 + var(--force, 0) * 0.2); }
.card[data-force-state="pop"] { outline: 2px solid; }
```

## API

**Instance:** `on`, `once`, `off`, `destroy()` (removes every listener and restores the element), `force` (the latest value), `element`, `options`.

**Static:**

- `Forcify.config(options)` changes the defaults. The 0.x `{ defaults: {...} }` form still works.
- `Forcify.defaults` is the options object every new instance starts from.
- `Forcify.haptic(style?)` plays a `'light'`, `'medium'` or `'heavy'` haptic where possible and returns whether a mechanism was available.
- `Forcify.detection` is what Forcify has learned about the device:
  - `TOUCH3D`, `OSXFORCE`, `PEN_PRESSURE`, `PEN_HOVER` and `WEIRD_CHROME` flip to `true` at runtime.
  - `POINTER_EVENTS`, `TOUCH_FORCE_EVENT`, `IOS` and `ANDROID` come from feature and user-agent checks.
  - `HAPTICS` is `'vibrate'`, `'switch'` or `false`.
- `Forcify.version` is the library version.

Upgrading from 0.x? See [MIGRATION.md](MIGRATION.md).

## Development

```bash
npm install
npm test          # unit tests (Vitest + happy-dom)
npm run typecheck
npm run build     # dist/forcify.{mjs,cjs,umd.js,min.js} + type declarations
```

## License

MIT © [Hux](https://huxpro.github.io)
