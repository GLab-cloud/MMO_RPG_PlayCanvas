export interface AABB {
  xmin: number; xmax: number;
  zmin: number; zmax: number;
}

export interface CircleZone {
  x: number; z: number; radius: number;
}

export interface SceneCollisionData {
  buildings: AABB[];
  pillars: CircleZone[];
  npcs: CircleZone[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

const FLARINE_BUILDINGS: AABB[] = [
  { xmin: 16, xmax: 24, zmin: 12, zmax: 18 },
  { xmin: -18, xmax: -12, zmin: 17.5, zmax: 22.5 },
  { xmin: 6.5, xmax: 13.5, zmin: -21, zmax: -15 },
  { xmin: 22, xmax: 28, zmin: -12.5, zmax: -7.5 },
  { xmin: -25, xmax: -19, zmin: -14.5, zmax: -9.5 },
  { xmin: 27.5, xmax: 32.5, zmin: 5.5, zmax: 10.5 },
  { xmin: -30.5, xmax: -25.5, zmin: 7.5, zmax: 12.5 },
  { xmin: 1.5, xmax: 8.5, zmin: 19, zmax: 25 },
  { xmin: 15.5, xmax: 20.5, zmin: -24.5, zmax: -19.5 },
  { xmin: -33, xmax: -27, zmin: -18, zmax: -12 },
];

const FLARINE_PILLARS: CircleZone[] = [
  [-12, -10], [12, -10], [-12, 10], [12, 10],
  [0, -20], [0, 20], [25, 2], [-22, -2],
  [20, -18], [-15, 22],
].map(([x, z]) => ({ x, z, radius: 0.4 }));

const FLARINE_NPCS: CircleZone[] = [
  [25, -6], [-22, -8], [30, 12], [-28, 14],
  [5, 26], [18, -18], [-5, -25], [35, -5], [-30, -11],
].map(([x, z]) => ({ x, z, radius: 0.35 }));

const SAINTMORNING_NPCS: CircleZone[] = [
  [-175, -180],
].map(([x, z]) => ({ x, z, radius: 0.35 }));

const SAINTMORNING_BUILDINGS: AABB[] = [
  { xmin: -186, xmax: -174, zmin: -181.5, zmax: -178.5 },
  { xmin: 76, xmax: 84, zmin: -103, zmax: -97 },
  { xmin: -53.5, xmax: -46.5, zmin: 117.5, zmax: 122.5 },
];

export const SCENE_COLLISION: Record<string, SceneCollisionData> = {
  Flarine: {
    buildings: FLARINE_BUILDINGS,
    pillars: FLARINE_PILLARS,
    npcs: FLARINE_NPCS,
    bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
  },
  SaintMorning: {
    buildings: SAINTMORNING_BUILDINGS,
    pillars: [],
    npcs: SAINTMORNING_NPCS,
    bounds: { minX: -200, maxX: 200, minZ: -200, maxZ: 200 },
  },
};

const PLAYER_RADIUS = 0.5;

export function collidesWithWorld(x: number, z: number, sceneName: string): boolean {
  const data = SCENE_COLLISION[sceneName];
  if (!data) return false;

  const { bounds, buildings, pillars, npcs } = data;

  if (x - PLAYER_RADIUS < bounds.minX || x + PLAYER_RADIUS > bounds.maxX ||
      z - PLAYER_RADIUS < bounds.minZ || z + PLAYER_RADIUS > bounds.maxZ) {
    return true;
  }

  for (const b of buildings) {
    if (x + PLAYER_RADIUS > b.xmin && x - PLAYER_RADIUS < b.xmax &&
        z + PLAYER_RADIUS > b.zmin && z - PLAYER_RADIUS < b.zmax) {
      return true;
    }
  }

  for (const p of pillars) {
    const dx = x - p.x;
    const dz = z - p.z;
    if (dx * dx + dz * dz < (PLAYER_RADIUS + p.radius) * (PLAYER_RADIUS + p.radius)) {
      return true;
    }
  }

  for (const n of npcs) {
    const dx = x - n.x;
    const dz = z - n.z;
    if (dx * dx + dz * dz < (PLAYER_RADIUS + n.radius) * (PLAYER_RADIUS + n.radius)) {
      return true;
    }
  }

  return false;
}
