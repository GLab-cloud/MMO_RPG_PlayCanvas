import 'reflect-metadata';
import http from 'http';
import express from 'express';
import cors from 'cors';
import colyseus from 'colyseus';
const { Server, matchMaker } = colyseus;
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';
import { config } from './config.js';
import { logger } from './utils/Logger.js';
import { LobbyRoom } from './rooms/LobbyRoom.js';
import { WorldRoom } from './rooms/WorldRoom.js';
import { ChatRoom } from './rooms/ChatRoom.js';
import authRoutes from './api/AuthRoutes.js';
import profileRoutes from './api/ProfileRoutes.js';
import leaderboardRoutes from './api/LeaderboardRoutes.js';
import adminRoutes from './api/AdminRoutes.js';

// ---- Global error handlers (catch-all to prevent silent crashes) ----
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error(`UNHANDLED REJECTION: ${reason}`);
});

// ---- Express setup ----
const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.options('*', cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Suppress favicon 404
app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/colyseus', monitor());

const server = http.createServer(app);

// Override Colyseus matchmaker CORS to always reflect the specific origin.
// Required because colyseus.js sends requests with credentials (withCredentials: true),
// so the browser rejects 'Access-Control-Allow-Origin: *'. When running behind
// a proxy (e.g. CodeSandbox), the Origin header may be present but we also
// fall back to the Host header to construct the origin.
// Vary: Origin is required for proper caching behavior.
matchMaker.controller.getCorsHeaders = function(req: any) {
  const origin = req.headers['origin'];
  if (origin) {
    return { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' };
  }
  const host = req.headers['host'];
  if (host) {
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    return { 'Access-Control-Allow-Origin': `${protocol}://${host}`, 'Vary': 'Origin' };
  }
  return { 'Access-Control-Allow-Origin': '*', 'Vary': 'Origin' };
};

const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
  }),
});

gameServer.define('lobby', LobbyRoom);
gameServer.define('world', WorldRoom).filterBy(['matchId']);
gameServer.define('chat', ChatRoom);

server.listen(config.port, () => {
  logger.info(`FlyFF server started on port ${config.port}`);
  logger.info(`WebSocket: ws://localhost:${config.port}`);
  logger.info(`Monitor: http://localhost:${config.port}/colyseus`);
});

// ---- Internal server errors ----
server.on('error', (err: Error) => {
  logger.error(`Server error: ${err.message}`, { stack: err.stack });
});

// ---- Graceful shutdown ----
const shutdown = (signal: string) => {
  logger.info(`${signal} received – shutting down gracefully...`);
  gameServer.gracefullyShutdown(true).catch(() => {}).finally(() => {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
