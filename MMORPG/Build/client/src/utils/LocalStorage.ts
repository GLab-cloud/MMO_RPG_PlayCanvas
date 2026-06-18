const PREFIX = 'flyff_';

export function getSettings<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveSettings(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    console.warn('Failed to save settings');
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(PREFIX + 'auth_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(PREFIX + 'auth_token', token);
  } else {
    localStorage.removeItem(PREFIX + 'auth_token');
  }
}

export function removeKey(key: string): void {
  localStorage.removeItem(PREFIX + key);
}

export function clearAll(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
