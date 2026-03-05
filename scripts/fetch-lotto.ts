// scripts/fetch-lotto.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { Resend } from 'resend';
import { compareNumbers } from '../lib/lotto-utils';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing required environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function notifyUsers(game: string, drawDate: string, winningNumbers: number[], bonusNumbers: number[]) {
  if (!resend) return;

  console.log(`Checking notifications for ${game} on ${drawDate}...`);

  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .select(`user_id, numbers`)
    .eq('draw_date', drawDate)
    .eq('game', game);

  if (ticketError || !tickets?.length) {
    console.log(`No tickets found for ${game} on ${drawDate}.`);
    return;
  }

  // 1. Group results by user
  const userResults = new Map<string, { won: boolean }>();
  for (const ticket of tickets) {
    const result = compareNumbers(ticket.numbers, winningNumbers, bonusNumbers, game as any);
    const current = userResults.get(ticket.user_id) || { won: false };
    userResults.set(ticket.user_id, { won: current.won || result.prizeTier !== "No Prize" });
  }

  const userIds = Array.from(userResults.keys());
  const emailBatch: any[] = [];

  // 2. Fetch user emails and prepare batch
  // Note: We process in small chunks to avoid Supabase Auth rate limits
  const chunkSize = 20;
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    const userPromises = chunk.map(id => supabase.auth.admin.getUserById(id));
    const results = await Promise.all(userPromises);

    for (let j = 0; j < results.length; j++) {
      const { data: { user } } = results[j];
      const userId = chunk[j];
      const status = userResults.get(userId);

      if (user?.email && status) {
        const subject = status.won ? `🎉 You are a ${game} winner!` : `${game} Results are Out!`;
        const message = status.won 
          ? `Great news! One of your tickets for the ${drawDate} ${game} draw has won a prize. Visit WhatIFLotto to check your division!`
          : `The ${game} results for ${drawDate} are now available. Visit WhatIFLotto to see how your tickets performed.`;

        emailBatch.push({
          from: 'WhatIFLotto <notifications@whatiflotto.com>',
          to: user.email,
          subject: subject,
          text: message,
        });
      }
    }
  }

  // 3. Send emails in batches of 100 (Resend limit)
  for (let i = 0; i < emailBatch.length; i += 100) {
    const batch = emailBatch.slice(i, i + 100);
    try {
      await resend.batch.send(batch);
      console.log(`Successfully sent batch of ${batch.length} ${game} notifications.`);
    } catch (e) {
      console.error(`Failed to send email batch:`, e);
    }
  }
}

async function fetchGame(game: 'OzLotto' | 'Powerball') {
  console.log(`Fetching latest ${game} results...`);
  const displayName = game === 'OzLotto' ? 'Oz Lotto' : 'Powerball';
  
  try {
    const response = await fetch('https://data.api.thelott.com/sales/vmax/web/data/lotto/latestresults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.thelott.com',
        'Referer': 'https://www.thelott.com/'
      },
      body: JSON.stringify({
        CompanyId: 'GoldenCasket',
        MaxDrawCount: 1,
        OptionalProductFilter: [game],
      }),
    });

    const data: any = await response.json();
    if (!data.Success || !data.DrawResults?.length) return;

    const latest = data.DrawResults[0];
    const drawNumber = latest.DrawNumber;
    const drawDate = latest.DrawDate.split('T')[0];

    const { data: existing } = await supabase.from('draw_results').select('id').eq('draw_number', drawNumber).eq('game', displayName).maybeSingle();
    if (existing) {
      console.log(`${displayName} Draw #${drawNumber} already exists.`);
      return;
    }

    const prizes: Record<string, number> = {};
    latest.Dividends.forEach((div: any) => {
      prizes[`Division ${div.Division}`] = div.BlocDividend;
    });
    prizes['No Prize'] = 0;

    const { error: insertError } = await supabase.from('draw_results').insert({
      draw_number: drawNumber,
      draw_date: drawDate,
      game: displayName,
      numbers: latest.PrimaryNumbers,
      bonus: latest.SecondaryNumbers,
      prizes: prizes,
    });

    if (insertError) throw insertError;
    console.log(`Successfully saved ${displayName} Draw #${drawNumber}`);

    await notifyUsers(displayName, drawDate, latest.PrimaryNumbers, latest.SecondaryNumbers);

  } catch (error: any) {
    console.error(`Error fetching ${game}:`, error.message);
  }
}

async function run() {
  await fetchGame('OzLotto');
  await fetchGame('Powerball');
}

run();
