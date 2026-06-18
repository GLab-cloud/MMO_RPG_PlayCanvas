import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import http from 'http';
import { config } from './config.js';
import { connectDatabase } from './database/connection.js';
import { Logger } from './utils/Logger.js';
import { AuthRoom } from './auth/AuthRoom.js';
import { LobbyRoom } from './rooms/LobbyRoom.js';
import { WorldRoom } from './rooms/WorldRoom.js';
import { ChatRoom } from './rooms/ChatRoom.js';
import { AuthRoutes } from './api/AuthRoutes.js';
import { ProfileRoutes } from './api/ProfileRoutes.js';
import { LeaderboardRoutes } from './api/LeaderboardRoutes.js';
import { AdminRoutes } from './api/AdminRoutes.js';

async function main() {
  await connectDatabase();

  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  AuthRoutes.register(app);
  ProfileRoutes.register(app);
  LeaderboardRoutes.register(app);
  AdminRoutes.register(app);

  const httpServer = http.createServer(app);

  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: httpServer,
      pingInterval: 5000,
      pingMaxRetries: 3,
    }),
    greet: false,
  });

  gameServer.define('auth', AuthRoom);
  gameServer.define('lobby', LobbyRoom);
  gameServer.define('world', WorldRoom).enableRealtimeListing();
  gameServer.define('chat', ChatRoom);

  const port = config.serverPort;
  httpServer.listen(port, () => {
    Logger.info(`Server listening on port ${port}`);
    Logger.info(`Colyseus monitor: http://localhost:${port}/colyseus`);
  });

  if (config.enableMonitor) {
    const monitor = await import('@colyseus/monitor');
    app.use('/colyseus', monitor.monitor());
  }
}

main().catch((err) => {
  Logger.error('Failed to start server:', err);
  process.exit(1);
});
