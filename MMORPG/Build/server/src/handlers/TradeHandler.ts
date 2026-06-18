import { generateId } from '../utils/Helpers.js';

interface TradeItem {
  id: string;
  name: string;
  quantity: number;
}

interface TradeOffer {
  playerId: string;
  items: TradeItem[];
  gold: number;
  confirmed: boolean;
}

interface Trade {
  id: string;
  initiator: TradeOffer;
  receiver: TradeOffer;
  state: 'pending' | 'accepted' | 'confirmed' | 'completed' | 'cancelled';
  expiresAt: number;
}

export class TradeHandler {
  private trades: Map<string, Trade> = new Map();
  private activeTrades: Map<string, string> = new Map();

  handleRequest(initiatorId: string, receiverId: string): { success: boolean; tradeId?: string; error?: string } {
    if (this.activeTrades.has(initiatorId) || this.activeTrades.has(receiverId)) {
      return { success: false, error: 'Already in a trade' };
    }
    const id = generateId();
    const trade: Trade = {
      id,
      initiator: { playerId: initiatorId, items: [], gold: 0, confirmed: false },
      receiver: { playerId: receiverId, items: [], gold: 0, confirmed: false },
      state: 'pending',
      expiresAt: Date.now() + 30000,
    };
    this.trades.set(id, trade);
    this.activeTrades.set(initiatorId, id);
    this.activeTrades.set(receiverId, id);
    return { success: true, tradeId: id };
  }

  handleAccept(tradeId: string, playerId: string): { success: boolean; error?: string } {
    const trade = this.trades.get(tradeId);
    if (!trade) return { success: false, error: 'Trade not found' };
    if (trade.state !== 'pending') return { success: false, error: 'Trade is no longer pending' };
    if (trade.initiator.playerId !== playerId && trade.receiver.playerId !== playerId) {
      return { success: false, error: 'Not part of this trade' };
    }
    trade.state = 'accepted';
    return { success: true };
  }

  handleAddItem(tradeId: string, playerId: string, item: { id: string; name: string; quantity: number }): { success: boolean; error?: string } {
    const trade = this.trades.get(tradeId);
    if (!trade) return { success: false, error: 'Trade not found' };
    if (trade.state !== 'accepted') return { success: false, error: 'Trade not in accepted state' };
    const offer = trade.initiator.playerId === playerId ? trade.initiator : trade.receiver;
    const existing = offer.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      offer.items.push({ ...item });
    }
    offer.confirmed = false;
    return { success: true };
  }

  handleConfirm(tradeId: string, playerId: string): { success: boolean; completed?: boolean; error?: string } {
    const trade = this.trades.get(tradeId);
    if (!trade) return { success: false, error: 'Trade not found' };
    if (trade.state !== 'accepted') return { success: false, error: 'Trade not in accepted state' };
    const offer = trade.initiator.playerId === playerId ? trade.initiator : trade.receiver;
    offer.confirmed = true;
    if (trade.initiator.confirmed && trade.receiver.confirmed) {
      trade.state = 'completed';
      this.activeTrades.delete(trade.initiator.playerId);
      this.activeTrades.delete(trade.receiver.playerId);
      this.trades.delete(tradeId);
      return { success: true, completed: true };
    }
    return { success: true };
  }

  cancelTrade(tradeId: string, playerId: string): void {
    const trade = this.trades.get(tradeId);
    if (trade) {
      trade.state = 'cancelled';
      this.activeTrades.delete(trade.initiator.playerId);
      this.activeTrades.delete(trade.receiver.playerId);
      this.trades.delete(tradeId);
    }
  }
}
