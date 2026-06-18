import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AccountEntity } from './AccountEntity.js';

@Entity('characters')
export class CharacterEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;

  @Column({ type: 'varchar', length: 16, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 32, default: 'Beginner' })
  class!: string;

  @Column({ default: 1 })
  level!: number;

  @Column({ type: 'bigint', default: 0 })
  experience!: bigint;

  @Column({ default: 5 })
  str!: number;

  @Column({ default: 5 })
  sta!: number;

  @Column({ default: 5 })
  dex!: number;

  @Column({ default: 5 })
  int!: number;

  @Column({ default: 5 })
  spr!: number;

  @Column({ name: 'stat_points', default: 0 })
  statPoints!: number;

  @Column({ default: 100 })
  hp!: number;

  @Column({ name: 'max_hp', default: 100 })
  maxHp!: number;

  @Column({ default: 50 })
  mp!: number;

  @Column({ name: 'max_mp', default: 50 })
  maxMp!: number;

  @Column({ type: 'bigint', default: 0 })
  gold!: bigint;

  @Column({ name: 'map_id', length: 64, default: 'Flarine' })
  mapId!: string;

  @Column({ name: 'position_x', type: 'real', default: 0 })
  positionX!: number;

  @Column({ name: 'position_y', type: 'real', default: 0 })
  positionY!: number;

  @Column({ name: 'position_z', type: 'real', default: 0 })
  positionZ!: number;

  @Column({ type: 'real', default: 0 })
  rotation!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'last_saved', type: 'timestamp', default: () => 'NOW()' })
  lastSaved!: Date;

  @Column({ name: 'playtime_seconds', default: 0 })
  playtimeSeconds!: number;

  @Column({ name: 'deletion_mark', default: false })
  deletionMark!: boolean;
}
