import { generateId } from '../utils/Helpers.js';

interface PartyMember {
  id: string;
  name: string;
  level: number;
  class: string;
  hp: number;
  maxHp: number;
}

interface Party {
  id: string;
  leaderId: string;
  members: PartyMember[];
  invites: Map<string, string>;
}

export class PartyHandler {
  private parties: Map<string, Party> = new Map();
  private playerPartyMap: Map<string, string> = new Map();

  handleInvite(fromPlayerId: string, fromPlayerName: string, targetPlayerId: string): { success: boolean; partyId?: string; error?: string } {
    const existingPartyId = this.playerPartyMap.get(fromPlayerId);
    let party: Party;
    if (existingPartyId) {
      party = this.parties.get(existingPartyId)!;
      if (party.leaderId !== fromPlayerId) {
        return { success: false, error: 'Only the party leader can invite' };
      }
      if (party.members.length >= 6) {
        return { success: false, error: 'Party is full' };
      }
    } else {
      party = { id: generateId(), leaderId: fromPlayerId, members: [{ id: fromPlayerId, name: fromPlayerName, level: 1, class: 'adventurer', hp: 100, maxHp: 100 }], invites: new Map() };
      this.parties.set(party.id, party);
      this.playerPartyMap.set(fromPlayerId, party.id);
    }
    if (this.playerPartyMap.has(targetPlayerId)) {
      return { success: false, error: 'Target player is already in a party' };
    }
    party.invites.set(targetPlayerId, fromPlayerId);
    return { success: true, partyId: party.id };
  }

  handleAccept(playerId: string, playerName: string, partyId: string): { success: boolean; error?: string } {
    const party = this.parties.get(partyId);
    if (!party) return { success: false, error: 'Party not found' };
    const inviterId = party.invites.get(playerId);
    if (!inviterId) return { success: false, error: 'No invite from this party' };
    party.invites.delete(playerId);
    party.members.push({ id: playerId, name: playerName, level: 1, class: 'adventurer', hp: 100, maxHp: 100 });
    this.playerPartyMap.set(playerId, partyId);
    return { success: true };
  }

  handleLeave(playerId: string): { success: boolean; disbanded?: boolean; error?: string } {
    const partyId = this.playerPartyMap.get(playerId);
    if (!partyId) return { success: false, error: 'Not in a party' };
    const party = this.parties.get(partyId)!;
    party.members = party.members.filter(m => m.id !== playerId);
    this.playerPartyMap.delete(playerId);
    if (party.leaderId === playerId && party.members.length > 0) {
      party.leaderId = party.members[0]!.id;
    }
    if (party.members.length === 0) {
      this.parties.delete(partyId);
      return { success: true, disbanded: true };
    }
    return { success: true };
  }

  handleKick(leaderId: string, targetId: string): { success: boolean; error?: string } {
    const partyId = this.playerPartyMap.get(leaderId);
    if (!partyId) return { success: false, error: 'Not in a party' };
    const party = this.parties.get(partyId)!;
    if (party.leaderId !== leaderId) return { success: false, error: 'Only the leader can kick' };
    const idx = party.members.findIndex(m => m.id === targetId);
    if (idx < 0) return { success: false, error: 'Target not in party' };
    party.members.splice(idx, 1);
    this.playerPartyMap.delete(targetId);
    return { success: true };
  }

  getParty(playerId: string): Party | undefined {
    const partyId = this.playerPartyMap.get(playerId);
    if (!partyId) return undefined;
    return this.parties.get(partyId);
  }

  getPartyByPlayer(playerId: string): Party | undefined {
    return this.getParty(playerId);
  }
}
