import { generateId } from '../utils/Helpers.js';

interface Mount {
  id: string;
  name: string;
  speed: number;
  altitude: number;
  mounted: boolean;
}

export class MountHandler {
  private mounts: Map<string, Mount> = new Map();

  constructor() {
    this.initializeMounts();
  }

  private initializeMounts(): void {
    const mountDefs = [
      { name: 'White Horse', speed: 15 },
      { name: 'Black Stallion', speed: 18 },
      { name: 'Brown Donkey', speed: 8 },
      { name: 'Griffin', speed: 25, canFly: true },
      { name: 'Dragon Hatchling', speed: 30, canFly: true },
    ];
    for (const def of mountDefs) {
      const mount: Mount = { id: generateId(), ...def, altitude: 0, mounted: false };
      this.mounts.set(mount.id, mount);
    }
  }

  handleMount(playerMountId: string | null, mountId: string): { success: boolean; mount?: Mount; error?: string } {
    if (playerMountId) return { success: false, error: 'Already mounted' };
    const mount = this.mounts.get(mountId);
    if (!mount) return { success: false, error: 'Mount not found' };
    mount.mounted = true;
    return { success: true, mount };
  }

  handleDismount(playerMountId: string | null): { success: boolean; error?: string } {
    if (!playerMountId) return { success: false, error: 'Not mounted' };
    const mount = this.mounts.get(playerMountId);
    if (mount) {
      mount.mounted = false;
      mount.altitude = 0;
    }
    return { success: true };
  }

  handleAltitude(playerMountId: string | null, altitude: number): { success: boolean; mount?: Mount; error?: string } {
    if (!playerMountId) return { success: false, error: 'Not mounted' };
    const mount = this.mounts.get(playerMountId);
    if (!mount) return { success: false, error: 'Mount not found' };
    mount.altitude = Math.max(0, Math.min(50, altitude));
    return { success: true, mount };
  }

  getMount(mountId: string): Mount | undefined {
    return this.mounts.get(mountId);
  }
}
