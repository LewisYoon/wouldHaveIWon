// lotto-project/lib/lotto-utils.ts

import type { DrawResult, ComparisonResult } from '../types/lotto';


export const TICKET_COST = 1.45;

export interface Ticket {
  id: string;
  drawDate: string;
  numbers: number[];
  game: string;
}

/**
 * Oz Lotto: Tuesdays
 * Powerball: Thursdays
 * Tatts Lotto: Saturdays
 */
export function getNextDrawDates(count: number = 5, game: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto' = 'Oz Lotto'): string[] {
  const dates: string[] = [];
  const today = new Date();
  let targetDay = 2; // Default Oz Lotto (Tuesday)
  
  if (game === 'Powerball') targetDay = 4; // Thursday
  if (game === 'Tatts Lotto') targetDay = 6; // Saturday
  
  let lastDraw = new Date(today);
  lastDraw.setHours(0, 0, 0, 0);
  
  let diffToLast = (today.getDay() - targetDay + 7) % 7;
  
  const isDrawDay = today.getDay() === targetDay;
  const isPastDrawTime = today.getHours() > 20 || (today.getHours() === 20 && today.getMinutes() >= 30);
  
  if (isDrawDay && !isPastDrawTime) {
    diffToLast = 7;
  } else if (diffToLast === 0 && isPastDrawTime) {
    diffToLast = 0;
  }

  lastDraw.setDate(today.getDate() - diffToLast);
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  dates.push(formatDate(lastDraw));

  let nextDraw = new Date(lastDraw);
  for (let i = 1; i <= count; i++) {
    const d = new Date(nextDraw);
    d.setDate(nextDraw.getDate() + (i * 7));
    dates.push(formatDate(d));
  }
  
  return dates;
}

/**
 * Oz Lotto: 7 numbers from 1-47
 * Powerball: 7 numbers from 1-35 + 1 Powerball from 1-20
 * Tatts Lotto: 6 numbers from 1-45
 */
export function generateQuickPick(game: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto' = 'Oz Lotto'): number[] {
  if (game === 'Oz Lotto') {
    const quickPick = new Set<number>();
    while (quickPick.size < 7) {
      quickPick.add(Math.floor(Math.random() * 47) + 1);
    }
    return Array.from(quickPick).sort((a, b) => a - b);
  } else if (game === 'Tatts Lotto') {
    const quickPick = new Set<number>();
    while (quickPick.size < 6) {
      quickPick.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(quickPick).sort((a, b) => a - b);
  } else {
    // Powerball
    const mainNumbers = new Set<number>();
    while (mainNumbers.size < 7) {
      mainNumbers.add(Math.floor(Math.random() * 35) + 1);
    }
    const powerball = Math.floor(Math.random() * 20) + 1;
    return [...Array.from(mainNumbers).sort((a, b) => a - b), powerball];
  }
}

/**
 * Generates a full random draw (Main + Bonus) for simulation
 */
export function generateRandomDraw(game: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto'): { numbers: number[], bonus: number[] } {
  if (game === 'Oz Lotto') {
    const pool = Array.from({ length: 47 }, (_, i) => i + 1);
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return {
      numbers: shuffled.slice(0, 7).sort((a, b) => a - b),
      bonus: shuffled.slice(7, 10).sort((a, b) => a - b) // 3 Supps
    };
  } else if (game === 'Tatts Lotto') {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return {
      numbers: shuffled.slice(0, 6).sort((a, b) => a - b),
      bonus: shuffled.slice(6, 8).sort((a, b) => a - b) // 2 Supps
    };
  } else {
    // Powerball
    const pool = Array.from({ length: 35 }, (_, i) => i + 1);
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const pb = Math.floor(Math.random() * 20) + 1;
    return {
      numbers: shuffled.slice(0, 7).sort((a, b) => a - b),
      bonus: [pb]
    };
  }
}

/**
 * Comparison logic for all games
 */
export function compareNumbers(
  userNumbers: number[],
  drawNumbers: number[],
  bonusNumbers: number[], 
  game: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto'
): ComparisonResult {
  const userSet = new Set(game === 'Powerball' ? userNumbers.slice(0, 7) : userNumbers);
  const drawSet = new Set(drawNumbers);

  let mainMatchesCount = 0;
  for (const num of userSet) {
    if (drawSet.has(num)) mainMatchesCount++;
  }

  if (game === 'Oz Lotto') {
    const bonusSet = new Set(bonusNumbers);
    const matchedBonusNumbers: number[] = [];
    for (const num of userNumbers) {
      if (bonusSet.has(num) && !drawSet.has(num)) {
        matchedBonusNumbers.push(num);
      }
    }
    const bonusMatchesCount = matchedBonusNumbers.length;
    let prizeTier = "No Prize";

    if (mainMatchesCount === 7) prizeTier = "Division 1";
    else if (mainMatchesCount === 6 && bonusMatchesCount >= 1) prizeTier = "Division 2";
    else if (mainMatchesCount === 6) prizeTier = "Division 3";
    else if (mainMatchesCount === 5 && bonusMatchesCount >= 1) prizeTier = "Division 4";
    else if (mainMatchesCount === 5) prizeTier = "Division 5";
    else if (mainMatchesCount === 4) prizeTier = "Division 6";
    else if (mainMatchesCount === 3 && bonusMatchesCount >= 1) prizeTier = "Division 7";

    return { mainMatchesCount, bonusMatchesCount, matchedBonusNumbers: matchedBonusNumbers.sort((a, b) => a - b), prizeTier };
  } else if (game === 'Tatts Lotto') {
    const bonusSet = new Set(bonusNumbers);
    const matchedBonusNumbers: number[] = [];
    for (const num of userNumbers) {
      if (bonusSet.has(num) && !drawSet.has(num)) {
        matchedBonusNumbers.push(num);
      }
    }
    const bonusMatchesCount = matchedBonusNumbers.length;
    let prizeTier = "No Prize";

    if (mainMatchesCount === 6) prizeTier = "Division 1";
    else if (mainMatchesCount === 5 && bonusMatchesCount >= 1) prizeTier = "Division 2";
    else if (mainMatchesCount === 5) prizeTier = "Division 3";
    else if (mainMatchesCount === 4) prizeTier = "Division 4";
    else if (mainMatchesCount === 3 && bonusMatchesCount >= 1) prizeTier = "Division 5";
    else if (mainMatchesCount === 3) prizeTier = "Division 6";

    return { mainMatchesCount, bonusMatchesCount, matchedBonusNumbers: matchedBonusNumbers.sort((a, b) => a - b), prizeTier };
  } else {
    // Powerball
    const userPB = userNumbers[7];
    const drawPB = bonusNumbers[0];
    const isPowerballMatched = userPB === drawPB;
    let prizeTier = "No Prize";

    if (mainMatchesCount === 7 && isPowerballMatched) prizeTier = "Division 1";
    else if (mainMatchesCount === 7) prizeTier = "Division 2";
    else if (mainMatchesCount === 6 && isPowerballMatched) prizeTier = "Division 3";
    else if (mainMatchesCount === 6) prizeTier = "Division 4";
    else if (mainMatchesCount === 5 && isPowerballMatched) prizeTier = "Division 5";
    else if (mainMatchesCount === 4 && isPowerballMatched) prizeTier = "Division 6";
    else if (mainMatchesCount === 5) prizeTier = "Division 7";
    else if (mainMatchesCount === 3 && isPowerballMatched) prizeTier = "Division 8";
    else if (mainMatchesCount === 2 && isPowerballMatched) prizeTier = "Division 9";

    return { mainMatchesCount, bonusMatchesCount: isPowerballMatched ? 1 : 0, matchedBonusNumbers: isPowerballMatched ? [userPB] : [], prizeTier, isPowerballMatched };
  }
}

/**
 * Mock estimated average prizes for simulation mode
 */
export const ESTIMATED_PRIZES: Record<string, Record<string, number>> = {
  'Oz Lotto': {
    'Division 1': 10000000,
    'Division 2': 45000,
    'Division 3': 5000,
    'Division 4': 400,
    'Division 5': 50,
    'Division 6': 25,
    'Division 7': 15
  },
  'Powerball': {
    'Division 1': 20000000,
    'Division 2': 100000,
    'Division 3': 10000,
    'Division 4': 500,
    'Division 5': 150,
    'Division 6': 75,
    'Division 7': 45,
    'Division 8': 20,
    'Division 9': 12
  },
  'Tatts Lotto': {
    'Division 1': 1000000,
    'Division 2': 10000,
    'Division 3': 800,
    'Division 4': 30,
    'Division 5': 20,
    'Division 6': 10
  }
};
