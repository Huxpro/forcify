# Compatibility

Forcify turns every kind of pressure hardware into a single `force` value from 0 to 1. When a device has no pressure hardware, it emulates force with a long press. This page lists what each platform offers and what Forcify does with it.

## Support matrix

| Platform | Hardware | What the browser reports | Forcify source |
| --- | --- | --- | --- |
| iPhone 6s – XS (iOS 9–18) | 3D Touch | `Touch.force` 0–1, `touchforcechange` (iOS 10+) | `touch3d` |
| iPhone XR, 11 and later | Haptic Touch (no pressure) | `Touch.force` 0 | `longpress` + haptics (iOS 18+) |
| iPad + Apple Pencil (iPadOS 13+) | Pencil pressure and tilt | Pointer Events `pressure`, `tiltX/Y`, `altitudeAngle`, `azimuthAngle` | `pen` |
| iPad + Apple Pencil (iOS 9.1–12) | Pencil pressure and tilt | `Touch.force`, `touchType: 'stylus'`, `altitudeAngle`, `azimuthAngle` (iOS 10+) | `pen` |
| iPad with Pencil hover (iPadOS 16.1+) | Pencil hovering above the screen | pen `pointermove` with no buttons pressed, where Safari forwards it | `hover` event |
| iPad with trackpad or mouse (iPadOS 13.4+) | Pointer | Pointer Events, `pointerType: 'mouse'` | `longpress` |
| Mac with Force Touch trackpad (Safari 9+) | Force Touch | `webkitmouseforce*` events, `MouseEvent.webkitForce` 0–3 | `forcetouch` |
| Mac with a regular mouse | — | `webkitForce` 0 | `longpress` |
| Windows / ChromeOS / Linux + pen (Surface Pen, Wacom…) | Pen pressure and tilt | Pointer Events `pressure`, `tiltX/Y`, `twist` | `pen` |
| Android + S Pen or other stylus | Pen pressure | Pointer Events `pressure` | `pen` |
| Android touch | Contact area, not pressure | `Touch.force` varies with finger size | ignored → `longpress` + vibration |
| Desktop Chrome, Firefox, Edge | Mouse | Pointer Events | `longpress` |

The shipped build is ES2015. It runs on iOS 10+, Safari 10+, Chrome 51+, Firefox 54+ and Edge 79+. For iOS 9 Safari, use `forcify@0.2`.

## Across iOS generations

Forcify was released in 2015, alongside the iPhone 6s and iOS 9. Here is what changed on Apple platforms since then and how Forcify responds to each change.

| Year | Release | What changed | What Forcify does |
| --- | --- | --- | --- |
| 2015 | iOS 9, iPhone 6s | 3D Touch arrives. Safari exposes `Touch.force` but fires no event when only the force changes. | Detects 3D Touch at runtime, since a light touch reports 0 on every iPhone. Polls the live `Touch` object every animation frame. |
| 2015 | OS X El Capitan, Safari 9 | Force Touch trackpads get `webkitmouseforcewillbegin`, `webkitmouseforcechanged`, `webkitmouseforcedown` and `MouseEvent.webkitForce`. | Maps webkitForce 1 (click) – 3 (max) onto 0–1. `webkitmouseforcedown` fires `pop`. Prevents Look Up on the element. |
| 2015 | iOS 9.1, iPad Pro + Apple Pencil | Pencil pressure reaches `Touch.force`. | Reads stylus touches as the `pen` source rather than as 3D Touch. |
| 2016 | iOS 10 | `touchforcechange` event; `Touch.touchType`, `altitudeAngle`, `azimuthAngle`. | Samples force as each `touchforcechange` fires. Tells stylus from finger. Reports pen angles and derives `tiltX/Y` from them. |
| 2018 | iOS 12, iPhone XR | First new iPhone without 3D Touch: Haptic Touch is a long press plus a haptic. | The long-press fallback reaches `peek` at 500 ms by default, matching Haptic Touch timing. |
| 2019 | iOS 13 / iPadOS 13, iPhone 11 | 3D Touch disappears from new iPhones, and Peek & Pop gives way to context menus. Safari 13 ships Pointer Events. iPadOS asks for desktop sites with a Mac user agent. | Uses Pointer Events for every press, and pen `pressure` becomes the `pen` source. `detection.IOS` recognizes iPadOS by a Mac user agent with touch points. `DISABLE_NATIVE_GESTURES` suppresses the callout, link preview, selection and drag. |
| 2020 | iPadOS 13.4 | Trackpad and mouse support on iPad. | These presses are `pointerType: 'mouse'` and use the long-press fallback. |
| 2022 | iPadOS 16.1, M2 iPad Pro | Apple Pencil hover. | New `hover` event with position and pen angles. `detection.PEN_HOVER` flips once hover is seen. |
| 2024 | iOS 17.4 | `<input type="checkbox" switch>`. | — |
| 2024 | iOS 18 | Toggling a switch plays a system haptic, the first haptic reachable from a web page on iPhone. | `Forcify.haptic()` and the `HAPTICS` option use it, so peek and pop can be felt again, like 3D Touch's Taptic Engine. |
| 2024 | iPadOS 17.5, Apple Pencil Pro | Squeeze and barrel roll. | Barrel roll passes through as `twist` where the browser reports it. Squeeze is not exposed to the web. |
| 2025 | iOS 26 | Drops iPhone XS, XS Max and XR, so no iPhone that runs iOS 26 has 3D Touch. | On current iPhones, the long-press fallback plus haptics is the way to press. Pencil pressure remains the real-pressure path on iPad. |

All of this is feature-detected or detected at runtime, never switched on by version number. The one exception is the iOS 18 switch haptic, which has no feature test: Forcify enables it when the browser reflects the `switch` property or when iOS reports version 18 or later. The same build therefore behaves correctly on an iPhone 6s running iOS 15, an iPhone XS running iOS 18 and an iPhone 17 running iOS 26.

## Caveats

- **3D Touch cannot be feature-detected.** Every iPhone reports `force: 0` for a light touch. `detection.TOUCH3D` flips to `true` at the first sample strictly between 0 and 1. The first press on a 3D Touch iPhone can therefore start as an emulated long press and switch to real force mid-press.
- **Pen pressure 0.5.** Pointer Events report 0.5 for pens without pressure hardware, so Forcify only trusts a pen after it reports any other value (`detection.PEN_PRESSURE`).
- **Haptics are best-effort.** Browsers can ignore `navigator.vibrate()` before the user has interacted with the page, and neither mechanism reports whether anything was felt. iOS has a single haptic, so `'heavy'` plays it twice.
- **Android `Touch.force`** reports contact area rather than pressure on many devices, so `SHIM_WEIRD_BROWSER` ignores it. Set `SHIM_WEIRD_BROWSER: false` to use it anyway.

## The 2015 snapshot

These tables are from Forcify's original README. They show why a library was needed in the first place.

Desktop:

Browser | support |`force` | `webkitForce` | `events`
------- | ------- | ------ | ------------- | --------
OSX Safari | Force Touch | null  | 0 ~ 3 by Force | webkitmouseforce
OSX Safari | null        | null  | 0              | mouse
Chrome     | null        | null  | null           | mouse
Chrome Touchable-PC | null | 0   | null           | touch

Mobile:

Browser | support |`force` | `webkitForce` | `events`
------- | ------- | ------ | ------------- | --------
iPhone Safari        | 3D Touch | 0 ~ 1 by Force       | null | touch
iPhone Safari        | null | 0                        | null | touch
Chrome Mobile        | null | 1                        | 1    | touch
Chrome Mobile Nexus5 | null | **0 ~ 1 by touch area!** | same | touch
Chrome Emulator      | null | 1                        | null | touch
Android Browser      | null | null                     | null | touch
