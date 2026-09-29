# Changelog

## 1.0.0

Forcify was rewritten for the hardware that exists ten years after 3D Touch: pens, Force Touch trackpads, Haptic Touch iPhones and the handful of 3D Touch iPhones still in use. See [MIGRATION.md](MIGRATION.md) for breaking changes.

### Added

- **Pen pressure**: Apple Pencil, Surface Pen, S Pen and Wacom tablets, read from Pointer Events as the new `pen` source. Apple Pencil on iPadOS without Pointer Events is read from `Touch.force`.
- **Pen geometry**: every event carries `x`, `y`, `tiltX`, `tiltY`, `twist`, `altitudeAngle` and `azimuthAngle`.
- **`hover` event** for Apple Pencil hover (iPadOS 16.1+) and pen tablets.
- **Peek & Pop**: `forcestart`, `peek`, `pop` and `forceend` events, with the `PEEK_THRESHOLD` and `POP_THRESHOLD` options. A macOS force click pops.
- **Haptics**: `Forcify.haptic()` and the `HAPTICS` option. They use `navigator.vibrate` on Android and the switch-control haptic on iOS 18+.
- **CSS hooks**: the `--force` custom property and the `data-force-state` attribute.
- Options: `LONG_PRESS_TOLERANCE`, `LONG_PRESS_EASING`, `POINTER_TYPES`, `PREVENT_CLICK`, `DISABLE_NATIVE_GESTURES`, `CSS_VARIABLE`, `STATE_ATTRIBUTE`.
- Instance: `once()`, `off()`, `destroy()`, `force`. The constructor accepts a CSS selector.
- Static: `Forcify.version`, `Forcify.haptic()`. New detection flags: `POINTER_EVENTS`, `TOUCH_FORCE_EVENT`, `PEN_PRESSURE`, `PEN_HOVER`, `IOS`, `HAPTICS`.
- `touchforcechange` support (iOS 10+).
- TypeScript types; ES module, CommonJS and UMD builds; a `package.json` `exports` map.

### Fixed

- Event bubbling relied on `Event.path`, which Chrome removed.
- Document-level `preventDefault()` blocked scrolling and clicks and triggered passive-listener warnings.
- A Mac switching between a Force Touch trackpad and a regular mouse lost the long-press fallback.
- `Forcify.config({ OPTION })` did nothing: only `{ defaults: { OPTION } }` worked, contrary to the README.
- The default `LONG_PRESS_DURATION` was 100 ms rather than the documented 1000 ms.
- `console.log` calls shipped in the minified build.

### Changed

- Force Touch values are normalized from click (0) to maximum (1).
- The long press uses Pointer Events and `requestAnimationFrame`, and cancels on movement or scroll.
- Rebuilt with TypeScript, esbuild and Vitest, with CI replacing Babel 5 and webpack 1.

## 0.2.4 and earlier

See the [git history](https://github.com/Huxpro/forcify/commits/master).
