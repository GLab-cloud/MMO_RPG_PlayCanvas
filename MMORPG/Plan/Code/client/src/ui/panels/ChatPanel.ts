export class ChatPanel {
  private parent: pc.Entity;
  private chatLog: pc.Entity;
  private inputField: pc.Entity;
  private messages: Array<{ channel: string; sender: string; text: string; timestamp: number }> = [];
  private maxMessages = 100;

  constructor(parent: pc.Entity) {
    this.parent = parent;
    this.chatLog = new pc.Entity('ChatLog');
    this.parent.addChild(this.chatLog);
    this.inputField = new pc.Entity('ChatInput');
    this.parent.addChild(this.inputField);
  }

  addMessage(data: { channel: string; senderName: string; text: string; color?: string }): void {
    this.messages.push({
      channel: data.channel,
      sender: data.senderName,
      text: data.text,
      timestamp: Date.now(),
    });

    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  getMessages(): Array<{ channel: string; sender: string; text: string; timestamp: number }> {
    return this.messages;
  }
}
