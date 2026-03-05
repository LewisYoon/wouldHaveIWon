// lotto-project/example.ts

import { getNextDrawDates, generateQuickPick, compareNumbers } from './lib/lotto-utils';

// Get upcoming draw dates for Oz Lotto
const upcomingOzLotto = getNextDrawDates(3, 'Oz Lotto');
console.log("--- Upcoming Oz Lotto Draws ---");
console.log(upcomingOzLotto);

// Generate a quick pick for Powerball
const powerballQuickPick = generateQuickPick('Powerball');
console.log("\n--- Powerball Quick Pick ---");
console.log(powerballQuickPick);

// Simulate comparing a user's numbers to a draw
const userQuickPick = generateQuickPick('Oz Lotto');
const drawNumbers = [5, 12, 19, 23, 33, 37, 45];
const bonusNumbers = [8, 16, 21];

// Compare user's numbers with draw numbers
const comparisonResult = compareNumbers(userQuickPick, drawNumbers, bonusNumbers, 'Oz Lotto');

console.log("\n--- Comparison Result ---");
console.log("Main Numbers Matched:", comparisonResult.mainMatchesCount);
console.log("Bonus Numbers Matched:", comparisonResult.bonusMatchesCount);
console.log("Matched Bonus Numbers:", comparisonResult.matchedBonusNumbers);
console.log("Prize Tier:", comparisonResult.prizeTier);

// Example for Powerball
const userPowerballPick = generateQuickPick('Powerball');
const drawPowerballNumbers = [1, 2, 3, 4, 5, 6, 7];
const drawPowerballBonus = [10];
const powerballResult = compareNumbers(userPowerballPick, drawPowerballNumbers, drawPowerballBonus, 'Powerball');
console.log("\n--- Powerball Comparison ---");
console.log("Main Matched:", powerballResult.mainMatchesCount);
console.log("Powerball Matched:", powerballResult.isPowerballMatched);
console.log("Prize:", powerballResult.prizeTier);
