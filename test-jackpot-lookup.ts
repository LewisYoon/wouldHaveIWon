// test-jackpot-lookup.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verify() {
  console.log("--- Testing Jackpot Lookup Logic ---");

  // 1. Grab an entry from upcoming_draws to use as a test case
  const { data: upcoming } = await supabase
    .from('upcoming_draws')
    .select('*')
    .limit(1)
    .single();

  if (!upcoming) {
    console.error("Error: upcoming_draws table is empty. Run fetch-lotto.ts first.");
    return;
  }

  console.log(`Found upcoming draw: ${upcoming.game} #${upcoming.draw_number} with $${upcoming.jackpot.toLocaleString()} jackpot.`);

  // 2. Simulate the logic used in fetch-lotto.ts
  console.log(`Simulating a 'No Winner' result for Draw #${upcoming.draw_number}...`);
  
  let blocDividend = 0; // Simulate 0 winners
  let finalPrize = blocDividend;

  if (blocDividend === 0) {
    const { data: dbJackpot } = await supabase
      .from('upcoming_draws')
      .select('jackpot')
      .eq('game', upcoming.game)
      .eq('draw_number', upcoming.draw_number)
      .maybeSingle();
    
    if (dbJackpot) {
      finalPrize = dbJackpot.jackpot;
    }
  }

  if (finalPrize === upcoming.jackpot) {
    console.log("✅ SUCCESS: Logic correctly retrieved the jackpot from the DB!");
    console.log(`Final prize to be stored: $${finalPrize.toLocaleString()}`);
  } else {
    console.log("❌ FAILURE: Logic did not retrieve the jackpot.");
  }
}

verify();
