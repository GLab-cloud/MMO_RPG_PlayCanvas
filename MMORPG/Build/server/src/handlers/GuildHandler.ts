import { generateId } from '../utils/Helpers.js';

interface GuildMember {
  id: string;
  name: string;
  rank: 'leader' | 'officer' | 'member';
  joinedAt: number;
}

interface Guild {
  id: string;
  name: string;
  leaderId: string;
  members: GuildMember[];
  invites: Map<string, string>;
  createdAt: number;
}

export class GuildHandler {
  private guilds: Map<string, Guild> = new Map();
  private playerGuildMap: Map<string, string> = new Map();

  handleCreate(leaderId: string, leaderName: string, name: string): { success: boolean; guildId?: string; error?: string } {
    if (this.playerGuildMap.has(leaderId)) {
      return { success: false, error: 'Already in a guild' };
    }
    if (name.length < 2 || name.length > 24) {
      return { success: false, error: 'Guild name must be 2-24 characters' };
    }
    for (const guild of this.guilds.values()) {
      if (guild.name.toLowerCase() === name.toLowerCase()) {
        return { success: false, error: 'Guild name already taken' };
      }
    }
    const id = generateId();
    const guild: Guild = {
      id,
      name,
      leaderId,
      members: [{ id: leaderId, name: leaderName, rank: 'leader', joinedAt: Date.now() }],
      invites: new Map(),
      createdAt: Date.now(),
    };
    this.guilds.set(id, guild);
    this.playerGuildMap.set(leaderId, id);
    return { success: true, guildId: id };
  }

  handleInvite(fromPlayerId: string, targetPlayerId: string): { success: boolean; error?: string } {
    const guildId = this.playerGuildMap.get(fromPlayerId);
    if (!guildId) return { success: false, error: 'Not in a guild' };
    const guild = this.guilds.get(guildId)!;
    const member = guild.members.find(m => m.id === fromPlayerId);
    if (!member || member.rank === 'member') return { success: false, error: 'No permission to invite' };
    if (this.playerGuildMap.has(targetPlayerId)) return { success: false, error: 'Target already in a guild' };
    guild.invites.set(targetPlayerId, fromPlayerId);
    return { success: true };
  }

  handleAccept(playerId: string, playerName: string, guildId: string): { success: boolean; error?: string } {
    const guild = this.guilds.get(guildId);
    if (!guild) return { success: false, error: 'Guild not found' };
    if (!guild.invites.has(playerId)) return { success: false, error: 'No invite from this guild' };
    guild.invites.delete(playerId);
    guild.members.push({ id: playerId, name: playerName, rank: 'member', joinedAt: Date.now() });
    this.playerGuildMap.set(playerId, guildId);
    return { success: true };
  }

  handleLeave(playerId: string): { success: boolean; error?: string } {
    const guildId = this.playerGuildMap.get(playerId);
    if (!guildId) return { success: false, error: 'Not in a guild' };
    const guild = this.guilds.get(guildId)!;
    if (guild.leaderId === playerId) {
      if (guild.members.length > 1) {
        return { success: false, error: 'Transfer leadership before leaving' };
      }
      this.guilds.delete(guildId);
    } else {
      guild.members = guild.members.filter(m => m.id !== playerId);
    }
    this.playerGuildMap.delete(playerId);
    return { success: true };
  }

  kick(playerId: string, targetId: string): { success: boolean; error?: string } {
    const guildId = this.playerGuildMap.get(playerId);
    if (!guildId) return { success: false, error: 'Not in a guild' };
    const guild = this.guilds.get(guildId)!;
    const member = guild.members.find(m => m.id === playerId);
    if (!member || member.rank === 'member') return { success: false, error: 'No permission to kick' };
    guild.members = guild.members.filter(m => m.id !== targetId);
    this.playerGuildMap.delete(targetId);
    return { success: true };
  }

  getGuild(playerId: string): Guild | undefined {
    const guildId = this.playerGuildMap.get(playerId);
    if (!guildId) return undefined;
    return this.guilds.get(guildId);
  }
}
