export interface OfficeClueDefinition {
  no: number;
  title: string;
  riddle: string;
  answer: string;
  answerPlace: string;
  answerKey: string;
  placeInstruction: string;
  qrLabel: string;
  points: number;
  hint1?: string;
  hint2?: string;
}

export const OFFICE_CAMPUS_DEFAULT_CLUES: OfficeClueDefinition[] = [
  {
    no: 1,
    title: 'THE KEY KEEPER',
    riddle: 'I have many keys but cannot unlock a door. Without me, your computer is just a silent box.',
    answer: 'Keyboard',
    answerPlace: 'Workstation Bay A / Reception Desk Keyboard Area',
    answerKey: 'KEYBOARD',
    placeInstruction: 'Place QR 1 here · unlocks Stage 2',
    qrLabel: 'QR 1',
    points: 100,
    hint1: 'Full of letters, numbers, and a space bar.',
    hint2: 'You use it to type all your emails.',
  },
  {
    no: 2,
    title: 'THE PAPER SPITTER',
    riddle: "I eat paper and spit out copies. I'm the office machine everyone remembers when deadlines arrive.",
    answer: 'Printer',
    answerPlace: 'Central Print & Copy Center Station',
    answerKey: 'PRINTER',
    placeInstruction: 'Place QR 2 here · unlocks Stage 3',
    qrLabel: 'QR 2',
    points: 120,
    hint1: 'Warm machine where print jobs and scan trays are found.',
    hint2: 'Constantly running low on toner or paper.',
  },
  {
    no: 3,
    title: 'THE GLOWING EYE',
    riddle: 'I have a thousand faces but only one screen. People stare at me more than they look at each other.',
    answer: 'Computer Monitor',
    answerPlace: 'Meeting Room Display Screen / Open Deck Monitor',
    answerKey: 'MONITOR',
    placeInstruction: 'Place QR 3 here · unlocks Stage 4',
    qrLabel: 'QR 3',
    points: 150,
    hint1: 'Displays spreadsheets, code, and video calls.',
    hint2: 'Adjust the brightness when your eyes feel tired.',
  },
  {
    no: 4,
    title: 'THE SILENT CONNECTOR',
    riddle: 'I am always busy but never get paid. I keep everyone connected without saying a single word.',
    answer: 'Wi-Fi Router',
    answerPlace: 'Server Rack Wall / IT Hub Ceiling Router Mount',
    answerKey: 'ROUTER',
    placeInstruction: 'Place QR 4 here · unlocks Stage 5',
    qrLabel: 'QR 4',
    points: 180,
    hint1: 'Blinks with green and blue network lights.',
    hint2: 'Without me, Slack and the internet go down.',
  },
  {
    no: 5,
    title: 'THE VAULT OF SECRETS',
    riddle: 'I hold secrets, files and important papers. But if you lose my key, your boss might lose their mind.',
    answer: 'Cabinet',
    answerPlace: 'Accounts & HR Archive Filing Cabinet',
    answerKey: 'CABINET',
    placeInstruction: 'Place QR 5 here · unlocks Stage 6',
    qrLabel: 'QR 5',
    points: 200,
    hint1: 'Metal drawers loaded with physical folders and documents.',
    hint2: 'Has a small keyhole to keep files confidential.',
  },
  {
    no: 6,
    title: 'THE FOUR-LEGGED COMPANION',
    riddle: 'I have four legs but never walk. Employees spend hours sitting on me while dreaming of going home.',
    answer: 'Office Chair',
    answerPlace: 'Executive Boardroom Conference Chair',
    answerKey: 'OFFICE CHAIR',
    placeInstruction: 'Place QR 6 here · unlocks Stage 7',
    qrLabel: 'QR 6',
    points: 220,
    hint1: 'Swivels 360 degrees on wheels with lumbar support.',
    hint2: 'You spend 8 hours seated right on top of it.',
  },
  {
    no: 7,
    title: 'THE AFTER-LUNCH ESCAPE',
    riddle: "I am everyone's favourite office destination, especially after lunch. People visit me just to escape their work.",
    answer: 'Pantry / Break Room',
    answerPlace: 'Office Pantry Coffee Bar & Snack Counter',
    answerKey: 'PANTRY',
    placeInstruction: 'Place QR 7 here · unlocks Stage 8',
    qrLabel: 'QR 7',
    points: 250,
    hint1: 'Smells like fresh coffee and tea bags.',
    hint2: 'Where watercooler gossip and snack breaks take place.',
  },
  {
    no: 8,
    title: 'THE WOODEN GATEWAY',
    riddle: 'I have a handle but no hands. People push me, pull me and walk through me all day.',
    answer: 'Office Door',
    answerPlace: 'Main Floor Access Glass / Wooden Door Entrance',
    answerKey: 'OFFICE DOOR',
    placeInstruction: 'Place QR 8 here · unlocks Stage 9',
    qrLabel: 'QR 8',
    points: 280,
    hint1: 'Has an access badge scanner or silver handle.',
    hint2: 'Push or pull to transition between meeting rooms.',
  },
  {
    no: 9,
    title: 'THE DOCUMENT EATER',
    riddle: "I make things disappear without magic. Give me a document and I'll turn it into tiny pieces.",
    answer: 'Paper Shredder',
    answerPlace: 'Finance & Compliance Room Shredder Machine',
    answerKey: 'SHREDDER',
    placeInstruction: 'Place QR 9 here · unlocks Stage 10',
    qrLabel: 'QR 9',
    points: 300,
    hint1: 'Whirrs loudly and chews paper into strips.',
    hint2: 'Used to destroy confidential records securely.',
  },
  {
    no: 10,
    title: 'THE HUNGER RESCUER',
    riddle: 'I am cold inside but never catch a fever. People open me when hunger strikes during working hours.',
    answer: 'Refrigerator',
    answerPlace: 'Break Room Double-Door Fridge & Chiller',
    answerKey: 'REFRIGERATOR',
    placeInstruction: 'Place QR 10 here · ends the hunt',
    qrLabel: 'QR 10',
    points: 350,
    hint1: 'Keeps everyone’s lunchboxes and cold drinks chilled.',
    hint2: 'Light turns on every time you pull the door open.',
  },
];

/**
 * Returns a configured list of Office Clues tailored to the requested count (1 to 10).
 */
export function getOfficeDefaultClues(
  count: number = 8,
  eventId: string = 'evt-office'
): {
  id: string;
  title: string;
  riddle: string;
  answerPlace: string;
  answerKey: string;
  placeInstruction: string;
  qrLabel: string;
  points: number;
}[] {
  const safeCount = Math.max(1, Math.min(10, count || 8));
  return OFFICE_CAMPUS_DEFAULT_CLUES.slice(0, safeCount).map((item, idx) => ({
    id: String(idx + 1),
    title: item.title,
    riddle: item.riddle,
    answerPlace: item.answerPlace,
    answerKey: item.answerKey,
    placeInstruction:
      idx === safeCount - 1
        ? `Place QR ${idx + 1} here · Final Checkpoint (ends the hunt)`
        : `Place QR ${idx + 1} here · unlocks Stage ${idx + 2}`,
    qrLabel: `QR ${idx + 1}`,
    points: item.points,
  }));
}
