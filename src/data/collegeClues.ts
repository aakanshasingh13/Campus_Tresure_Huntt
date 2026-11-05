export interface CollegeClueDefinition {
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

export const COLLEGE_CAMPUS_DEFAULT_CLUES: CollegeClueDefinition[] = [
  {
    no: 1,
    title: 'THE SILENT STORIES',
    riddle: 'I have thousands of stories but never speak. Students visit me when exams are near, but ignore me all year.',
    answer: 'Library',
    answerPlace: 'Central Campus Library Entrance / Circulation Desk',
    answerKey: 'LIBRARY',
    placeInstruction: 'Place QR 1 here · unlocks Stage 2',
    qrLabel: 'QR 1',
    points: 100,
    hint1: 'The quietest academic building on campus with thousands of shelves.',
    hint2: 'Where students study during finals week.',
  },
  {
    no: 2,
    title: 'THE PAPER EATER',
    riddle: 'I have a stomach but never eat. Students feed me paper, wrappers and sometimes their secrets.',
    answer: 'Dustbin',
    answerPlace: 'Main Academic Corridor Dustbin & Recycling Station',
    answerKey: 'DUSTBIN',
    placeInstruction: 'Place QR 2 here · unlocks Stage 3',
    qrLabel: 'QR 2',
    points: 120,
    hint1: 'Found in every hallway corner keeping the campus clean.',
    hint2: 'Where discarded paper and wrappers go.',
  },
  {
    no: 3,
    title: 'THE CAMPUS CELEBRITY',
    riddle: 'I am the most crowded celebrity on campus. Everyone visits me when their stomach starts complaining.',
    answer: 'Canteen',
    answerPlace: 'Campus Canteen / Food Court Counter',
    answerKey: 'CANTEEN',
    placeInstruction: 'Place QR 3 here · unlocks Stage 4',
    qrLabel: 'QR 3',
    points: 150,
    hint1: 'The most popular lunchtime hangout spot.',
    hint2: 'Follow the smell of hot snacks and coffee.',
  },
  {
    no: 4,
    title: 'THE TIME MASTER',
    riddle: 'I have hands but never clap. I control your freedom and decide when your boring lecture ends.',
    answer: 'Clock',
    answerPlace: 'Main Lecture Hall Wall Clock / Bell Tower Plaza',
    answerKey: 'CLOCK',
    placeInstruction: 'Place QR 4 here · unlocks Stage 5',
    qrLabel: 'QR 4',
    points: 180,
    hint1: 'Everyone stares at me during the last 5 minutes of class.',
    hint2: 'Tick, tock, tick, tock.',
  },
  {
    no: 5,
    title: 'THE EYELESS SENTINEL',
    riddle: 'I have a face but no eyes. I know exactly who is coming and going.',
    answer: 'CCTV Camera',
    answerPlace: 'Main Campus Gate / Security Surveillance Station',
    answerKey: 'CCTV CAMERA',
    placeInstruction: 'Place QR 5 here · unlocks Stage 6',
    qrLabel: 'QR 5',
    points: 200,
    hint1: 'Mounted high in the corners watching over the gates.',
    hint2: 'Security monitors display my live feed.',
  },
  {
    no: 6,
    title: 'THE FUTURE REFLECTION',
    riddle: 'Students stand in front of me, hoping their future looks brighter. I show them their own reflection.',
    answer: 'Mirror',
    answerPlace: 'Restroom Hallway / Auditorium Foyer Mirror',
    answerKey: 'MIRROR',
    placeInstruction: 'Place QR 6 here · unlocks Stage 7',
    qrLabel: 'QR 6',
    points: 220,
    hint1: 'Check your hair and outfit before an interview.',
    hint2: 'Glass that shows you who you are.',
  },
  {
    no: 7,
    title: 'THE RUNNING STEPS',
    riddle: 'I have many steps but never walk. Students climb me when they are running late.',
    answer: 'Staircase',
    answerPlace: 'Academic Block Central Staircase 2nd Landing',
    answerKey: 'STAIRCASE',
    placeInstruction: 'Place QR 7 here · unlocks Stage 8',
    qrLabel: 'QR 7',
    points: 250,
    hint1: 'Take these two at a time when running late for lecture.',
    hint2: 'Connects the ground floor to the upper levels.',
  },
  {
    no: 8,
    title: 'THE KNOWLEDGE VAULT',
    riddle: 'I am full of knowledge, but students only open me when exams are approaching.',
    answer: 'Textbook',
    answerPlace: 'Campus Bookstore / Reading Room Shelf',
    answerKey: 'TEXTBOOK',
    placeInstruction: 'Place QR 8 here · unlocks Stage 9',
    qrLabel: 'QR 8',
    points: 280,
    hint1: 'Contains chapters, indexes, and assigned syllabus readings.',
    hint2: 'Heavy book carried in backpacks before midterms.',
  },
  {
    no: 9,
    title: 'THE SUMMER OASIS',
    riddle: 'I give you water without asking questions. During summer, I become the most popular person on campus.',
    answer: 'Water Cooler',
    answerPlace: 'Science Block Ground Floor Water Dispenser',
    answerKey: 'WATER COOLER',
    placeInstruction: 'Place QR 9 here · unlocks Stage 10',
    qrLabel: 'QR 9',
    points: 300,
    hint1: 'Refill your water bottle here between classes.',
    hint2: 'Chills cold drinking water all day long.',
  },
  {
    no: 10,
    title: 'THE TEACHER CANVAS',
    riddle: "I have a board but I'm not a game. Teachers write on me, and students pretend to copy everything.",
    answer: 'Blackboard / Whiteboard',
    answerPlace: 'Lecture Hall 101 Front Presentation Board',
    answerKey: 'BLACKBOARD',
    placeInstruction: 'Place QR 10 here · ends the hunt',
    qrLabel: 'QR 10',
    points: 350,
    hint1: 'Chalk or dry-erase markers are used on this wide surface.',
    hint2: 'Positioned right behind the professor podium.',
  },
];

/**
 * Returns a configured list of College Clues tailored to the requested count (1 to 10).
 */
export function getCollegeDefaultClues(
  count: number = 8,
  eventId: string = 'evt-college'
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
  return COLLEGE_CAMPUS_DEFAULT_CLUES.slice(0, safeCount).map((item, idx) => ({
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
