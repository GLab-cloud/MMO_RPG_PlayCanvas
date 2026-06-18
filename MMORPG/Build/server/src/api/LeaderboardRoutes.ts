import { Router, Request, Response } from 'express';
import { characters } from './ProfileRoutes.js';

const router = Router();

router.get('/:type', (req: Request, res: Response) => {
  const type = req.params['type'] || 'level';
  let sorted: any[] = [];
  const allChars = Array.from(characters.values());
  switch (type) {
    case 'level':
      sorted = allChars.sort((a, b) => b.level - a.level || b.xp - a.xp);
      break;
    case 'pvp':
      sorted = allChars.sort((a, b) => (b as any).pvpKills || 0 - (a as any).pvpKills || 0);
      break;
    case 'wealth':
      sorted = allChars.sort((a, b) => b.gold - a.gold);
      break;
    case 'fame':
      sorted = allChars.sort((a, b) => (b as any).fame || 0 - (a as any).fame || 0);
      break;
    default:
      res.status(400).json({ error: 'Invalid leaderboard type' });
      return;
  }
  const top50 = sorted.slice(0, 50).map((c, i) => ({
    rank: i + 1,
    name: c.name,
    level: c.level,
    class: c.class,
    value: type === 'level' ? c.level : type === 'wealth' ? c.gold : 0,
  }));
  res.json(top50);
});

export default router;
