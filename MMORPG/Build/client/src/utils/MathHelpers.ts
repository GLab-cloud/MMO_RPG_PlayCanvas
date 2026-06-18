import { Vec3 } from 'playcanvas';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function angleBetween(a: Vec3, b: Vec3): number {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) * Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);
  return Math.acos(Math.max(-1, Math.min(1, dot / mag)));
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function worldToScreen(worldPos: Vec3, viewMatrix: Float32Array, projMatrix: Float32Array, width: number, height: number): { x: number; y: number } | null {
  const clipX = viewMatrix[0] * worldPos.x + viewMatrix[4] * worldPos.y + viewMatrix[8] * worldPos.z + viewMatrix[12];
  const clipY = viewMatrix[1] * worldPos.x + viewMatrix[5] * worldPos.y + viewMatrix[9] * worldPos.z + viewMatrix[13];
  const clipZ = viewMatrix[2] * worldPos.x + viewMatrix[6] * worldPos.y + viewMatrix[10] * worldPos.z + viewMatrix[14];
  const clipW = viewMatrix[3] * worldPos.x + viewMatrix[7] * worldPos.y + viewMatrix[11] * worldPos.z + viewMatrix[15];

  if (clipW < 0.001) return null;

  const ndcX = clipX / clipW;
  const ndcY = clipY / clipW;

  if (Math.abs(ndcX) > 1 || Math.abs(ndcY) > 1) return null;

  return {
    x: (ndcX + 1) * 0.5 * width,
    y: (1 - ndcY) * 0.5 * height,
  };
}

export function smoothDamp(current: number, target: number, velocity: number, smoothTime: number, dt: number, maxSpeed: number = Infinity): number {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const maxChange = maxSpeed * smoothTime;
  const clampedChange = Math.max(-maxChange, Math.min(maxChange, change));
  const temp = (velocity + omega * clampedChange) * dt;
  velocity = (velocity - omega * temp) * exp;
  return target + (clampedChange + temp) * exp;
}
