export interface CampusQuestCheckoutResult {
  eventTitle: string;
  amount: number;
  currencySymbol: string;
  transactionId: string;
  paymentStatus: 'verified';
  registrationStatus: 'confirmed';
  registrationId: string;
  orderId?: string;
  message?: string;
}

export interface SandboxCheckoutPayload {
  transactionId: string;
  teamName: string;
}

export function createSandboxTransactionId(now = Date.now(), random = Math.random()): string {
  const stamp = Math.floor(now).toString(36).toUpperCase();
  const suffix = Math.floor(random * 0xffffff)
    .toString(36)
    .toUpperCase()
    .padStart(4, '0')
    .slice(-4);
  return `SIM-${stamp}-${suffix}`;
}

export function buildSandboxCheckoutPayload(
  teamName: string,
  transactionId: string
): SandboxCheckoutPayload {
  return {
    transactionId,
    teamName: teamName.trim(),
  };
}

export function parseConfirmedSandboxCheckout(
  payload: any,
  event: { title: string; currency?: string }
): CampusQuestCheckoutResult | null {
  if (!payload || payload.success !== true) {
    return null;
  }

  const payment = payload.payment;
  const registration = payload.registration;

  if (!payment || !registration) {
    return null;
  }

  if (String(payment.status || '').toLowerCase() !== 'verified') {
    return null;
  }
  if (String(registration.status || '').toLowerCase() !== 'verified') {
    return null;
  }
  if (String(registration.paymentStatus || '').toLowerCase() !== 'verified') {
    return null;
  }

  if (payment.paymentMode !== 'sandbox' || payment.isSimulated !== true) {
    return null;
  }

  if (typeof payment.transactionId !== 'string' || !payment.transactionId) {
    return null;
  }
  if (String(registration.transactionId || '') !== payment.transactionId) {
    return null;
  }

  const amountRupees = payload.amountRupees;
  if (typeof amountRupees !== 'number' || !Number.isFinite(amountRupees) || amountRupees <= 0) {
    return null;
  }
  if (payment.amountRupees !== amountRupees || registration.amount !== amountRupees) {
    return null;
  }

  if (typeof registration.id !== 'string' || !registration.id) {
    return null;
  }

  return {
    eventTitle: event.title,
    amount: amountRupees,
    currencySymbol: event.currency || '₹',
    transactionId: payment.transactionId,
    paymentStatus: 'verified',
    registrationStatus: 'confirmed',
    registrationId: registration.id,
    orderId: typeof payment.orderId === 'string' ? payment.orderId : undefined,
    message: typeof payload.message === 'string' ? payload.message : undefined,
  };
}
