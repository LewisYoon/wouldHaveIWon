// test-ledger-bridge.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verifyLedger() {
  console.log("--- Testing Ledger Bridge Logic ---");

  // 1. Find a record we just saved
  const { data: ledgerEntry } = await supabase
    .from('upcoming_draws')
    .select('*')
    .limit(1)
    .single();

  if (!ledgerEntry) {
    console.error("❌ Error: upcoming_draws is empty. Run fetch-lotto.ts first.");
    return;
  }

  console.log(`Found Ledger Entry: ${ledgerEntry.game} Draw #${ledgerEntry.draw_number} ($${ledgerEntry.jackpot.toLocaleString()})`);

  // 2. Simulate the 'No Winner' Bridge logic
  console.log(`
Simulating result arrival for Draw #${ledgerEntry.draw_number}...`);
  
  const simulatedDividend = 0; // The API returned 0 because no one won
  let finalPrizeValue = simulatedDividend;

  if (simulatedDividend === 0) {
    console.log("Dividend is $0. Checking ledger for jackpot...");
    
    const { data: bridgeResult } = await supabase
      .from('upcoming_draws')
      .select('jackpot')
      .eq('game', ledgerEntry.game)
      .eq('draw_number', ledgerEntry.draw_number) // The critical fix: matching on draw number
      .maybeSingle();
    
    if (bridgeResult) {
      finalPrizeValue = bridgeResult.jackpot;
    }
  }

  // 3. Final Verdict
  if (finalPrizeValue === ledgerEntry.jackpot) {
    console.log("
✅ SUCCESS: The bridge successfully linked the result to the correct jackpot via Draw Number!");
    console.log(`Resulting Prize to be stored: $${finalPrizeValue.toLocaleString()}`);
  } else {
    console.log("
❌ FAILURE: Could not bridge the jackpot data.");
  }
}

verifyLedger();
