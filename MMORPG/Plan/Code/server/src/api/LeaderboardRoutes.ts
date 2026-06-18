import { Router } from 'express';
import { AppDataSource } from '../database/connection.js';
import { LeaderboardEntity } from '../database/entities/LeaderboardEntity.js';

export class LeaderboardRoutes {
  static register(app: { use: (path: string, router: Router) => void }): void {
    const router = Router();

    router.get('/:type', async (req, res) => {
      try {
        const type = req.params.type;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        if (!['level', 'pvp', 'wealth', 'fame'].includes(type || '')) {
          return res.status(400).json({ error: 'Invalid leaderboard type' });
        }

        const entries = await AppDataSource.getRepository(LeaderboardEntity)
          .createQueryBuilder('lb')
          .leftJoinAndSelect('lb.character', 'char')
          .where('lb.snapshot_type = :type', { type })
          .orderBy('lb.value', 'DESC')
          .take(limit)
          .getMany();

        const result = entries.map((entry, index) => ({
          rank: index + 1,
          characterId: entry.character.id,
          name: entry.character.name,
          level: entry.character.level,
          className: entry.character.class,
          value: entry.value,
        }));

        res.json({ type, entries: result });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.get('/character/:characterId', async (req, res) => {
      try {
        const { characterId } = req.params;
        const entries = await AppDataSource.getRepository(LeaderboardEntity)
          .find({ where: { character: { id: characterId } } });

        const result: Record<string, { rank: number; value: number }> = {};
        for (const entry of entries) {
          const totalHigher = await AppDataSource.getRepository(LeaderboardEntity)
            .count({ where: { snapshotType: entry.snapshotType, value: MoreThan(entry.value) } });
          result[entry.snapshotType] = { rank: totalHigher + 1, value: entry.value };
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.use('/api/leaderboard', router);
  }
}
