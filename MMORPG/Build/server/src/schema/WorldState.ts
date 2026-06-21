import { Schema, MapSchema, type } from '@colyseus/schema';

export class PlayerState extends Schema {
  @type('string') id: string = '';
  @type('string') sessionId: string = '';
  @type('string') name: string = '';
  @type('number') level: number = 1;
  @type('number') xp: number = 0;
  @type('string') class: string = 'adventurer';
  @type('number') strength: number = 5;
  @type('number') stamina: number = 5;
  @type('number') dexterity: number = 5;
  @type('number') intelligence: number = 5;
  @type('number') statPoints: number = 0;
  @type('number') hp: number = 100;
  @type('number') maxHp: number = 100;
  @type('number') mp: number = 50;
  @type('number') maxMp: number = 50;
  @type('number') attack: number = 10;
  @type('number') defense: number = 5;
  @type('number') magicAttack: number = 5;
  @type('number') magicDefense: number = 3;
  @type('number') x: number = 0;
  @type('number') z: number = 0;
  @type('number') rotation: number = 0;
  @type('number') speed: number = 5;
  @type('number') gold: number = 100;
  @type('boolean') mounted: boolean = false;
  @type('string') mountId: string = '';
  @type('string') partyId: string = '';
  @type('string') guildId: string = '';
  @type('boolean') connected: boolean = true;
  @type('number') kills: number = 0;
  @type('number') deaths: number = 0;
}

export class MonsterState extends Schema {
  @type('string') id: string = '';
  @type('string') templateId: string = '';
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') z: number = 0;
  @type('number') hp: number = 50;
  @type('number') maxHp: number = 50;
  @type('number') level: number = 1;
  @type('number') attack: number = 5;
  @type('number') defense: number = 2;
  @type('number') magicAttack: number = 0;
  @type('number') magicDefense: number = 1;
  @type('number') speed: number = 2;
  @type('number') aggroRange: number = 8;
  @type('number') attackRange: number = 1.5;
  @type('number') xpReward: number = 15;
  @type('string') state: string = 'idle';
  @type('string') targetId: string = '';
}

export class WorldState extends Schema {
  @type({ map: PlayerState }) players: MapSchema<PlayerState> = new MapSchema();
  @type({ map: MonsterState }) monsters: MapSchema<MonsterState> = new MapSchema();
  @type('number') timeOfDay: number = 0;
  @type('string') weather: string = 'clear';
}
