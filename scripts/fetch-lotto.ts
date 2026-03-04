// scripts/fetch-lotto.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local only if not already set (e.g., local development)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Supabase URL or Service Role Key is missing!');
  console.log('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in environment or .env.local');
  process.exit(1);
}

// Use Service Role Key to bypass RLS for background tasks
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fetchLatestResults() {
  console.log('Fetching latest Oz Lotto results...');
  
  try {
    const response = await fetch('https://data.api.thelott.com/sales/vmax/web/data/lotto/latestresults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        CompanyId: 'GoldenCasket',
        MaxDrawCount: 1,
        OptionalProductFilter: ['OzLotto'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from external API: ${response.statusText}`);
    }

    const data: any = await response.json();
    if (!data.Success || !data.DrawResults || data.DrawResults.length === 0) {
      console.log('No draw results found');
      return;
    }

    const latestDraw = data.DrawResults[0];
    const drawNumber = latestDraw.DrawNumber;
    const drawDate = latestDraw.DrawDate.split('T')[0];
    const primaryNumbers = latestDraw.PrimaryNumbers;
    const secondaryNumbers = latestDraw.SecondaryNumbers;

    // Transform dividends
    const prizes: Record<string, number> = {};
    latestDraw.Dividends.forEach((div: any) => {
      prizes[`Division ${div.Division}`] = div.BlocDividend;
    });
    prizes['No Prize'] = 0;

    // Check if exists
    const { data: existingDraw, error: checkError } = await supabase
      .from('draw_results')
      .select('id')
      .eq('draw_number', drawNumber)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingDraw) {
      console.log(`Draw #${drawNumber} (${drawDate}) already exists in database.`);
      return;
    }

    // Insert
    const { error: insertError } = await supabase
      .from('draw_results')
      .insert({
        draw_number: drawNumber,
        draw_date: drawDate,
        game: 'Oz Lotto',
        numbers: primaryNumbers,
        bonus: secondaryNumbers,
        prizes: prizes,
      });

    if (insertError) throw insertError;

    console.log(`Successfully saved Draw #${drawNumber} (${drawDate})`);

  } catch (error: any) {
    console.error('Error fetching/saving lotto results:', error.message);
    process.exit(1);
  }
}

fetchLatestResults();
