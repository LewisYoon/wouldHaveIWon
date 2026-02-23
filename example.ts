import { generateQuickPick, compareNumbers } from '@/lib/lotto-utils.ts';

console.log("--- Oz Lotto Quick Pick Example ---");

// Generate a quick pick for the user
const userQuickPick = generateQuickPick();
console.log("Your Quick Pick:", userQuickPick);

// Simulate a draw
// For example purposes, let's create some fixed draw numbers and bonus numbers
// In a real scenario, these would come from an API or database
const drawNumbers: number[] = [3, 15, 22, 28, 30, 37, 41].sort((a, b) => a - b);
const bonusNumbers: number[] = [10, 25, 45].sort((a, b) => a - b);

console.log("Official Draw Numbers:", drawNumbers);
console.log("Official Bonus Numbers:", bonusNumbers);

// Compare user's numbers with draw numbers
const comparisonResult = compareNumbers(userQuickPick, drawNumbers, bonusNumbers);

console.log("\n--- Comparison Result ---");
console.log("Main Numbers Matched:", comparisonResult.mainMatchesCount);
console.log("Bonus Numbers Matched Count:", comparisonResult.bonusMatchesCount);
console.log("Matched Bonus Numbers:", comparisonResult.matchedBonusNumbers);
console.log("Prize Tier:", comparisonResult.prizeTier);

// --- Example with specific scenarios ---

console.log("\n--- Scenario Examples ---");

// Scenario 1: Division 1 (7 main matches)
const scenario1User = [3, 15, 22, 28, 30, 37, 41]; // All draw numbers
const scenario1Result = compareNumbers(scenario1User, drawNumbers, bonusNumbers);
console.log("\nScenario 1 (Div 1):", scenario1User, "->", scenario1Result.prizeTier);
console.assert(scenario1Result.prizeTier === "Division 1", "Scenario 1 Failed");

// Scenario 2: Division 2 (6 main, 1 bonus)
const scenario2User = [3, 15, 22, 28, 30, 37, 10]; // 6 draw, 1 bonus
const scenario2Result = compareNumbers(scenario2User, drawNumbers, bonusNumbers);
console.log("Scenario 2 (Div 2):", scenario2User, "->", scenario2Result.prizeTier);
console.assert(scenario2Result.prizeTier === "Division 2", "Scenario 2 Failed");

// Scenario 3: Division 3 (6 main)
const scenario3User = [3, 15, 22, 28, 30, 37, 1]; // 6 draw, no bonus
const scenario3Result = compareNumbers(scenario3User, drawNumbers, bonusNumbers);
console.log("Scenario 3 (Div 3):", scenario3User, "->", scenario3Result.prizeTier);
console.assert(scenario3Result.prizeTier === "Division 3", "Scenario 3 Failed");

// Scenario 4: Division 4 (5 main, 1 bonus)
const scenario4User = [3, 15, 22, 28, 30, 10, 2]; // 5 draw, 1 bonus
const scenario4Result = compareNumbers(scenario4User, drawNumbers, bonusNumbers);
console.log("Scenario 4 (Div 4):", scenario4User, "->", scenario4Result.prizeTier);
console.assert(scenario4Result.prizeTier === "Division 4", "Scenario 4 Failed");

// Scenario 5: Division 5 (5 main)
const scenario5User = [3, 15, 22, 28, 30, 1, 2]; // 5 draw, no bonus
const scenario5Result = compareNumbers(scenario5User, drawNumbers, bonusNumbers);
console.log("Scenario 5 (Div 5):", scenario5User, "->", scenario5Result.prizeTier);
console.assert(scenario5Result.prizeTier === "Division 5", "Scenario 5 Failed");

// Scenario 6: Division 6 (4 main)
const scenario6User = [3, 15, 22, 28, 1, 2, 4]; // 4 draw, no bonus
const scenario6Result = compareNumbers(scenario6User, drawNumbers, bonusNumbers);
console.log("Scenario 6 (Div 6):", scenario6User, "->", scenario6Result.prizeTier);
console.assert(scenario6Result.prizeTier === "Division 6", "Scenario 6 Failed");

// Scenario 7: Division 7 (3 main, 1 bonus)
const scenario7User = [3, 15, 22, 10, 1, 2, 4]; // 3 draw, 1 bonus
const scenario7Result = compareNumbers(scenario7User, drawNumbers, bonusNumbers);
console.log("Scenario 7 (Div 7):", scenario7User, "->", scenario7Result.prizeTier);
console.assert(scenario7Result.prizeTier === "Division 7", "Scenario 7 Failed");

// Scenario 8: No Prize
const scenario8User = [1, 2, 4, 5, 6, 7, 8]; // No prize
const scenario8Result = compareNumbers(scenario8User, drawNumbers, bonusNumbers);
console.log("Scenario 8 (No Prize):", scenario8User, "->", scenario8Result.prizeTier);
console.assert(scenario8Result.prizeTier === "No Prize", "Scenario 8 Failed");

console.log("\n--- Example usage finished ---");
