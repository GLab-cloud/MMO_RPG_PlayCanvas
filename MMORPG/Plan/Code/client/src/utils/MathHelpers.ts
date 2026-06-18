export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

export function angleBetween(x1: number, z1: number, x2: number, z2: number): number {
  return Math.atan2(x2 - x1, z2 - z1);
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function worldToScreen(
  worldPos: pc.Vec3,
  camera: pc.Entity,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } | null {
  const device = camera.camera;
  if (!device) return null;
  const screenPos = device.worldToScreen(worldPos);
  return { x: screenPos.x, y: screenPos.y };
}

export function smoothDamp(
  current: number,
  target: number,
  currentVelocity: { value: number },
  smoothTime: number,
  maxSpeed: number,
  dt: number
): number {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const maxChange = maxSpeed * smoothTime;
  const clampedChange = clamp(change, -maxChange, maxChange);
  const tempTarget = current - clampedChange;
  const temp = (currentVelocity.value + omega * clampedChange) * dt;
  currentVelocity.value = (currentVelocity.value - omega * temp) * exp;
  return tempTarget + (clampedChange + temp) * exp;
}
