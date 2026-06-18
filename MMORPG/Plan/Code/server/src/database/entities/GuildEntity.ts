import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('guilds')
export class GuildEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 24, unique: true })
  name!: string;

  @Column({ name: 'leader_id', type: 'uuid' })
  leaderId!: string;

  @Column({ default: 1 })
  level!: number;

  @Column({ type: 'bigint', default: 0 })
  experience!: bigint;

  @Column({ name: 'member_count', default: 1 })
  memberCount!: number;

  @Column({ name: 'max_members', default: 20 })
  maxMembers!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'emblem_data', type: 'text', nullable: true })
  emblemData!: string;
}
