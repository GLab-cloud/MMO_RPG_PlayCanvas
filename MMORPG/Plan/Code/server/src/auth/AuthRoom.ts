import { Room, Client } from 'colyseus';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { Logger } from '../utils/Logger.js';

interface JwtPayload {
  id: string;
  username: string;
}

export class AuthRoom extends Room {
  onCreate(): void {
    this.onMessage('authenticate', (client: Client, data: { token: string }) => {
      try {
        const decoded = jwt.verify(data.token, config.jwtSecret) as JwtPayload;
        client.userData = { id: decoded.id, username: decoded.username };
        this.send(client, 'authenticated', { id: decoded.id, username: decoded.username });
        Logger.info(`Client authenticated: ${decoded.username}`);
      } catch {
        this.send(client, 'auth_error', { message: 'Invalid token' });
        client.leave();
      }
    });
  }

  onJoin(client: Client): void {
    Logger.info(`Auth connection: ${client.sessionId}`);
  }

  onLeave(client: Client): void {
    Logger.info(`Auth disconnect: ${client.sessionId}`);
  }
}
