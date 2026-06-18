import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';
import { DamageSystem } from '../systems/DamageSystem.js';
import { SkillHandler } from './SkillHandler.js';
import { Logger } from '../utils/Logger.js';

export class CombatHandler {
  private room: WorldRoom;
  private damageSystem: DamageSystem;
  private skillHandler: SkillHandler;

  constructor(room: WorldRoom) {
    this.room = room;
    this.damageSystem = new DamageSystem();
    this.skillHandler = new SkillHandler(room);
  }

  handle(client: Client, data: {
    type: 'attack' | 'skill';
    skillId?: string;
    targetId?: string;
    x?: number;
    y?: number;
    z?: number;
  }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    if (data.type === 'attack') {
      this.handleAttack(client, player, data);
    } else if (data.type === 'skill' && data.skillId) {
      this.skillHandler.handle(client, data);
    }
  }

  private handleAttack(
    client: Client,
    player: unknown,
    data: { targetId?: string }
  ): void {
    if (!data.targetId) return;

    const targetMonster = this.room.state.monsters.get(data.targetId);
    if (!targetMonster) return;

    const distance = Math.sqrt(
      Math.pow(player.x - targetMonster.x, 2) +
      Math.pow(player.y - targetMonster.y, 2) +
      Math.pow(player.z - targetMonster.z, 2)
    );

    if (distance > 10) return;

    const damage = this.damageSystem.calculatePhysical(
      100,
      targetMonster.hp,
      player.level,
      1.0
    );

    targetMonster.hp -= damage;

    this.room.broadcast('combat:damage', {
      sourceId: client.sessionId,
      targetId: data.targetId,
      damage,
      type: 'physical',
    });

    if (targetMonster.hp <= 0) {
      this.handleMonsterDeath(client, data.targetId, player);
    }
  }

  private handleMonsterDeath(
    client: Client,
    monsterId: string,
    player: { name: string; level: number }
  ): void {
    this.room.state.monsters.delete(monsterId);
    this.room.broadcast('combat:death', {
      monsterId,
      killerId: client.sessionId,
      killerName: player.name,
    });
  }

  update(dt: number): void {
  }
}
