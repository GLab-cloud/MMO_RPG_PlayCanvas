import 'reflect-metadata';
import http from 'http';
import express from 'express';
import cors from 'cors';
import colyseus from 'colyseus';
const { Server } = colyseus;
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

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Handle preflight requests
app.options('*', cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/colyseus', monitor());

const server = http.createServer(app);

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

// Error handling
server.on('error', (err: Error) => {
  console.error('[Server Error]', err);
});
