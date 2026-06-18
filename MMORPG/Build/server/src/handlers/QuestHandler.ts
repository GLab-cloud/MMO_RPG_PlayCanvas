import { generateId } from '../utils/Helpers.js';

interface QuestObjective {
  type: 'kill' | 'collect' | 'talk' | 'explore';
  targetId: string;
  current: number;
  required: number;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards: { xp: number; gold: number; items: { name: string; quantity: number }[] };
  completed: boolean;
}

interface ActiveQuest extends Quest {
  acceptedAt: number;
}

export class QuestHandler {
  private questDefinitions: Map<string, Quest> = new Map();
  private playerQuests: Map<string, ActiveQuest[]> = new Map();

  constructor() {
    this.initializeQuests();
  }

  private initializeQuests(): void {
    const quests: Quest[] = [
      { id: 'q_rat_problem', name: 'Rat Problem', description: 'Kill 5 rats outside town', objectives: [{ type: 'kill', targetId: 'rat', current: 0, required: 5 }], rewards: { xp: 100, gold: 50, items: [] }, completed: false },
      { id: 'q_wolf_hunt', name: 'Wolf Hunt', description: 'Kill 3 wolves in the forest', objectives: [{ type: 'kill', targetId: 'wolf', current: 0, required: 3 }], rewards: { xp: 250, gold: 100, items: [{ name: 'Wolf Pelt', quantity: 1 }] }, completed: false },
      { id: 'q_goblin_raid', name: 'Goblin Raid', description: 'Kill 10 goblins and collect 5 goblin ears', objectives: [{ type: 'kill', targetId: 'goblin', current: 0, required: 10 }, { type: 'collect', targetId: 'goblin_ear', current: 0, required: 5 }], rewards: { xp: 500, gold: 200, items: [{ name: 'Goblin Slayer Sword', quantity: 1 }] }, completed: false },
    ];
    for (const quest of quests) {
      this.questDefinitions.set(quest.id, quest);
    }
  }

  handleAccept(playerId: string, questId: string): { success: boolean; quest?: ActiveQuest; error?: string } {
    const def = this.questDefinitions.get(questId);
    if (!def) return { success: false, error: 'Quest not found' };
    const active = this.playerQuests.get(playerId) || [];
    if (active.find(q => q.id === questId)) return { success: false, error: 'Quest already accepted' };
    if (active.length >= 20) return { success: false, error: 'Quest log full' };
    const activeQuest: ActiveQuest = { ...def, acceptedAt: Date.now() };
    active.push(activeQuest);
    this.playerQuests.set(playerId, active);
    return { success: true, quest: activeQuest };
  }

  handleProgress(playerId: string, questId: string, objectiveType: string, targetId: string, amount: number = 1): { success: boolean; updated?: ActiveQuest; error?: string } {
    const active = this.playerQuests.get(playerId);
    if (!active) return { success: false, error: 'No active quests' };
    const quest = active.find(q => q.id === questId);
    if (!quest) return { success: false, error: 'Quest not accepted' };
    const obj = quest.objectives.find(o => o.type === objectiveType && o.targetId === targetId);
    if (!obj) return { success: false, error: 'Objective not found' };
    obj.current = Math.min(obj.required, obj.current + amount);
    if (quest.objectives.every(o => o.current >= o.required)) {
      quest.completed = true;
    }
    return { success: true, updated: quest };
  }

  handleComplete(playerId: string, questId: string): { success: boolean; rewards?: { xp: number; gold: number; items: { name: string; quantity: number }[] }; error?: string } {
    const active = this.playerQuests.get(playerId);
    if (!active) return { success: false, error: 'No active quests' };
    const idx = active.findIndex(q => q.id === questId);
    if (idx < 0) return { success: false, error: 'Quest not accepted' };
    const quest = active[idx]!;
    if (!quest.completed) return { success: false, error: 'Quest not completed' };
    active.splice(idx, 1);
    this.playerQuests.set(playerId, active);
    return { success: true, rewards: quest.rewards };
  }

  handleTurnIn(playerId: string, questId: string): ReturnType<QuestHandler['handleComplete']> {
    return this.handleComplete(playerId, questId);
  }
}
