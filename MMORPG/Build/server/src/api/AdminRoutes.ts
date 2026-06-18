import { Router, Response } from 'express';
import { adminAuthMiddleware, AuthRequest } from '../middleware/auth.js';
import { accounts } from './AuthRoutes.js';
import { characters } from './ProfileRoutes.js';

const router = Router();

router.get('/accounts', adminAuthMiddleware, (_req: AuthRequest, res: Response) => {
  const accs = Array.from(accounts.values()).map(a => ({
    id: a.id,
    username: a.username,
    email: a.email,
    role: a.role,
    banned: a.banned,
    createdAt: a.createdAt,
  }));
  res.json(accs);
});

router.post('/ban/:id', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  const acc = accounts.get(req.params['id'] || '');
  if (!acc) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }
  acc.banned = true;
  res.json({ success: true, username: acc.username, banned: true });
});

router.get('/stats', adminAuthMiddleware, (_req: AuthRequest, res: Response) => {
  res.json({
    totalAccounts: accounts.size,
    totalCharacters: characters.size,
    onlinePlayers: 0,
    uptime: process.uptime(),
  });
});

export default router;
