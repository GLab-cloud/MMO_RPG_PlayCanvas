import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';

export class QuestHandler {
  private room: WorldRoom;

  constructor(room: WorldRoom) {
    this.room = room;
  }

  handleAccept(client: Client, data: { questId: string }): void {
    this.room.send(client, 'quest:accepted', { questId: data.questId });
  }

  handleProgress(client: Client, data: { questId: string; objective: string }): void {
    this.room.send(client, 'quest:progress', {
      questId: data.questId,
      objective: data.objective,
    });
  }

  handleComplete(client: Client, data: { questId: string }): void {
    this.room.send(client, 'quest:completed', { questId: data.questId });
  }

  handleTurnIn(client: Client, data: { questId: string; npcId: string }): void {
    this.room.send(client, 'quest:turned_in', {
      questId: data.questId,
      npcId: data.npcId,
    });
  }
}
