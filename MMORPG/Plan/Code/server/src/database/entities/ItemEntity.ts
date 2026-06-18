import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CharacterEntity } from './CharacterEntity.js';

@Entity('items')
export class ItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CharacterEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'character_id' })
  character!: CharacterEntity;

  @Column({ name: 'template_id' })
  templateId!: number;

  @Column()
  slot!: number;

  @Column({ default: 1 })
  quantity!: number;

  @Column({ name: 'enchant_level', default: 0 })
  enchantLevel!: number;

  @Column({ default: 100 })
  durability!: number;

  @Column({ name: 'bonus_str', default: 0 })
  bonusStr!: number;

  @Column({ name: 'bonus_sta', default: 0 })
  bonusSta!: number;

  @Column({ name: 'bonus_dex', default: 0 })
  bonusDex!: number;

  @Column({ name: 'bonus_int', default: 0 })
  bonusInt!: number;

  @Column({ name: 'is_equipped', default: false })
  isEquipped!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
