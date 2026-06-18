import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';

export class MountHandler {
  private room: WorldRoom;

  constructor(room: WorldRoom) {
    this.room = room;
  }

  handleMount(client: Client, data: { mountId: string }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    player.mount = data.mountId;
    player.flying = true;
    player.altitude = 1;

    this.room.broadcast('mount:mounted', {
      sessionId: client.sessionId,
      mountId: data.mountId,
    });
  }

  handleDismount(client: Client): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    player.mount = '';
    player.flying = false;
    player.altitude = 0;

    this.room.broadcast('mount:dismounted', {
      sessionId: client.sessionId,
    });
  }

  handleAltitudeChange(client: Client, data: { altitude: number }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    player.altitude = Math.max(0, Math.min(2, data.altitude));
  }
}
