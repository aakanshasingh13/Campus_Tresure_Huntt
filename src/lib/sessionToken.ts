const SESSION_TOKEN_KEY = 'campus_quest_session_token';

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  if (typeof globalThis.atob !== 'function') {
    return '';
  }
  return globalThis.atob(padded);
}

function isTokenExpired(token: string): boolean {
  const payloadPart = token.split('.')[0];
  if (!payloadPart) {
    return true;
  }
  try {
    const payload = JSON.parse(decodeBase64Url(payloadPart));
    return typeof payload?.exp === 'number' && Date.now() >= payload.exp;
  } catch {
    return false;
  }
}

export function getSessionToken(): string | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      return null;
    }
    if (isTokenExpired(token)) {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  try {
    if (typeof localStorage === 'undefined' || !token) {
      return;
    }
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {}
}

export function clearSessionToken(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {}
}

export function hasSessionToken(): boolean {
  return Boolean(getSessionToken());
}

export default {
  getSessionToken,
  setSessionToken,
  clearSessionToken,
  hasSessionToken,
};
