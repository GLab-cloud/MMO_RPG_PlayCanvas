import jwt from 'jsonwebtoken';
import { config } from '../config.js';

interface JwtPayload {
  userId: string;
  username: string;
}

export function verifyToken(token: string): { valid: boolean; payload?: JwtPayload; error?: string } {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}
