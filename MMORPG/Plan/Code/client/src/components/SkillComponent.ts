interface SkillSlot {
  id: string;
  name: string;
  cooldown: number;
  currentCooldown: number;
  level: number;
  manaCost: number;
}

export class SkillComponent {
  skills: SkillSlot[] = [];
  hotbar: (string | null)[] = new Array(10).fill(null);

  addSkill(skill: SkillSlot): void {
    this.skills.push(skill);
  }

  assignToHotbar(skillId: string, slot: number): void {
    if (slot >= 0 && slot < 10) {
      this.hotbar[slot] = skillId;
    }
  }

  useSkill(slot: number): SkillSlot | null {
    const skillId = this.hotbar[slot];
    if (!skillId) return null;
    const skill = this.skills.find((s) => s.id === skillId);
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
