// Campus Quest - API Fetch Wrapper
// Prepends the configured API base URL to all fetch calls.
// Use this instead of raw fetch() for any /api/ endpoint so the Android APK
// can connect to the backend over LAN via a user-configured address.
import { buildApiUrl } from './apiConfig';
import { clearSessionToken, getSessionToken } from './sessionToken';

export const SESSION_EXPIRED_EVENT = 'campus-quest:session-expired';

export async function apiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(init.headers);

  if (token && !headers.has('Authorization') && !headers.has('X-Session-Token')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(input), {
    ...init,
    headers,
  });

  if (response.status === 401 && token) {
    clearSessionToken();
    try {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
    } catch {}
  }

  return response;
}

export default apiFetch;
