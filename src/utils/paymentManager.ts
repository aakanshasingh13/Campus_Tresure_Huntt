export interface OrganizerPaymentRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userEmail: string;
  username: string;
  teamName: string;
  teamCode?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  utrNumber: string;
  transactionId?: string;
  paymentMode?: 'sandbox' | 'real';
  isSimulated?: boolean;
  status: 'verified' | 'success' | 'pending';
  timestamp: string;
  pinIssued: string;
  orderId?: string;
}

const STORAGE_KEY = 'campus_organizer_payments';

const INITIAL_PAYMENTS: OrganizerPaymentRecord[] = [
  {
    id: 'pay-001',
    eventId: 'evt-101',
    eventTitle: 'The Great Belltower Mystery',
    userId: 'usr_alex_842',
    userEmail: 'alex.hunter@campus.edu',
    username: 'ExplorerArjun',
    teamName: 'Shadow Seekers',
    teamCode: 'BELL901',
    amount: 199,
    currency: '₹',
    paymentMethod: 'UPI (GPay)',
    utrNumber: '928174829104',
    status: 'verified',
    timestamp: '2026-08-10 13:42',
    pinIssued: '849201',
  },
  {
    id: 'pay-002',
    eventId: 'evt-101',
    eventTitle: 'The Great Belltower Mystery',
    userId: 'usr_samira_119',
    userEmail: 'samira.sen@university.ac.in',
    username: 'SamiraS',
    teamName: 'Quantum Questers',
    teamCode: 'BELL902',
    amount: 199,
    currency: '₹',
    paymentMethod: 'UPI (PhonePe)',
    utrNumber: '928165910243',
    status: 'verified',
    timestamp: '2026-08-10 12:15',
    pinIssued: '849201',
  },
  {
    id: 'pay-003',
    eventId: 'evt-101',
    eventTitle: 'The Great Belltower Mystery',
    userId: 'usr_priya_553',
    userEmail: 'priya.sharma@stanford.edu',
    username: 'PriyaSharma',
    teamName: 'Night Owls',
    teamCode: 'BELL903',
    amount: 199,
    currency: '₹',
    paymentMethod: 'UPI (Paytm)',
    utrNumber: '928143219087',
    status: 'verified',
    timestamp: '2026-08-10 11:30',
    pinIssued: '849201',
  },
  {
    id: 'pay-004',
    eventId: 'evt-101',
    eventTitle: 'The Great Belltower Mystery',
    userId: 'usr_zack_904',
    userEmail: 'zack.taylor@polytech.edu',
    username: 'ZackT',
    teamName: 'Pixel Pioneers',
    teamCode: 'BELL904',
    amount: 199,
    currency: '₹',
    paymentMethod: 'UPI (BHIM)',
    utrNumber: '928091823741',
    status: 'verified',
    timestamp: '2026-08-10 10:05',
    pinIssued: '849201',
  },
  {
    id: 'pay-005',
    eventId: 'evt-101',
    eventTitle: 'The Great Belltower Mystery',
    userId: 'usr_nisha_328',
    userEmail: 'nisha.pillai@mit.edu',
    username: 'NishaP',
    teamName: 'Enigma Explorers',
    teamCode: 'BELL905',
    amount: 199,
    currency: '₹',
    paymentMethod: 'UPI (GPay)',
    utrNumber: '927982104592',
    status: 'verified',
    timestamp: '2026-08-09 18:22',
    pinIssued: '849201',
  },
  {
    id: 'pay-006',
    eventId: 'evt-team-midnight',
    eventTitle: 'Midnight Syndicate: Team Only Hunt',
    userId: 'usr_rohan_442',
    userEmail: 'rohan.sharma@campus.edu',
    username: 'RohanCipher',
    teamName: 'Midnight Shadows',
    teamCode: 'MID901',
    amount: 199,
    currency: '₹',
    paymentMethod: 'UPI (GPay)',
    utrNumber: '927891204859',
    status: 'verified',
    timestamp: '2026-08-09 16:50',
    pinIssued: '918342',
  },
  {
    id: 'pay-007',
    eventId: 'evt-102',
    eventTitle: 'Metropolitan Heritage Run',
    userId: 'usr_arjun_671',
    userEmail: 'arjun.mehta@citycampus.org',
    username: 'ArjunCity',
    teamName: 'Heritage Hunters',
    teamCode: 'MET901',
    amount: 199,
    currency: '₹',
    paymentMethod: 'UPI (PhonePe)',
    utrNumber: '927781920394',
    status: 'verified',
    timestamp: '2026-08-09 14:10',
    pinIssued: '562910',
  },
  {
    id: 'pay-008',
    eventId: 'evt-103',
    eventTitle: 'Royal Botanical Secret Garden',
    userId: 'usr_kavita_228',
    userEmail: 'kavita.reddy@stanford.edu',
    username: 'KavitaBotanist',
    teamName: 'Flora Seekers',
    teamCode: 'BOT901',
    amount: 149,
    currency: '₹',
    paymentMethod: 'UPI (Paytm)',
    utrNumber: '927650192834',
    status: 'verified',
    timestamp: '2026-08-09 11:00',
    pinIssued: '772914',
  },
  {
    id: 'pay-009',
    eventId: 'evt-104',
    eventTitle: 'Coastal Lighthouse Cipher',
    userId: 'usr_kabir_891',
    userEmail: 'kabir.joshi@maritime.edu',
    username: 'BeaconWatcher',
    teamName: 'Maritime Navigators',
    teamCode: 'LGT901',
    amount: 249,
    currency: '₹',
    paymentMethod: 'UPI (GPay)',
    utrNumber: '927549102938',
    status: 'verified',
    timestamp: '2026-08-08 20:30',
    pinIssued: '614920',
  },
  {
    id: 'pay-010',
    eventId: 'evt-105',
    eventTitle: 'Old Observatory Star Chart',
    userId: 'usr_neha_712',
    userEmail: 'neha.saxena@astro.edu',
    username: 'StargazerNeha',
    teamName: 'Cosmic Cartographers',
    teamCode: 'OBS901',
    amount: 199,
    currency: '₹',
    paymentMethod: 'UPI (PhonePe)',
    utrNumber: '927438192019',
    status: 'verified',
    timestamp: '2026-08-08 17:15',
    pinIssued: '839201',
  },
  // Sandbox / Demo mode payments (SIM-prefixed transaction IDs, never stored as UTR)
  {
    id: 'pay-sandbox-001',
    eventId: 'evt-101',
    eventTitle: 'The Great Belltower Mystery',
    userId: 'usr_demo_001',
    userEmail: 'demo.player1@campus.edu',
    username: 'DemoHunter1',
    teamName: 'Sandbox Squad Alpha',
    teamCode: 'SIM901',
    amount: 199,
    currency: '₹',
    paymentMethod: 'Sandbox UPI (Simulated)',
    utrNumber: '',
    transactionId: 'SIM-82917401',
    paymentMode: 'sandbox',
    isSimulated: true,
    status: 'verified',
    timestamp: '2026-08-15 10:30',
    pinIssued: '123456',
  },
  {
    id: 'pay-sandbox-002',
    eventId: 'evt-102',
    eventTitle: 'Metropolitan Heritage Run',
    userId: 'usr_demo_002',
    userEmail: 'demo.player2@campus.edu',
    username: 'DemoHunter2',
    teamName: 'Sandbox Squad Beta',
    teamCode: 'SIM902',
    amount: 199,
    currency: '₹',
    paymentMethod: 'Sandbox UPI (Simulated)',
    utrNumber: '',
    transactionId: 'SIM-71629304',
    paymentMode: 'sandbox',
    isSimulated: true,
    status: 'pending',
    timestamp: '2026-08-16 14:20',
    pinIssued: '',
  },
];

export function getStoredPayments(): OrganizerPaymentRecord[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {}
  return INITIAL_PAYMENTS;
}

export function saveStoredPayments(payments: OrganizerPaymentRecord[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
    }
  } catch (e) {}
}

export function recordNewPayment(payment: OrganizerPaymentRecord): OrganizerPaymentRecord {
  const current = getStoredPayments();
  const existingIdx = current.findIndex(
    (p) =>
      p.id === payment.id ||
      (payment.transactionId && p.transactionId && p.transactionId === payment.transactionId) ||
      (payment.utrNumber && p.utrNumber && p.utrNumber === payment.utrNumber)
  );

  let updatedList: OrganizerPaymentRecord[];
  if (existingIdx !== -1) {
    current[existingIdx] = payment;
    updatedList = [...current];
  } else {
    updatedList = [payment, ...current];
  }

  saveStoredPayments(updatedList);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('campus_payment_recorded', {
        detail: { payment, totalCount: updatedList.length },
      })
    );
  }

  return payment;
}

export function getOrganizerCollectionStats(events?: any[]): {
  totalCollected: number;
  totalPaymentsCount: number;
  formattedAmount: string;
  totalPlayersJoined: number;
} {
  const payments = getStoredPayments();
  const verified = payments.filter((p) => p.status === 'verified' || p.status === 'success');
  const total = verified.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Calculate registered players count (each squad/payment represents members)
  // Base 3 players avg per team registration + individual payments
  const totalPlayers = Math.max(verified.length * 3 - 2, 28);

  return {
    totalCollected: total,
    totalPaymentsCount: verified.length,
    formattedAmount: `₹${total.toLocaleString('en-IN')}`,
    totalPlayersJoined: totalPlayers,
  };
}
