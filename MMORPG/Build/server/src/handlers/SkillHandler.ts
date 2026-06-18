import { generateId } from '../utils/Helpers.js';

interface Skill {
  id: string;
  name: string;
  cooldown: number;
  lastUsed: number;
  manaCost: number;
  multiplier: number;
}

export class SkillHandler {
  private skills: Map<string, Skill> = new Map();

  constructor() {
    this.initializeSkills();
  }

  private initializeSkills(): void {
    const skillDefs = [
      { name: 'slash', cooldown: 1, manaCost: 5, multiplier: 1.2 },
      { name: 'power_strike', cooldown: 3, manaCost: 15, multiplier: 2.0 },
      { name: 'whirlwind', cooldown: 8, manaCost: 30, multiplier: 1.5 },
      { name: 'heal', cooldown: 5, manaCost: 20, multiplier: 1.0 },
      { name: 'fireball', cooldown: 4, manaCost: 25, multiplier: 2.5 },
      { name: 'ice_shard', cooldown: 6, manaCost: 20, multiplier: 2.0 },
    ];
    for (const def of skillDefs) {
      const skill: Skill = { id: generateId(), ...def, lastUsed: 0 };
      this.skills.set(skill.id, skill);
    }
  }

  useSkill(player: { id: string; mp: number }, skillId: string): { success: boolean; remainingCooldown?: number; skill?: Skill; error?: string } {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return { success: false, error: 'Skill not found' };
    }
    const now = Date.now();
    const elapsed = (now - skill.lastUsed) / 1000;
    if (elapsed < skill.cooldown) {
      return { success: false, remainingCooldown: Math.ceil(skill.cooldown - elapsed), error: 'Skill on cooldown' };
    }
    if (player.mp < skill.manaCost) {
      return { success: false, error: 'Not enough MP' };
    }
    player.mp -= skill.manaCost;
    skill.lastUsed = now;
    return { success: true, skill };
  }

  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }
}
