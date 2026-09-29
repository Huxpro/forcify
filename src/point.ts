/**
 *  point.ts
 *
 *  Where a pointer is and how it is held. Pointer Events report pen tilt as
 *  tiltX/tiltY, while iOS Touch objects (and Pointer Events Level 3) report
 *  altitudeAngle/azimuthAngle, so Forcify fills in whichever is missing
 *  using the conversions from the Pointer Events specification.
 */

export interface Point {
  /** Viewport x coordinate, like `MouseEvent.clientX`. */
  x: number
  /** Viewport y coordinate, like `MouseEvent.clientY`. */
  y: number
  /** Pen tilt along the x axis, -90 to 90 degrees. */
  tiltX: number
  /** Pen tilt along the y axis, -90 to 90 degrees. */
  tiltY: number
  /** Pen rotation around its own axis, 0 to 359 degrees. */
  twist: number
  /** Angle between the pen and the screen, 0 (flat) to π/2 (upright), in radians. */
  altitudeAngle: number
  /** Direction the pen points in the plane of the screen, 0 to 2π, in radians. */
  azimuthAngle: number
}

const { PI, abs, atan, atan2, cos, sin, sqrt, tan } = Math
const DEG = 180 / PI

export const UPRIGHT: Omit<Point, 'x' | 'y'> = {
  tiltX: 0,
  tiltY: 0,
  twist: 0,
  altitudeAngle: PI / 2,
  azimuthAngle: 0,
}

export function tiltToSpherical(tiltX: number, tiltY: number): { altitudeAngle: number; azimuthAngle: number } {
  const tx = tiltX / DEG
  const ty = tiltY / DEG
  if (abs(tiltX) === 90 || abs(tiltY) === 90) {
    return { altitudeAngle: 0, azimuthAngle: 0 }
  }
  let azimuthAngle = 0
  if (tiltX === 0) {
    if (tiltY > 0) azimuthAngle = PI / 2
    else if (tiltY < 0) azimuthAngle = (3 * PI) / 2
  } else if (tiltY === 0) {
    if (tiltX < 0) azimuthAngle = PI
  } else {
    azimuthAngle = atan2(tan(ty), tan(tx))
    if (azimuthAngle < 0) azimuthAngle += 2 * PI
  }
  const altitudeAngle =
    tiltX === 0 ? PI / 2 - abs(ty)
    : tiltY === 0 ? PI / 2 - abs(tx)
    : atan(1 / sqrt(tan(tx) ** 2 + tan(ty) ** 2))
  return { altitudeAngle, azimuthAngle }
}

export function sphericalToTilt(altitudeAngle: number, azimuthAngle: number): { tiltX: number; tiltY: number } {
  if (altitudeAngle === 0) {
    // Flat on the screen: snap to the nearest ±90° edge.
    const x = cos(azimuthAngle)
    const y = sin(azimuthAngle)
    return { tiltX: abs(x) < 1e-9 ? 0 : x > 0 ? 90 : -90, tiltY: abs(y) < 1e-9 ? 0 : y > 0 ? 90 : -90 }
  }
  const t = tan(altitudeAngle)
  return { tiltX: atan(cos(azimuthAngle) / t) * DEG, tiltY: atan(sin(azimuthAngle) / t) * DEG }
}

type PointerLike = MouseEvent & Partial<Pick<PointerEvent, 'tiltX' | 'tiltY' | 'twist'>> & {
  altitudeAngle?: number
  azimuthAngle?: number
}

export function fromPointer(e: PointerLike): Point {
  const tiltX = e.tiltX || 0
  const tiltY = e.tiltY || 0
  const spherical =
    typeof e.altitudeAngle === 'number' && typeof e.azimuthAngle === 'number'
      ? { altitudeAngle: e.altitudeAngle, azimuthAngle: e.azimuthAngle }
      : tiltToSpherical(tiltX, tiltY)
  return { x: e.clientX, y: e.clientY, tiltX, tiltY, twist: e.twist || 0, ...spherical }
}

type TouchLike = Pick<Touch, 'clientX' | 'clientY'> & { altitudeAngle?: number; azimuthAngle?: number }

export function fromTouch(t: TouchLike): Point {
  if (typeof t.altitudeAngle !== 'number' || typeof t.azimuthAngle !== 'number') {
    return { x: t.clientX, y: t.clientY, ...UPRIGHT }
  }
  return {
    x: t.clientX,
    y: t.clientY,
    twist: 0,
    altitudeAngle: t.altitudeAngle,
    azimuthAngle: t.azimuthAngle,
    ...sphericalToTilt(t.altitudeAngle, t.azimuthAngle),
  }
}
