import assert from 'node:assert/strict';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (error: any) {
    failed++;
    console.log(`  FAIL: ${name} - ${error.message}`);
  }
}

function makeValidPayload() {
  return {
    success: true,
    message: 'Sandbox payment successful and registration confirmed.',
    amountRupees: 199,
    paymentMode: 'sandbox',
    isSimulated: true,
    payment: {
      id: 'pay-test-1',
      orderId: 'ORD-TEST-1',
      status: 'verified',
      paymentMode: 'sandbox',
      isSimulated: true,
      transactionId: 'SIM-TEST-1234',
      amountRupees: 199,
      amount: 19900,
    },
    registration: {
      id: 'reg-test-1',
      status: 'verified',
      paymentStatus: 'verified',
      transactionId: 'SIM-TEST-1234',
      amount: 199,
    },
  };
}

async function main(): Promise<void> {
  const {
    buildSandboxCheckoutPayload,
    createSandboxTransactionId,
    parseConfirmedSandboxCheckout,
  } = await import('../src/lib/paymentCheckout');

  await test('sandbox transaction references are valid and unique per attempt', () => {
    const first = createSandboxTransactionId(1730000000000, 0.123456);
    const second = createSandboxTransactionId(1730000000000, 0.654321);
    assert.match(first, /^SIM-[A-Z0-9-]{4,60}$/);
    assert.match(second, /^SIM-[A-Z0-9-]{4,60}$/);
    assert.notEqual(first, second);
  });

  await test('checkout payload contains only team name and transaction reference', () => {
    const payload = buildSandboxCheckoutPayload('  Night Owls  ', 'SIM-TEST-1234');
    assert.deepEqual(payload, {
      transactionId: 'SIM-TEST-1234',
      teamName: 'Night Owls',
    });
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'amount'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'paymentMode'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'isSimulated'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'status'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'pin'), false);
  });

  await test('confirmed sandbox response produces a success result', () => {
    const result = parseConfirmedSandboxCheckout(makeValidPayload(), {
      title: 'Test Event',
      currency: '₹',
    });
    assert.ok(result);
    assert.equal(result.eventTitle, 'Test Event');
    assert.equal(result.amount, 199);
    assert.equal(result.transactionId, 'SIM-TEST-1234');
    assert.equal(result.paymentStatus, 'verified');
    assert.equal(result.registrationStatus, 'confirmed');
    assert.equal(result.registrationId, 'reg-test-1');
    assert.equal(result.orderId, 'ORD-TEST-1');
  });

  await test('pending payment response never shows success', () => {
    const payload = makeValidPayload();
    payload.payment.status = 'pending';
    assert.equal(parseConfirmedSandboxCheckout(payload, { title: 'Test Event' }), null);
  });

  await test('missing registration never shows success', () => {
    const payload: any = makeValidPayload();
    delete payload.registration;
    assert.equal(parseConfirmedSandboxCheckout(payload, { title: 'Test Event' }), null);
  });

  await test('unverified registration never shows success', () => {
    const payload = makeValidPayload();
    payload.registration.status = 'pending';
    assert.equal(parseConfirmedSandboxCheckout(payload, { title: 'Test Event' }), null);
  });

  await test('real or non-simulated payment never shows sandbox success', () => {
    const payload = makeValidPayload();
    payload.payment.paymentMode = 'real';
    payload.payment.isSimulated = false;
    assert.equal(parseConfirmedSandboxCheckout(payload, { title: 'Test Event' }), null);
  });

  await test('mismatched transaction or amount never shows success', () => {
    const txnMismatch = makeValidPayload();
    txnMismatch.registration.transactionId = 'SIM-OTHER-1234';
    assert.equal(parseConfirmedSandboxCheckout(txnMismatch, { title: 'Test Event' }), null);

    const amountMismatch = makeValidPayload();
    amountMismatch.payment.amountRupees = 1;
    assert.equal(parseConfirmedSandboxCheckout(amountMismatch, { title: 'Test Event' }), null);

    const missingAmount: any = makeValidPayload();
    delete missingAmount.amountRupees;
    assert.equal(parseConfirmedSandboxCheckout(missingAmount, { title: 'Test Event' }), null);
  });

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
