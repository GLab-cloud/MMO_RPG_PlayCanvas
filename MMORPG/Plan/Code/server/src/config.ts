import { Logger } from './utils/Logger.js';

interface ServerConfig {
  serverPort: number;
  corsOrigin: string;
  jwtSecret: string;
  jwtExpiry: string;
  databaseUrl: string;
  redisUrl: string;
  enableMonitor: boolean;
  logLevel: string;
  tickRate: number;
  maxPlayersPerRoom: number;
  worldPersistInterval: number;
}

function loadConfig(): ServerConfig {
  return {
    serverPort: parseInt(process.env.SERVER_PORT || '2567', 10),
    corsOrigin: process.env.CORS_ORIGIN || '*',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://flyff:password@localhost:5432/flyff_mvp',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    enableMonitor: process.env.ENABLE_MONITOR !== 'false',
    logLevel: process.env.LOG_LEVEL || 'info',
    tickRate: 20,
    maxPlayersPerRoom: 200,
    worldPersistInterval: 5000,
  };
}

export const config: ServerConfig = loadConfig();

Logger.info('Server configuration loaded', {
  port: config.serverPort,
  tickRate: config.tickRate,
  maxPlayers: config.maxPlayersPerRoom,
});
