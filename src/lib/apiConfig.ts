// Campus Quest - Configurable API Base URL
// Supports LAN connectivity for Android APK deployment.
// The base URL can be configured via the Server Connection screen and is
// persisted in localStorage. Defaults to relative URL (empty string) for
// web development where the frontend and backend share the same origin.

const STORAGE_KEY = 'campus_quest_api_base_url';
const CAMPUS_QUEST_SERVICE_ID = 'campus-quest';

export interface CampusQuestHealth {
  service?: string;
  apiVersion?: number;
  status?: string;
  serverTime?: string;
  [key: string]: unknown;
}

export interface VerifiedBackend {
  ok: boolean;
  baseUrl?: string;
  health?: CampusQuestHealth;
  error?: string;
}

export function normalizeApiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && typeof saved === 'string' && saved.length > 0) {
        return saved.replace(/\/$/, ''); // strip trailing slash
      }
    }
  } catch (e) {}
  return ''; // relative URL — works for web dev on same origin
}

export function setApiBaseUrl(url: string): void {
  try {
    const normalized = normalizeApiBaseUrl(url);
    if (typeof localStorage !== 'undefined') {
      if (normalized.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, normalized);
      }
    }
  } catch (e) {}
}

export function clearApiBaseUrl(): void {
  setApiBaseUrl('');
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base + cleanPath;
}

export function isConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[/, '')
    .replace(/\]$/, '');

  if (!host) {
    return false;
  }
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.lan')) {
    return true;
  }

  if (host.includes(':')) {
    return (
      host === '::1' ||
      host.startsWith('fe8') ||
      host.startsWith('fe9') ||
      host.startsWith('fea') ||
      host.startsWith('feb') ||
      host.startsWith('fc') ||
      host.startsWith('fd')
    );
  }

  const parts = host.split('.');
  if (parts.length !== 4) {
    return false;
  }
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

export async function verifyCampusQuestBackend(
  baseUrl: string,
  timeoutMs: number = 4500
): Promise<VerifiedBackend> {
  const normalized = normalizeApiBaseUrl(baseUrl);
  if (!normalized) {
    return { ok: false, error: 'No backend address to verify.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, error: 'Invalid backend address.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Backend address must use HTTP or HTTPS.' };
  }
  if (!isPrivateOrLocalHost(parsed.hostname)) {
    return { ok: false, error: 'Backend address is not on the local network.' };
  }

  const target = `${normalized}/api/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(target, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, error: `Backend health check failed (HTTP ${res.status}).` };
    }

    const payload = (await res.json()) as CampusQuestHealth;
    if (
      !payload ||
      payload.service !== CAMPUS_QUEST_SERVICE_ID ||
      payload.status !== 'healthy'
    ) {
      return { ok: false, error: 'Server did not identify itself as Campus Quest.' };
    }

    return { ok: true, baseUrl: normalized, health: payload };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return { ok: false, error: 'Backend health check timed out.' };
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Backend health check failed.' };
  }
}

export async function testConnection(baseUrl: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const target = baseUrl.replace(/\/$/, '') + '/api/health';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(target, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { ok: false, error: 'Connection timed out. Check the server address and ensure the backend is running.' };
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Connection failed.' };
  }
}
