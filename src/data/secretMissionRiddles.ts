export interface SecretWordRiddle {
  id: string;
  riddle: string;
  answer: string;
  acceptedAnswers: string[];
}

export interface SecretNumberRiddle {
  id: string;
  title: string;
  riddle: string;
  answer: string;
  digitsCount: number;
}

export interface Paired5DigitMission {
  id: string;
  riddleA: SecretNumberRiddle;
  riddleB: SecretNumberRiddle;
  combinedCode: string; // Exactly 5 digits
}

export interface SecretMissionOutcome {
  eventId: string;
  submittedAt: string;
  wordRiddle: {
    riddle: string;
    submittedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  };
  numberMission: {
    riddleATitle: string;
    riddleARiddle: string;
    riddleAAnswer: string;
    riddleBTitle: string;
    riddleBRiddle: string;
    riddleBAnswer: string;
    submittedCode: string;
    correctCode: string;
    isCorrect: boolean;
  };
  bonusAwarded: number;
}

export const SECRET_WORD_RIDDLES: SecretWordRiddle[] = [
  {
    id: 'wr-1',
    riddle: 'I have many teeth but cannot bite. What am I?',
    answer: 'A comb',
    acceptedAnswers: ['A COMB', 'COMB', 'THE COMB'],
  },
  {
    id: 'wr-2',
    riddle: 'I go up but never come down. What am I?',
    answer: 'Your age',
    acceptedAnswers: ['YOUR AGE', 'AGE', 'MY AGE', 'AN AGE'],
  },
  {
    id: 'wr-3',
    riddle: 'I have hands but cannot clap. What am I?',
    answer: 'A clock',
    acceptedAnswers: ['A CLOCK', 'CLOCK', 'WATCH', 'A WATCH', 'THE CLOCK'],
  },
  {
    id: 'wr-4',
    riddle: 'I follow you everywhere, but disappear when the lights go out. What am I?',
    answer: 'Your shadow',
    acceptedAnswers: ['YOUR SHADOW', 'SHADOW', 'MY SHADOW', 'A SHADOW', 'THE SHADOW'],
  },
  {
    id: 'wr-5',
    riddle: 'What gets bigger the more you share it?',
    answer: 'Knowledge',
    acceptedAnswers: ['KNOWLEDGE', 'LOVE', 'HAPPINESS'],
  },
  {
    id: 'wr-6',
    riddle: 'I have cities but no houses, forests but no trees, and rivers but no water. What am I?',
    answer: 'A map',
    acceptedAnswers: ['A MAP', 'MAP', 'THE MAP', 'ATLAS'],
  },
  {
    id: 'wr-7',
    riddle: 'What belongs to you, but other people use it more than you do?',
    answer: 'Your name',
    acceptedAnswers: ['YOUR NAME', 'NAME', 'MY NAME'],
  },
  {
    id: 'wr-8',
    riddle: 'I can fill an entire room but take up no space. What am I?',
    answer: 'Light',
    acceptedAnswers: ['LIGHT', 'A LIGHT', 'THE LIGHT', 'SUNLIGHT'],
  },
];

export const NUMBER_RIDDLES: Record<string, SecretNumberRiddle> = {
  age: {
    id: 'nr-1',
    title: 'The Secret Age',
    riddle: 'I am a two-digit number. My digits add up to 9. If you reverse me, the new number is 27 less than me. Who am I?',
    answer: '63',
    digitsCount: 2,
  },
  missing: {
    id: 'nr-2',
    title: 'The Missing Number',
    riddle: 'I am greater than 20 but smaller than 30. I am divisible by both 3 and 4. Who am I?',
    answer: '24',
    digitsCount: 2,
  },
  mysterious: {
    id: 'nr-3',
    title: 'The Mysterious Number',
    riddle: 'Multiply me by myself and you get 144. I am smaller than 15. Who am I?',
    answer: '12',
    digitsCount: 2,
  },
  pair: {
    id: 'nr-4',
    title: 'The Secret Pair',
    riddle: 'I am a two-digit number. My first digit is twice my second digit, and both digits add up to 9. Who am I?',
    answer: '63',
    digitsCount: 2,
  },
  birthday: {
    id: 'nr-5',
    title: 'The Birthday Mystery',
    riddle: 'If yesterday was 15 days before the end of the month, and today is the 17th, what date will it be after 5 days?',
    answer: '22',
    digitsCount: 2,
  },
  thief: {
    id: 'nr-6',
    title: 'The Number Thief',
    riddle: 'I stole 5 from a number, doubled what remained, and got 30. What was the original number?',
    answer: '20',
    digitsCount: 2,
  },
  password: {
    id: 'nr-7',
    title: 'The Secret Password',
    riddle: 'I am a three-digit number. My hundreds digit is 2, my tens digit is twice my hundreds digit, and my units digit is the sum of both. Who am I?',
    answer: '246',
    digitsCount: 3,
  },
  clock: {
    id: 'nr-8',
    title: 'The Clock Mystery',
    riddle: 'When the clock strikes 3, how many degrees does the minute hand travel before the clock strikes 4?',
    answer: '360',
    digitsCount: 3,
  },
};

export const PAIRED_5DIGIT_MISSIONS: Paired5DigitMission[] = [
  {
    id: 'pair-1',
    riddleA: NUMBER_RIDDLES.age, // 63 (2 digits)
    riddleB: NUMBER_RIDDLES.password, // 246 (3 digits)
    combinedCode: '63246',
  },
  {
    id: 'pair-2',
    riddleA: NUMBER_RIDDLES.missing, // 24 (2 digits)
    riddleB: NUMBER_RIDDLES.clock, // 360 (3 digits)
    combinedCode: '24360',
  },
  {
    id: 'pair-3',
    riddleA: NUMBER_RIDDLES.clock, // 360 (3 digits)
    riddleB: NUMBER_RIDDLES.missing, // 24 (2 digits)
    combinedCode: '36024',
  },
  {
    id: 'pair-4',
    riddleA: NUMBER_RIDDLES.birthday, // 22 (2 digits)
    riddleB: NUMBER_RIDDLES.password, // 246 (3 digits)
    combinedCode: '22246',
  },
  {
    id: 'pair-5',
    riddleA: NUMBER_RIDDLES.thief, // 20 (2 digits)
    riddleB: NUMBER_RIDDLES.clock, // 360 (3 digits)
    combinedCode: '20360',
  },
  {
    id: 'pair-6',
    riddleA: NUMBER_RIDDLES.mysterious, // 12 (2 digits)
    riddleB: NUMBER_RIDDLES.password, // 246 (3 digits)
    combinedCode: '12246',
  },
  {
    id: 'pair-7',
    riddleA: NUMBER_RIDDLES.pair, // 63 (2 digits)
    riddleB: NUMBER_RIDDLES.clock, // 360 (3 digits)
    combinedCode: '63360',
  },
];

export function getRandomWordRiddle(seedIndex: number = 0): SecretWordRiddle {
  const index = Math.abs(seedIndex) % SECRET_WORD_RIDDLES.length;
  return SECRET_WORD_RIDDLES[index];
}

export function getRandom5DigitPair(seedIndex: number = 0): Paired5DigitMission {
  const index = Math.abs(seedIndex) % PAIRED_5DIGIT_MISSIONS.length;
  return PAIRED_5DIGIT_MISSIONS[index];
}

export function validateWordAnswer(riddle: SecretWordRiddle, input: string): boolean {
  if (!input) return false;
  const cleanInput = input.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  return riddle.acceptedAnswers.some((ans) => {
    const cleanAns = ans.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
    return cleanInput === cleanAns || cleanInput.includes(cleanAns) || cleanAns.includes(cleanInput);
  });
}

const OUTCOME_STORAGE_KEY = 'campus_secret_mission_outcome';

export function saveSecretMissionOutcome(outcome: SecretMissionOutcome) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(OUTCOME_STORAGE_KEY, JSON.stringify(outcome));
      localStorage.setItem(`${OUTCOME_STORAGE_KEY}_${outcome.eventId}`, JSON.stringify(outcome));
    }
  } catch (e) {}
}

export function getSecretMissionOutcome(eventId?: string): SecretMissionOutcome | null {
  try {
    if (typeof localStorage !== 'undefined') {
      if (eventId) {
        const byEvent = localStorage.getItem(`${OUTCOME_STORAGE_KEY}_${eventId}`);
        if (byEvent) return JSON.parse(byEvent);
      }
      const generic = localStorage.getItem(OUTCOME_STORAGE_KEY);
      if (generic) return JSON.parse(generic);
    }
  } catch (e) {}
  return null;
}
