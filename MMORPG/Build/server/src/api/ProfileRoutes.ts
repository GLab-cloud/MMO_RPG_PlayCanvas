import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { generateId } from '../utils/Helpers.js';

const router = Router();

interface Character {
  id: string;
  userId: string;
  name: string;
  level: number;
  xp: number;
  class: string;
  strength: number;
  stamina: number;
  dexterity: number;
  intelligence: number;
  statPoints: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  x: number;
  z: number;
  rotation: number;
  createdAt: number;
}

const characters: Map<string, Character> = new Map();

router.get('/characters', authMiddleware, (req: AuthRequest, res: Response) => {
  const userChars = Array.from(characters.values()).filter(c => c.userId === req.userId);
  res.json(userChars);
});

router.get('/characters/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const char = characters.get(req.params['id'] || '');
  if (!char || char.userId !== req.userId) {
    res.status(404).json({ error: 'Character not found' });
    return;
  }
  res.json(char);
});

router.put('/characters/:id/stats', authMiddleware, (req: AuthRequest, res: Response) => {
  const char = characters.get(req.params['id'] || '');
  if (!char || char.userId !== req.userId) {
    res.status(404).json({ error: 'Character not found' });
    return;
  }
  const { stat, amount = 1 } = req.body;
  if (char.statPoints < amount) {
    res.status(400).json({ error: 'Not enough stat points' });
    return;
  }
  const validStats = ['strength', 'stamina', 'dexterity', 'intelligence'];
  if (!validStats.includes(stat)) {
    res.status(400).json({ error: 'Invalid stat' });
    return;
  }
  char.statPoints -= amount;
  (char as any)[stat] += amount;
  res.json(char);
});

export { characters };
export default router;
