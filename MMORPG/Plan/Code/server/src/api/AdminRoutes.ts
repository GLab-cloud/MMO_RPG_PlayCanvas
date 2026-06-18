import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppDataSource } from '../database/connection.js';
import { AccountEntity } from '../database/entities/AccountEntity.js';
import { Logger } from '../utils/Logger.js';

interface JwtPayload {
  id: string;
  isAdmin: boolean;
}

export class AdminRoutes {
  static register(app: { use: (path: string, router: Router) => void }): void {
    const router = Router();

    const adminMiddleware = (
      req: { headers: Record<string, string | undefined>; admin?: JwtPayload },
      res: { status: (code: number) => { json: (data: unknown) => void } },
      next: () => void
    ) => {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      try {
        const token = header.slice(7);
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        if (!decoded.isAdmin) {
          return res.status(403).json({ error: 'Admin access required' });
        }
        req.admin = decoded;
        next();
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };

    router.get('/accounts', adminMiddleware, async (_req, res) => {
      try {
        const accounts = await AppDataSource.getRepository(AccountEntity).find({
          select: ['id', 'username', 'email', 'createdAt', 'lastLogin', 'isBanned', 'isAdmin'],
        });
        res.json({ accounts });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.post('/ban/:accountId', adminMiddleware, async (req, res) => {
      try {
        const account = await AppDataSource.getRepository(AccountEntity)
          .findOne({ where: { id: req.params.accountId } });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        account.isBanned = !account.isBanned;
        await AppDataSource.getRepository(AccountEntity).save(account);
        Logger.info(`Account ${account.username} ban status: ${account.isBanned}`);
        res.json({ id: account.id, isBanned: account.isBanned });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.get('/stats', adminMiddleware, async (_req, res) => {
      try {
        const totalAccounts = await AppDataSource.getRepository(AccountEntity).count();
        const bannedAccounts = await AppDataSource.getRepository(AccountEntity).count({ where: { isBanned: true } });
        res.json({ totalAccounts, bannedAccounts });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.use('/api/admin', router);
  }
}
