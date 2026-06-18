import { validateChatMessage } from '../security/Validator.js';
import { TokenBucketRateLimiter } from '../security/RateLimiter.js';

export type ChatChannel = 'general' | 'party' | 'guild' | 'whisper' | 'world' | 'shout';

export class ChatHandler {
  private rateLimiter: TokenBucketRateLimiter;
  private history: { sender: string; message: string; channel: ChatChannel; timestamp: number }[] = [];
  private maxHistory: number = 50;

  constructor() {
    this.rateLimiter = new TokenBucketRateLimiter(5, 1, 1000);
  }

  handleChat(
    senderId: string,
    senderName: string,
    data: { message: string; channel: ChatChannel; target?: string }
  ): { valid: boolean; broadcast?: { sender: string; message: string; channel: ChatChannel; target?: string }; error?: string; whisper?: { sender: string; message: string; target: string } } {
    if (!this.rateLimiter.consume(senderId, 1)) {
      return { valid: false, error: 'Rate limited. Please slow down.' };
    }
    const validation = validateChatMessage(data.message);
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }
    const chatEntry = { sender: senderName, message: validation.sanitized, channel: data.channel, timestamp: Date.now() };
    this.history.push(chatEntry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    if (data.channel === 'whisper' && data.target) {
      return { valid: true, whisper: { sender: senderName, message: validation.sanitized, target: data.target } };
    }
    return { valid: true, broadcast: { sender: senderName, message: validation.sanitized, channel: data.channel } };
  }

  getHistory(): { sender: string; message: string; channel: ChatChannel; timestamp: number }[] {
    return [...this.history];
  }
}
