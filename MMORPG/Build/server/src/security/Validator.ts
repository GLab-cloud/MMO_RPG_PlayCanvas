export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
    return { valid: false, error: 'Username must be between 3 and 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (typeof email !== 'string' || email.length > 255) {
    return { valid: false, error: 'Email is too long' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return { valid: false, error: 'Password must be between 6 and 128 characters' };
  }
  return { valid: true };
}

export function validateCharacterName(name: string): { valid: boolean; error?: string } {
  if (typeof name !== 'string' || name.length < 2 || name.length > 16) {
    return { valid: false, error: 'Character name must be between 2 and 16 characters' };
  }
  if (!/^[a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F0-9_']{1,15}$/.test(name)) {
    return { valid: false, error: 'Invalid character name' };
  }
  return { valid: true };
}

export function validateChatMessage(message: string): { valid: boolean; error?: string; sanitized: string } {
  if (typeof message !== 'string' || message.length === 0 || message.length > 500) {
    return { valid: false, error: 'Message must be between 1 and 500 characters', sanitized: '' };
  }
  const sanitized = message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
  return { valid: true, sanitized };
}

export function validatePosition(x: number, z: number, bounds: { minX: number; maxX: number; minZ: number; maxZ: number }): { valid: boolean; error?: string } {
  if (typeof x !== 'number' || typeof z !== 'number' || !isFinite(x) || !isFinite(z)) {
    return { valid: false, error: 'Invalid position values' };
  }
  if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) {
    return { valid: false, error: 'Position out of bounds' };
  }
  return { valid: true };
}
