import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config.js';
import { Logger } from '../utils/Logger.js';
import { AccountEntity } from './entities/AccountEntity.js';
import { CharacterEntity } from './entities/CharacterEntity.js';
import { ItemEntity } from './entities/ItemEntity.js';
import { GuildEntity } from './entities/GuildEntity.js';
import { LeaderboardEntity } from './entities/LeaderboardEntity.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  entities: [
    AccountEntity,
    CharacterEntity,
    ItemEntity,
    GuildEntity,
    LeaderboardEntity,
  ],
  synchronize: true,
  logging: config.logLevel === 'debug',
  poolSize: 20,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
});

export async function connectDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    Logger.info('Database connected successfully');
  } catch (error) {
    Logger.error('Database connection failed:', error);
    throw error;
  }
}
