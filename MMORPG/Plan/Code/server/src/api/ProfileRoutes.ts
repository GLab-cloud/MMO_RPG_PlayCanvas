import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppDataSource } from '../database/connection.js';
import { CharacterEntity } from '../database/entities/CharacterEntity.js';
import { ItemEntity } from '../database/entities/ItemEntity.js';

interface JwtPayload {
  id: string;
  username: string;
}

export class ProfileRoutes {
  static register(app: { use: (path: string, router: Router) => void }): void {
    const router = Router();

    const authMiddleware = (req: { headers: Record<string, string | undefined>; user?: JwtPayload }, res: { status: (code: number) => { json: (data: unknown) => void } }, next: () => void) => {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      try {
        const token = header.slice(7);
        req.user = jwt.verify(token, config.jwtSecret) as JwtPayload;
        next();
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };

    router.get('/characters', authMiddleware, async (req: { user?: JwtPayload }, res) => {
      try {
        const characters = await AppDataSource.getRepository(CharacterEntity)
          .find({ where: { account: { id: req.user!.id } }, select: ['id', 'name', 'class', 'level', 'mapId'] });
        res.json({ characters });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.get('/characters/:id', authMiddleware, async (req: { user?: JwtPayload; params: { id: string } }, res) => {
      try {
        const character = await AppDataSource.getRepository(CharacterEntity)
          .findOne({ where: { id: req.params.id, account: { id: req.user!.id } } });
        if (!character) return res.status(404).json({ error: 'Character not found' });

        const items = await AppDataSource.getRepository(ItemEntity)
          .find({ where: { character: { id: character.id } } });

        res.json({ character, items });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.put('/characters/:id/stats', authMiddleware, async (req: { user?: JwtPayload; params: { id: string }; body: { stat: string } }, res) => {
      try {
        const character = await AppDataSource.getRepository(CharacterEntity)
          .findOne({ where: { id: req.params.id, account: { id: req.user!.id } } });
        if (!character) return res.status(404).json({ error: 'Character not found' });
        if (character.statPoints <= 0) return res.status(400).json({ error: 'No stat points available' });

        const stat = req.body.stat as keyof CharacterEntity;
        if (!['str', 'sta', 'dex', 'int', 'spr'].includes(stat)) {
          return res.status(400).json({ error: 'Invalid stat' });
        }

        (character[stat] as number) += 1;
        character.statPoints -= 1;
        await AppDataSource.getRepository(CharacterEntity).save(character);

        res.json({ character });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.use('/api/profile', router);
  }
}
