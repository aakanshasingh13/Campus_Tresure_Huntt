import assert from 'node:assert/strict';

const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
  setItem: (key: string, value: string) => {
    storage.set(key, String(value));
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
};

const originalFetch = globalThis.fetch;
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (error: any) {
    failed++;
    console.log(`  FAIL: ${name} — ${error.message}`);
  }
}

function createToken(expiresAt: number = Date.now() + 60000): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: 'usr-test-player', role: 'player', exp: expiresAt })
  ).toString('base64url');
  return `${payload}.test-signature`;
}

async function main(): Promise<void> {
  const { buildApiUrl, setApiBaseUrl } = await import('../src/lib/apiConfig');
  const {
    clearSessionToken,
    getSessionToken,
    setSessionToken,
  } = await import('../src/lib/sessionToken');
  const { apiFetch } = await import('../src/lib/apiFetch');

  try {
    await test('API base URL routing uses the discovered backend', async () => {
      setApiBaseUrl('http://10.67.196.241:3000');
      assert.equal(
        buildApiUrl('/api/events/evt-101/payment'),
        'http://10.67.196.241:3000/api/events/evt-101/payment'
      );
    });

    await test('Signed session token persists in browser storage', async () => {
      const token = createToken();
      setSessionToken(token);
      assert.equal(getSessionToken(), token);
    });

    await test('Expired session token is cleared', async () => {
      setSessionToken(createToken(Date.now() - 1000));
      assert.equal(getSessionToken(), null);
      assert.equal(storage.get('campus_quest_session_token'), undefined);
    });

    await test('apiFetch attaches the server token to protected requests', async () => {
      const token = createToken();
      setSessionToken(token);
      let capturedUrl = '';
      let capturedInit: RequestInit | undefined;

      (globalThis as any).fetch = async (input: string | URL | Request, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedInit = init;
        return new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await apiFetch('/api/events/evt-101/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      assert.equal(capturedUrl, 'http://10.67.196.241:3000/api/events/evt-101/payment');
      const headers = new Headers(capturedInit?.headers);
      assert.equal(headers.get('Authorization'), `Bearer ${token}`);
      assert.equal(headers.get('Content-Type'), 'application/json');
    });

    await test('apiFetch clears the token on HTTP 401', async () => {
      const token = createToken();
      setSessionToken(token);
      (globalThis as any).fetch = async () =>
        new Response(JSON.stringify({ error: 'Authentication required.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });

      const response = await apiFetch('/api/auth/my-payments');
      assert.equal(response.status, 401);
      assert.equal(getSessionToken(), null);
    });

    await test('apiFetch does not invent an Authorization header without a token', async () => {
      clearSessionToken();
      let capturedInit: RequestInit | undefined;
      (globalThis as any).fetch = async (_input: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await apiFetch('/api/events');
      const headers = new Headers(capturedInit?.headers);
      assert.equal(headers.get('Authorization'), null);
      assert.equal(headers.get('X-Session-Token'), null);
    });
  } finally {
    globalThis.fetch = originalFetch;
    setApiBaseUrl('');
    clearSessionToken();
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
