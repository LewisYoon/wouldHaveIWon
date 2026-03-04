// lotto-project/lib/lotto-utils.ts

export function getNextDrawDates(count: number = 5): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  // Find the next Tuesday
  let nextTuesday = new Date(today);
  nextTuesday.setHours(0, 0, 0, 0); // Reset time to midnight local
  nextTuesday.setDate(today.getDate() + ((7 - today.getDay() + 2) % 7));
  
  // If today is Tuesday and it's past 8:30 PM, the next draw is next week
  const isTuesday = today.getDay() === 2;
  const isPastDrawTime = today.getHours() > 20 || (today.getHours() === 20 && today.getMinutes() >= 30);
  
  if (isTuesday && isPastDrawTime) {
    nextTuesday.setDate(nextTuesday.getDate() + 7);
  } else if (isTuesday && !isPastDrawTime) {
    // Keep today's date if it's Tuesday but before 8:30 PM
    nextTuesday = new Date(today);
    nextTuesday.setHours(0, 0, 0, 0);
  }

  for (let i = 0; i < count; i++) {
    const d = new Date(nextTuesday);
    d.setDate(nextTuesday.getDate() + (i * 7));
    
    // Format to YYYY-MM-DD using local time
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
}

export function generateQuickPick(): number[] {
  const quickPick = new Set<number>();
  while (quickPick.size < 7) {
    const randomNumber = Math.floor(Math.random() * 47) + 1; // Changed range to 1-47
    quickPick.add(randomNumber);
  }
  return Array.from(quickPick).sort((a, b) => a - b);
}

export interface ComparisonResult {
  mainMatchesCount: number;
  bonusMatchesCount: number;
  matchedBonusNumbers: number[];
  prizeTier: string;
}

export function compareNumbers(
  userNumbers: number[],
  drawNumbers: number[],
  bonusNumbers: number[]
): ComparisonResult {
  const userSet = new Set(userNumbers);
  const drawSet = new Set(drawNumbers);
  const bonusSet = new Set(bonusNumbers);

  let mainMatchesCount = 0;
  const matchedBonusNumbers: number[] = [];

  // Count main matches
  for (const num of userSet) {
    if (drawSet.has(num)) {
      mainMatchesCount++;
    }
  }

  // Find bonus matches
  for (const num of userSet) {
    if (bonusSet.has(num) && !drawSet.has(num)) { // A number can only be a bonus match if it's not a main match
      matchedBonusNumbers.push(num);
    }
  }
  const bonusMatchesCount = matchedBonusNumbers.length;

  let prizeTier: string = "No Prize";

  // Determine prize tier based on Oz Lotto rules
  if (mainMatchesCount === 7) {
    prizeTier = "Division 1";
  } else if (mainMatchesCount === 6 && bonusMatchesCount >= 1) {
    prizeTier = "Division 2";
  } else if (mainMatchesCount === 6) {
    prizeTier = "Division 3";
  } else if (mainMatchesCount === 5 && bonusMatchesCount >= 1) {
    prizeTier = "Division 4";
  } else if (mainMatchesCount === 5) {
    prizeTier = "Division 5";
  } else if (mainMatchesCount === 4) {
    prizeTier = "Division 6";
  } else if (mainMatchesCount === 3 && bonusMatchesCount >= 1) {
    prizeTier = "Division 7";
  }

  return {
    mainMatchesCount,
    bonusMatchesCount,
    matchedBonusNumbers: matchedBonusNumbers.sort((a, b) => a - b),
    prizeTier,
  };
}
