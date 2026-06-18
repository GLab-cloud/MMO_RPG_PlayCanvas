import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CharacterEntity } from './CharacterEntity.js';

@Entity('leaderboard_snapshots')
@Index(['snapshotType', 'value'], { order: { value: 'DESC' } })
export class LeaderboardEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'snapshot_type', length: 16 })
  snapshotType!: string;

  @ManyToOne(() => CharacterEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'character_id' })
  character!: CharacterEntity;

  @Column({ type: 'bigint' })
  value!: bigint;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'NOW()' })
  updatedAt!: Date;
}
