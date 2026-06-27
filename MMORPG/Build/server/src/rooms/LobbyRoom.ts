import colyseus from 'colyseus';
const { Room } = colyseus;
import type { Client } from 'colyseus';

interface MatchPlayer {
  sessionId: string;
  name: string;
  isHost: boolean;
}

interface MatchInfo {
  id: string;
  name: string;
  map: string;
  maxPlayers: number;
  players: MatchPlayer[];
  status: 'waiting' | 'in_progress';
  difficulty: string;
}

export class LobbyRoom extends Room {
  maxClients = 100;

  private matches: Map<string, MatchInfo> = new Map();

  onCreate(_options: any): void {
    this.onMessage('create_match', (client, data: { name: string; map: string; maxPlayers: number; difficulty: string }) => {
      const id = this.generateId();
      const match: MatchInfo = {
        id,
        name: data.name || 'New Match',
        map: data.map || 'Flarine',
        maxPlayers: Math.min(Math.max(data.maxPlayers || 4, 2), 20),
        players: [{ sessionId: client.sessionId, name: `Player_${client.sessionId.slice(0, 4)}`, isHost: true }],
        status: 'waiting',
        difficulty: data.difficulty || 'easy',
      };
      this.matches.set(id, match);
      client.send('match_created', { matchId: id });
      this.broadcastMatchList();
    });

    this.onMessage('join_match', (client, data: { matchId: string }) => {
      const match = this.matches.get(data.matchId);
      if (!match) { client.send('error', { message: 'Match not found' }); return; }
      if (match.status !== 'waiting') { client.send('error', { message: 'Match already started' }); return; }
      if (match.players.length >= match.maxPlayers) { client.send('error', { message: 'Match is full' }); return; }

      match.players.push({ sessionId: client.sessionId, name: `Player_${client.sessionId.slice(0, 4)}`, isHost: false });
      client.send('match_joined', { matchId: data.matchId });
      this.broadcastMatchList();
    });

    this.onMessage('leave_match', (client, data: { matchId: string }) => {
      this.removePlayerFromMatch(client.sessionId, data.matchId);
    });

    this.onMessage('start_match', async (client, data: { matchId: string }) => {
      const match = this.matches.get(data.matchId);
      if (!match) { client.send('error', { message: 'Match not found' }); return; }
      const host = match.players.find(p => p.isHost);
      if (!host || host.sessionId !== client.sessionId) { client.send('error', { message: 'Only host can start' }); return; }
      if (match.players.length < 1) { client.send('error', { message: 'Need at least 1 player' }); return; }

      match.status = 'in_progress';

      // Send match_starting to all players with the matchId
      // Clients will use joinOrCreate('world', { matchId }) to join the world room
      for (const player of match.players) {
        const playerClient = this.clients.find((c: any) => c.sessionId === player.sessionId);
        if (playerClient) {
          playerClient.send('match_starting', { matchId: data.matchId, difficulty: match.difficulty });
        }
      }

      this.matches.delete(data.matchId);
      this.broadcastMatchList();
    });

    this.onMessage('leave_lobby', (client) => {
      for (const [matchId, match] of this.matches) {
        this.removePlayerFromMatch(client.sessionId, matchId);
      }
    });
  }

  onJoin(client: any): void {
    client.send('match_list', { matches: this.serializeMatches() });
  }

   onLeave(client: any): void {
     for (const [matchId, match] of this.matches) {
       const idx = match.players.findIndex(p => p.sessionId === client.sessionId);
       if (idx !== -1 && match.players[idx]) {
         const wasHost = match.players[idx]!.isHost;
         match.players.splice(idx, 1);
         if (match.players.length === 0) {
           this.matches.delete(matchId);
         } else if (wasHost && match.players.length > 0) {
           match.players[0]!.isHost = true;
         }
       }
     }
     this.broadcastMatchList();
   }

  onDispose(): void {
    this.matches.clear();
  }

   private removePlayerFromMatch(sessionId: string, matchId: string): void {
     const match = this.matches.get(matchId);
     if (!match) return;
     const idx = match.players.findIndex(p => p.sessionId === sessionId);
     if (idx === -1 || !match.players[idx]) return;
     const wasHost = match.players[idx]!.isHost;
     match.players.splice(idx, 1);
     if (match.players.length === 0) {
       this.matches.delete(matchId);
     } else if (wasHost && match.players.length > 0) {
       match.players[0]!.isHost = true;
     }
     this.broadcastMatchList();
   }

  private broadcastMatchList(): void {
    this.broadcast('match_list', { matches: this.serializeMatches() });
  }

  private serializeMatches(): any[] {
    return Array.from(this.matches.values()).map(m => ({
      id: m.id,
      name: m.name,
      map: m.map,
      maxPlayers: m.maxPlayers,
      playerCount: m.players.length,
      players: m.players.map(p => ({ sessionId: p.sessionId, name: p.name, isHost: p.isHost })),
      status: m.status,
      difficulty: m.difficulty,
    }));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
}
