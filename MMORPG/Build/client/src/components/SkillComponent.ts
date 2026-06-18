interface Skill {
  id: number;
  name: string;
  level: number;
  cooldown: number;
  currentCooldown: number;
  manaCost: number;
}

export class SkillComponent {
  skills: Skill[] = [];
  hotbar: (number | null)[] = new Array(10).fill(null);

  addSkill(skill: Skill): void {
    const existing = this.skills.find(s => s.id === skill.id);
    if (existing) {
      existing.level = skill.level;
    } else {
      this.skills.push(skill);
    }
  }

  assignToHotbar(skillId: number, slot: number): void {
    if (slot >= 0 && slot < 10) {
      this.hotbar[slot] = skillId;
    }
  }

  useSkill(slot: number): Skill | null {
    if (slot < 0 || slot >= 10) return null;
    const skillId = this.hotbar[slot];
    if (skillId === null) return null;
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill || skill.currentCooldown > 0) return null;
    skill.currentCooldown = skill.cooldown;
    return skill;
  }

  tick(dt: number): void {
    for (const skill of this.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown = Math.max(0, skill.currentCooldown - dt);
      }
    }
  }
}
