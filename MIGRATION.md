# Migrating from 0.x to 1.0

Most code written for 0.x keeps working unchanged:

```js
new Forcify(element).on('force', (e) => render(e.force))
```

Check each change below against your usage.

## Behaviour changes

- **Browsers.** The build is ES2015, which covers iOS 10+ and Safari 10+. For iOS 9, stay on `forcify@0.2`.
- **Force Touch values.** On a Force Touch trackpad, 0.x reported `webkitForce / 3`, so a plain click was already about 0.33. 1.0 maps click → force click → maximum onto 0 → 0.5 → 1, so a plain click is 0, just as a light touch is 0 everywhere else. Force click also fires `pop`.
- **`LONG_PRESS_DURATION`** now defaults to the documented 1000 ms (the 0.x code used 100 ms). Pass `LONG_PRESS_DURATION: 100` to keep the old speed.
- **Events fire when something changes.** 0.x repeated the same value every 10–20 ms while a press was held. 1.0 emits on each animation frame in which the value changes.
- **No global `preventDefault()`.** 0.x listened on `document` and cancelled every touch and mouse event on Forcify elements. That blocked scrolling and clicks, and triggers passive-listener warnings in modern browsers. 1.0 listens on the element and prevents only what it must. To stop the page from scrolling while pressing, add `touch-action: none` to the element in CSS.
- **Long press cancels on movement.** Moving more than `LONG_PRESS_TOLERANCE` (10 px) before the emulated force begins, or starting a scroll, cancels it.
- **The element is styled.** With the default `DISABLE_NATIVE_GESTURES: true`, Forcify sets `user-select`, `-webkit-user-select`, `-webkit-touch-callout` and `-webkit-user-drag` to `none` on the element. It also writes `--force` and `data-force-state`. Pass `DISABLE_NATIVE_GESTURES: false`, `CSS_VARIABLE: false` or `STATE_ATTRIBUTE: false` to opt out.
- **Clicks after a peek are swallowed** (`PREVENT_CLICK: true`), and **peek and pop play a haptic** where possible (`HAPTICS: true`). Set either option to `false` to turn it off.
- **`Forcify.detection.ANDROID`** is now a boolean. It was a match array or `null`, so truthiness checks still work.

## Removed internals

These were never documented. They are gone:

- `Forcify.cache`, `Forcify.emitEvent`, `Forcify.__EVENT_BOBBLE__`
- `handleTouch`, `handlePress`, `handleMouseForce`, `pollingTouchForce`, `repeatPushForceValue`, `invokeHandlers` on the prototype
- the `forcify.debug.js` build

## New

`once`, `off`, `destroy`, `forcestart`/`peek`/`pop`/`forceend`/`hover` events, the `pen` source, pen tilt and angles, `Forcify.haptic`, `Forcify.version`, a selector in the constructor, TypeScript types and ES module / CommonJS / UMD builds. See the [changelog](CHANGELOG.md).
