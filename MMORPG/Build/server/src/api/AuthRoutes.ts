import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { validateUsername, validateEmail, validatePassword } from '../security/Validator.js';
import { TokenBucketRateLimiter } from '../security/RateLimiter.js';
import { generateId } from '../utils/Helpers.js';

const router = Router();
const loginLimiter = new TokenBucketRateLimiter(5, 1, 1000);

const accounts: Map<string, { id: string; username: string; email: string; passwordHash: string; role: string; banned: boolean; createdAt: number }> = new Map();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const usernameCheck = validateUsername(username || '');
    if (!usernameCheck.valid) { res.status(400).json({ error: usernameCheck.error }); return; }
    const emailCheck = validateEmail(email || '');
    if (!emailCheck.valid) { res.status(400).json({ error: emailCheck.error }); return; }
    const passwordCheck = validatePassword(password || '');
    if (!passwordCheck.valid) { res.status(400).json({ error: passwordCheck.error }); return; }
    for (const acc of accounts.values()) {
      if (acc.username === username) { res.status(409).json({ error: 'Username already taken' }); return; }
      if (acc.email === email) { res.status(409).json({ error: 'Email already registered' }); return; }
    }
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const id = generateId();
    accounts.set(id, { id, username, email, passwordHash, role: 'user', banned: false, createdAt: Date.now() });
    const token = jwt.sign({ userId: id, username, role: 'user' }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as any);
    res.status(201).json({ token, userId: id, username });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || 'unknown';
    if (!loginLimiter.consume(ip, 1)) {
      res.status(429).json({ error: 'Too many login attempts. Try again later.' });
      return;
    }
    if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return; }
    let foundAccount = null;
    for (const acc of accounts.values()) {
      if (acc.username === username) { foundAccount = acc; break; }
    }
    if (!foundAccount) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    if (foundAccount.banned) { res.status(403).json({ error: 'Account is banned' }); return; }
    const validPassword = await bcrypt.compare(password, foundAccount.passwordHash);
    if (!validPassword) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const token = jwt.sign({ userId: foundAccount.id, username: foundAccount.username, role: foundAccount.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as any);
    res.json({ token, userId: foundAccount.id, username: foundAccount.username });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { accounts };
export default router;
