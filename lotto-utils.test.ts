import { generateQuickPick } from './lib/lotto-utils.ts';

function runTests() {
  console.log('Running generateQuickPick tests...');

  // Test 1: Returns an array of 6 numbers
  const pick1 = generateQuickPick();
  console.assert(pick1.length === 7, `Test 1 Failed: Expected 7 numbers, got ${pick1.length}`);

  // Test 2: All numbers are between 1 and 45
  const pick2 = generateQuickPick();
  const allInRange = pick2.every(num => num >= 1 && num <= 45);
  console.assert(allInRange, `Test 2 Failed: Not all numbers are within range [1, 45]. Pick: ${pick2}`);

  // Test 3: All numbers are unique
  const pick3 = generateQuickPick();
  const uniqueSet = new Set(pick3);
  console.assert(uniqueSet.size === 7, `Test 3 Failed: Numbers are not unique. Pick: ${pick3}`);

  // Test 4: Numbers are sorted in ascending order
  const pick4 = generateQuickPick();
  const isSorted = pick4.every((num, i) => i === 0 || num >= pick4[i - 1]);
  console.assert(isSorted, `Test 4 Failed: Numbers are not sorted. Pick: ${pick4}`);

  // Test 5: Run multiple times to check consistency (probabilistic check for uniqueness/range)
  for (let i = 0; i < 100; i++) {
    const pick = generateQuickPick();
    console.assert(pick.length === 7, `Test 5.${i} Failed (length): Expected 7, got ${pick.length}`);
    console.assert(pick.every(num => num >= 1 && num <= 45), `Test 5.${i} Failed (range): Pick: ${pick}`);
    console.assert(new Set(pick).size === 7, `Test 5.${i} Failed (unique): Pick: ${pick}`);
    console.assert(pick.every((num, idx) => idx === 0 || num >= pick[idx - 1]), `Test 5.${i} Failed (sorted): Pick: ${pick}`);
  }

  console.log('generateQuickPick tests finished.');
}

runTests();
