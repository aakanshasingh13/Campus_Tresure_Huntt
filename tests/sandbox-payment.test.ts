import assert from 'node:assert';
import { spawn, ChildProcess } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

// --------------------------------------------------------------------------
// Test configuration
// --------------------------------------------------------------------------
const TEST_PORT = 3999;
const SESSION_SECRET = 'sandbox-payment-test-secret-key-0123456789abcdef';
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Seed account credentials (from server.ts seed data)
const SUPERADMIN_ID = 'usr-seed-admin-001';
const SUPERADMIN_ROLE = 'superadmin';
const PLAYER_ID = 'usr-seed-player-001';
const PLAYER_ROLE = 'player';

// --------------------------------------------------------------------------
// Token signing (same algorithm as server.ts signSessionToken)
// --------------------------------------------------------------------------
function signSessionToken(userId: string, role: string): string {
  const exp = Date.now() + 300000;
  const payload = JSON.stringify({ sub: userId, role, exp });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

const SUPERADMIN_TOKEN = signSessionToken(SUPERADMIN_ID, SUPERADMIN_ROLE);
const PLAYER_TOKEN = signSessionToken(PLAYER_ID, PLAYER_ROLE);

// --------------------------------------------------------------------------
// Process management
// --------------------------------------------------------------------------
function startServer(sandboxEnabled: boolean, tmpDir: string): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(TEST_PORT),
      SANDBOX_MODE_ENABLED: sandboxEnabled ? 'true' : 'false',
      SESSION_SECRET,
      PAYMENTS_FILE: path.join(tmpDir, 'test-payments.json'),
      REGISTRATIONS_FILE: path.join(tmpDir, 'test-registrations.json'),
      ACCOUNTS_FILE: path.join(tmpDir, 'test-accounts.json'),
      CAMPUS_QUEST_DISABLE_DISCOVERY: 'true',
    };
    const proc = spawn('node', [path.join('node_modules', 'tsx', 'dist', 'cli.mjs'), 'server.ts'], {
      env,
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let ready = false;
    const timeout = setTimeout(() => {
      if (!ready) {
        proc.kill();
        reject(new Error(`Server failed to start on port ${TEST_PORT} within timeout`));
      }
    }, 25000);

    const checkReady = (output: string) => {
      if (output.includes(`Ready on http://0.0.0.0:${TEST_PORT}`)) {
        ready = true;
        clearTimeout(timeout);
        resolve(proc);
      }
    };

    proc.stdout?.on('data', (data) => checkReady(data.toString()));
    proc.stderr?.on('data', (data) => checkReady(data.toString()));
  });
}

function stopServer(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (!proc || proc.exitCode !== null) {
      resolve();
      return;
    }
    const finish = () => resolve();
    proc.once('exit', finish);
    try {
      proc.kill('SIGTERM');
    } catch {
      resolve();
    }
    setTimeout(finish, 3000);
  });
}

// --------------------------------------------------------------------------
// HTTP request helper
// --------------------------------------------------------------------------
function request(
  urlPath: string,
  opts: { method?: string; body?: any; headers?: Record<string, string> } = {},
): Promise<{ statusCode: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let body: any = data;
        try { body = JSON.parse(data); } catch {}
        resolve({ statusCode: res.statusCode || 0, body });
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

let txnCounter = 0;
function transactionId(label = 'CHECKOUT'): string {
  txnCounter++;
  return `SIM-${label}-${Date.now()}-${txnCounter}`.toUpperCase();
}

async function createPaidEvent(
  titleSuffix: string,
  fee = 199,
): Promise<{ eventId: string; pin: string; fee: number }> {
  const res = await request('/api/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPERADMIN_TOKEN}` },
    body: {
      title: `Test Paid Event ${titleSuffix}`,
      campusName: 'Test Campus',
      isPaid: true,
      registrationFee: fee,
      code: String(Date.now()).slice(-6),
    },
  });
  assert.strictEqual(res.statusCode, 201, `Event creation failed: ${JSON.stringify(res.body)}`);
  return {
    eventId: res.body.event.id,
    pin: res.body.event.code,
    fee: res.body.event.registrationFee,
  };
}

async function createFreeEvent(titleSuffix: string): Promise<{ eventId: string; pin: string }> {
  const res = await request('/api/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPERADMIN_TOKEN}` },
    body: {
      title: `Test Free Event ${titleSuffix}`,
      campusName: 'Test Campus',
      isPaid: false,
      registrationFee: 0,
      code: String(Date.now() + 1).slice(-6),
    },
  });
  assert.strictEqual(res.statusCode, 201, `Free event creation failed: ${JSON.stringify(res.body)}`);
  return { eventId: res.body.event.id, pin: res.body.event.code };
}

async function listPayments(eventId: string): Promise<any[]> {
  const res = await request(`/api/events/${eventId}/payments`, {
    headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
  });
  assert.strictEqual(res.statusCode, 200, `Payment listing failed: ${JSON.stringify(res.body)}`);
  return res.body.payments || [];
}

async function listRegistrations(eventId: string): Promise<any[]> {
  const res = await request(`/api/events/${eventId}/registrations`, {
    headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
  });
  assert.strictEqual(res.statusCode, 200, `Registration listing failed: ${JSON.stringify(res.body)}`);
  return res.body.registrations || [];
}

function checkoutRequest(
  eventId: string,
  teamName: string,
  txnId: string,
  extra: Record<string, any> = {},
) {
  return request(`/api/events/${eventId}/sandbox-checkout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
    body: { teamName, transactionId: txnId, ...extra },
  });
}

// --------------------------------------------------------------------------
// Test runner
// --------------------------------------------------------------------------
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err: any) {
    failed++;
    console.log(`  FAIL: ${name} — ${err.message}`);
  }
}

function summary(): void {
  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------
async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cq-sandbox-test-'));

  try {
    // =======================================================================
    // SANDBOX MODE ENABLED
    // =======================================================================
    console.log('\n=== SANDBOX MODE ENABLED ===');
    const procEnabled = await startServer(true, tmpDir);
    try {
      await test('One-click checkout confirms payment and auto-registers', async () => {
        const event = await createPaidEvent('instant-success');
        const txn = transactionId('INSTANT');
        const res = await checkoutRequest(
          event.eventId,
          'Instant Falcons',
          txn,
          {
            amount: 1,
            amountRupees: 1,
            amountPaise: 100,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMode: 'real',
            isSimulated: false,
            utrNumber: '999999999999',
          },
        );

        assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.payment.status, 'verified');
        assert.strictEqual(res.body.payment.paymentMode, 'sandbox');
        assert.strictEqual(res.body.payment.isSimulated, true);
        assert.strictEqual(res.body.payment.verificationSource, 'sandbox-instant');
        assert.strictEqual(res.body.payment.utrNumber, '');
        assert.strictEqual(res.body.payment.amountRupees, 199);
        assert.strictEqual(res.body.payment.amountPaise, 19900);
        assert.strictEqual(res.body.payment.transactionId, txn);
        assert.strictEqual(res.body.amountRupees, 199);
        assert.strictEqual(res.body.registration.status, 'verified');
        assert.strictEqual(res.body.registration.paymentStatus, 'verified');
        assert.strictEqual(res.body.registration.teamName, 'Instant Falcons');
        assert.strictEqual(res.body.registration.transactionId, txn);
        assert.strictEqual(res.body.registration.paymentId, res.body.payment.id);
        assert.strictEqual(res.body.registration.userId, PLAYER_ID);

        const payments = await listPayments(event.eventId);
        const registrations = await listRegistrations(event.eventId);
        assert.strictEqual(payments.length, 1);
        assert.strictEqual(registrations.length, 1);
        assert.strictEqual(payments[0].status, 'verified');
        assert.strictEqual(registrations[0].status, 'verified');
      });

      await test('Server uses the event fee and ignores client amount/mode/status', async () => {
        const event = await createPaidEvent('server-amount', 157);
        const txn = transactionId('AMOUNT');
        const res = await checkoutRequest(event.eventId, 'Server Amount Squad', txn, {
          amount: 1,
          amountRupees: 1,
          amountPaise: 100,
          paymentMode: 'real',
          isSimulated: false,
          status: 'rejected',
          paymentStatus: 'verified',
        });

        assert.strictEqual(res.statusCode, 201, JSON.stringify(res.body));
        assert.strictEqual(res.body.payment.amountRupees, 157);
        assert.strictEqual(res.body.payment.amountPaise, 15700);
        assert.strictEqual(res.body.payment.paymentMode, 'sandbox');
        assert.strictEqual(res.body.payment.isSimulated, true);
        assert.strictEqual(res.body.payment.status, 'verified');
        assert.strictEqual(res.body.registration.amount, 157);
        assert.strictEqual(res.body.registration.paymentMode, 'sandbox');
      });

      await test('Concurrent duplicate submissions are idempotent', async () => {
        const event = await createPaidEvent('idempotent');
        const txn = transactionId('IDEMPOTENT');
        const [first, second] = await Promise.all([
          checkoutRequest(event.eventId, 'Idempotent Squad', txn),
          checkoutRequest(event.eventId, 'Idempotent Squad', txn),
        ]);

        const statuses = [first.statusCode, second.statusCode].sort((a, b) => a - b);
        assert.deepStrictEqual(statuses, [200, 201]);
        assert.strictEqual(first.body.success, true);
        assert.strictEqual(second.body.success, true);
        assert.strictEqual(first.body.payment.id, second.body.payment.id);
        assert.strictEqual(first.body.registration.id, second.body.registration.id);
        assert.ok(first.body.idempotent || second.body.idempotent);

        const payments = await listPayments(event.eventId);
        const registrations = await listRegistrations(event.eventId);
        assert.strictEqual(payments.filter((p) => p.transactionId === txn).length, 1);
        assert.strictEqual(registrations.length, 1);
      });

      await test('A new transaction after registration is rejected without duplicate records', async () => {
        const event = await createPaidEvent('already-registered');
        const firstTxn = transactionId('FIRST');
        const first = await checkoutRequest(event.eventId, 'Already Registered Squad', firstTxn);
        assert.strictEqual(first.statusCode, 201, JSON.stringify(first.body));

        const secondTxn = transactionId('SECOND');
        const second = await checkoutRequest(event.eventId, 'Already Registered Squad', secondTxn);
        assert.strictEqual(second.statusCode, 409, JSON.stringify(second.body));
        assert.strictEqual(second.body.code, 'ALREADY_REGISTERED');
        assert.strictEqual((await listPayments(event.eventId)).length, 1);
        assert.strictEqual((await listRegistrations(event.eventId)).length, 1);
        assert.strictEqual((await listPayments(event.eventId)).some((p) => p.transactionId === secondTxn), false);
      });

      await test('A transaction reference cannot be reused on another event', async () => {
        const firstEvent = await createPaidEvent('txn-source');
        const secondEvent = await createPaidEvent('txn-target');
        const sharedTxn = transactionId('SHARED');
        const first = await checkoutRequest(firstEvent.eventId, 'Shared Txn Squad', sharedTxn);
        assert.strictEqual(first.statusCode, 201, JSON.stringify(first.body));

        const second = await checkoutRequest(secondEvent.eventId, 'Shared Txn Squad', sharedTxn);
        assert.strictEqual(second.statusCode, 409, JSON.stringify(second.body));
        assert.strictEqual(second.body.code, 'DUPLICATE_SANDBOX_TRANSACTION');
        assert.strictEqual((await listPayments(secondEvent.eventId)).length, 0);
        assert.strictEqual((await listRegistrations(secondEvent.eventId)).length, 0);
      });

      await test('Unauthenticated checkout is rejected', async () => {
        const event = await createPaidEvent('unauthenticated');
        const res = await request(`/api/events/${event.eventId}/sandbox-checkout`, {
          method: 'POST',
          body: { teamName: 'No Auth Squad', transactionId: transactionId('NOAUTH') },
        });
        assert.strictEqual(res.statusCode, 401);
      });

      await test('Invalid transaction reference is rejected without writes', async () => {
        const event = await createPaidEvent('invalid-txn');
        const res = await checkoutRequest(event.eventId, 'Invalid Txn Squad', 'SIM-');
        assert.strictEqual(res.statusCode, 400, JSON.stringify(res.body));
        assert.strictEqual(res.body.code, 'INVALID_SANDBOX_TRANSACTION');
        assert.strictEqual((await listPayments(event.eventId)).length, 0);
        assert.strictEqual((await listRegistrations(event.eventId)).length, 0);
      });

      await test('Missing team name and free events are rejected without writes', async () => {
        const paidEvent = await createPaidEvent('missing-team');
        const missingTeam = await request(`/api/events/${paidEvent.eventId}/sandbox-checkout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { teamName: '   ', transactionId: transactionId('NOTEAM') },
        });
        assert.strictEqual(missingTeam.statusCode, 400, JSON.stringify(missingTeam.body));
        assert.strictEqual(missingTeam.body.code, 'TEAM_NAME_REQUIRED');

        const freeEvent = await createFreeEvent('not-paid');
        const freeCheckout = await checkoutRequest(
          freeEvent.eventId,
          'Free Squad',
          transactionId('FREE'),
        );
        assert.strictEqual(freeCheckout.statusCode, 400, JSON.stringify(freeCheckout.body));
        assert.strictEqual(freeCheckout.body.code, 'EVENT_NOT_PAID');
        assert.strictEqual((await listPayments(freeEvent.eventId)).length, 0);
        assert.strictEqual((await listRegistrations(freeEvent.eventId)).length, 0);
      });

      await test('Legacy sandbox payment path no longer creates pending payments', async () => {
        const event = await createPaidEvent('legacy-sandbox');
        const res = await request(`/api/events/${event.eventId}/payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: {
            paymentMode: 'sandbox',
            isSimulated: true,
            teamName: 'Legacy Squad',
            amount: 199,
          },
        });
        assert.strictEqual(res.statusCode, 400, JSON.stringify(res.body));
        assert.strictEqual(res.body.code, 'USE_SANDBOX_CHECKOUT');
        assert.strictEqual((await listPayments(event.eventId)).length, 0);
      });

      await test('Real payment path remains disabled while sandbox mode is enabled', async () => {
        const event = await createPaidEvent('real-disabled');
        const res = await request(`/api/events/${event.eventId}/payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: {
            paymentMode: 'real',
            isSimulated: false,
            utrNumber: '123456789012',
            teamName: 'Real Disabled Squad',
          },
        });
        assert.strictEqual(res.statusCode, 400, JSON.stringify(res.body));
        assert.strictEqual(res.body.code, 'REAL_PAYMENTS_DISABLED');
      });

      await test('Admin cannot reject an auto-confirmed sandbox payment', async () => {
        const event = await createPaidEvent('admin-guard');
        const checkout = await checkoutRequest(
          event.eventId,
          'Admin Guard Squad',
          transactionId('ADMINGUARD'),
        );
        assert.strictEqual(checkout.statusCode, 201, JSON.stringify(checkout.body));
        const paymentId = checkout.body.payment.id;

        const playerAttempt = await request(`/api/admin/payments/${paymentId}/verify`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { status: 'rejected' },
        });
        assert.strictEqual(playerAttempt.statusCode, 403);

        const adminAttempt = await request(`/api/admin/payments/${paymentId}/verify`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${SUPERADMIN_TOKEN}` },
          body: { status: 'rejected' },
        });
        assert.strictEqual(adminAttempt.statusCode, 400, JSON.stringify(adminAttempt.body));
        assert.strictEqual(adminAttempt.body.code, 'AUTO_VERIFIED_SANDBOX');

        const payments = await listPayments(event.eventId);
        assert.strictEqual(payments[0].status, 'verified');
      });
    } finally {
      await stopServer(procEnabled);
    }

    // =======================================================================
    // SANDBOX MODE DISABLED
    // =======================================================================
    console.log('\n=== SANDBOX MODE DISABLED ===');
    const seededPaymentsPath = path.join(tmpDir, 'test-payments.json');
    const seededPayments = fs.existsSync(seededPaymentsPath)
      ? JSON.parse(fs.readFileSync(seededPaymentsPath, 'utf8'))
      : {};
    seededPayments['evt-102'] = [
      ...(Array.isArray(seededPayments['evt-102']) ? seededPayments['evt-102'] : []),
      {
        id: 'pay-sandbox-disabled-guard',
        orderId: 'ORD-SANDBOX-DISABLED-GUARD',
        eventId: 'evt-102',
        userId: PLAYER_ID,
        username: 'ExplorerArjun',
        teamName: 'Disabled Sandbox Squad',
        utrNumber: '',
        transactionId: 'SIM-DISABLED-GUARD-001',
        paymentMode: 'sandbox',
        isSimulated: true,
        amount: 9900,
        amountPaise: 9900,
        amountRupees: 99,
        currency: 'INR',
        paymentMethod: 'Sandbox Simulation',
        status: 'verified',
        createdAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'test-superadmin',
      },
    ];
    fs.writeFileSync(seededPaymentsPath, JSON.stringify(seededPayments, null, 2), 'utf8');
    const procDisabled = await startServer(false, tmpDir);
    try {
      await test('Sandbox disabled rejects one-click checkout', async () => {
        const res = await request(`/api/events/evt-102/sandbox-checkout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { teamName: 'Disabled Sandbox Squad', transactionId: transactionId('DISABLED') },
        });
        assert.strictEqual(res.statusCode, 400, JSON.stringify(res.body));
        assert.strictEqual(res.body.code, 'SANDBOX_DISABLED');
      });

      await test('Sandbox disabled rejects the legacy sandbox payment path', async () => {
        const res = await request(`/api/events/evt-102/payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { paymentMode: 'sandbox', isSimulated: true, paymentMethod: 'UPI' },
        });
        assert.strictEqual(res.statusCode, 400, JSON.stringify(res.body));
        assert.strictEqual(res.body.code, 'SANDBOX_DISABLED');
      });

      await test('A historical sandbox payment cannot authorize registration when disabled', async () => {
        const res = await request(`/api/events/evt-102/register`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { teamName: 'Disabled Sandbox Squad', pinEntered: '391048' },
        });
        assert.strictEqual(res.statusCode, 403, JSON.stringify(res.body));
      });

      await test('Real UTR validation remains intact', async () => {
        const event = await createPaidEvent('real-validation');
        const missing = await request(`/api/events/${event.eventId}/payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { paymentMethod: 'UPI' },
        });
        assert.strictEqual(missing.statusCode, 400);

        const short = await request(`/api/events/${event.eventId}/payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { utrNumber: '12345', paymentMethod: 'UPI' },
        });
        assert.strictEqual(short.statusCode, 400);

        const valid = await request(`/api/events/${event.eventId}/payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: {
            utrNumber: `928174829${Date.now().toString().slice(-3)}`,
            paymentMethod: 'UPI',
            amount: 1,
            teamName: 'Real Payment Squad',
          },
        });
        assert.strictEqual(valid.statusCode, 201, JSON.stringify(valid.body));
        assert.strictEqual(valid.body.payment.paymentMode, 'real');
        assert.strictEqual(valid.body.payment.isSimulated, false);
        assert.strictEqual(valid.body.payment.status, 'pending');
        assert.strictEqual(valid.body.payment.amountRupees, 199);
      });

      await test('Admin verification and paid registration still work for real payments', async () => {
        const event = await createPaidEvent('real-registration');
        const utr = `7712345${Date.now().toString().slice(-5)}`;
        const payment = await request(`/api/events/${event.eventId}/payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { utrNumber: utr, paymentMethod: 'UPI', teamName: 'Real Payment Squad' },
        });
        assert.strictEqual(payment.statusCode, 201, JSON.stringify(payment.body));
        assert.strictEqual(payment.body.payment.status, 'pending');

        const playerVerify = await request(`/api/admin/payments/${payment.body.payment.id}/verify`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { status: 'verified' },
        });
        assert.strictEqual(playerVerify.statusCode, 403);

        const adminVerify = await request(`/api/admin/payments/${payment.body.payment.id}/verify`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${SUPERADMIN_TOKEN}` },
          body: { status: 'verified' },
        });
        assert.strictEqual(adminVerify.statusCode, 200, JSON.stringify(adminVerify.body));

        const registration = await request(`/api/events/${event.eventId}/register`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { teamName: 'Real Payment Squad', pinEntered: event.pin },
        });
        assert.strictEqual(registration.statusCode, 201, JSON.stringify(registration.body));
        assert.strictEqual(registration.body.registration.status, 'verified');
        assert.strictEqual(registration.body.registration.paymentStatus, 'verified');
        assert.strictEqual(registration.body.registration.paymentId, payment.body.payment.id);
        assert.strictEqual(registration.body.registration.transactionId, utr.toUpperCase());
      });

      await test('Duplicate real UTR is rejected', async () => {
        const event = await createPaidEvent('duplicate-utr');
        const utr = `8812345${Date.now().toString().slice(-5)}`;
        const first = await request(`/api/events/${event.eventId}/payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { utrNumber: utr, paymentMethod: 'UPI', teamName: 'Duplicate UTR Squad' },
        });
        assert.strictEqual(first.statusCode, 201, JSON.stringify(first.body));

        const second = await request(`/api/events/${event.eventId}/payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { utrNumber: utr, paymentMethod: 'UPI', teamName: 'Duplicate UTR Squad' },
        });
        assert.strictEqual(second.statusCode, 409, JSON.stringify(second.body));
      });

      await test('Free event registration and duplicate handling still work', async () => {
        const event = await createFreeEvent('registration');
        const first = await request(`/api/events/${event.eventId}/register`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { teamName: 'Free Team', pinEntered: event.pin },
        });
        assert.strictEqual(first.statusCode, 201, JSON.stringify(first.body));
        assert.strictEqual(first.body.registration.paymentStatus, 'not_required');

        const duplicate = await request(`/api/events/${event.eventId}/register`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${PLAYER_TOKEN}` },
          body: { teamName: 'Free Team', pinEntered: event.pin },
        });
        assert.strictEqual(duplicate.statusCode, 200, JSON.stringify(duplicate.body));
        assert.strictEqual(duplicate.body.success, true);
        assert.strictEqual((await listRegistrations(event.eventId)).length, 1);
      });
    } finally {
      await stopServer(procDisabled);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  summary();
}

main().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
