export class Validator {
  static isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{3,16}$/.test(username);
  }

  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidPassword(password: string): boolean {
    return password.length >= 6 && password.length <= 64;
  }

  static isValidCharacterName(name: string): boolean {
    return /^[a-zA-Z0-9_\u4e00-\u9fff]{2,16}$/.test(name);
  }

  static isValidChatMessage(text: string): boolean {
    if (!text || text.trim().length === 0) return false;
    if (text.length > 200) return false;
    return true;
  }

  static sanitizeText(text: string): string {
    return text
      .replace(/[<>&]/g, (c) => {
        switch (c) { case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; default: return c; }
      })
      .trim();
  }

  static isValidPosition(x: number, y: number, z: number, mapBounds: number): boolean {
    const half = mapBounds / 2;
    return (
      x >= -half && x <= half &&
      z >= -half && z <= half &&
      y >= -10 && y <= 50
    );
  }

  static isValidStatAllocation(stat: string, currentValue: number): boolean {
    const maxStat = 999;
    return currentValue < maxStat && ['str', 'sta', 'dex', 'int', 'spr'].includes(stat);
  }

  static sanitizeForDb(input: string): string {
    return input.replace(/['";\\]/g, '');
  }
}
