import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppDataSource } from '../database/connection.js';
import { AccountEntity } from '../database/entities/AccountEntity.js';
import { Validator } from '../security/Validator.js';
import { RateLimiter } from '../security/RateLimiter.js';
import { Logger } from '../utils/Logger.js';

export class AuthRoutes {
  static register(app: { use: (path: string, router: Router) => void }): void {
    const router = Router();
    const loginLimiter = new RateLimiter({ points: 5, duration: 60, blockDuration: 30000 });

    router.post('/register', async (req, res) => {
      try {
        const { username, email, password } = req.body;

        if (!Validator.isValidUsername(username)) {
          return res.status(400).json({ error: 'Invalid username (3-16 chars, alphanumeric)' });
        }
        if (!Validator.isValidEmail(email)) {
          return res.status(400).json({ error: 'Invalid email' });
        }
        if (!Validator.isValidPassword(password)) {
          return res.status(400).json({ error: 'Password must be 6-64 characters' });
        }

        const existing = await AppDataSource.getRepository(AccountEntity)
          .findOne({ where: [{ username }, { email }] });
        if (existing) {
          return res.status(409).json({ error: 'Username or email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const account = new AccountEntity();
        account.username = username;
        account.email = email;
        account.passwordHash = passwordHash;
        account.lastLogin = new Date();

        await AppDataSource.getRepository(AccountEntity).save(account);
        Logger.info(`Account registered: ${username}`);

        const token = jwt.sign({ id: account.id, username }, config.jwtSecret, { expiresIn: config.jwtExpiry });
        res.status(201).json({ token, account: { id: account.id, username } });
      } catch (error) {
        Logger.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.post('/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const ip = req.ip || 'unknown';

        if (!loginLimiter.consume(ip)) {
          return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
        }

        const account = await AppDataSource.getRepository(AccountEntity)
          .findOne({ where: { username } });
        if (!account) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (account.isBanned) {
          return res.status(403).json({ error: 'Account is banned' });
        }

        const valid = await bcrypt.compare(password, account.passwordHash);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        account.lastLogin = new Date();
        await AppDataSource.getRepository(AccountEntity).save(account);

        const token = jwt.sign(
          { id: account.id, username: account.username, isAdmin: account.isAdmin },
          config.jwtSecret,
          { expiresIn: config.jwtExpiry }
        );

        Logger.info(`Login successful: ${username}`);
        res.json({ token, account: { id: account.id, username: account.username, isAdmin: account.isAdmin } });
      } catch (error) {
        Logger.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.use('/api/auth', router);
  }
}
