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
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whatiflotto.com';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing required environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Global cache for upcoming jackpot amounts
const jackpotCache = new Map<string, number>();

function getEmailTemplate(game: string, drawDate: string, status: { won: boolean }) {
  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandColor = isOz ? '#10b981' : isTatts ? '#ef4444' : '#4f46e5'; 
  
  const title = status.won ? `You've got a match!` : `The results are in`;
  const heroText = status.won 
    ? `Hey! Great news—one of your tracked sets for the ${game} draw on ${drawDate} just matched some winning numbers. Log in to see which division you hit!`
    : `The official ${game} results for ${drawDate} are out. We've updated your archive so you can see how your lucky numbers performed this time around.`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${game} Results</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f4f7f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; border: 1px solid #e1e8ed; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { padding: 40px 30px 20px; text-align: center; }
        .content { padding: 0 40px 40px; text-align: center; }
        .footer { padding: 30px; text-align: center; font-size: 13px; color: #8899a6; background: #f8f9fa; line-height: 1.6; }
        .btn { display: inline-block; padding: 16px 36px; background: ${brandColor}; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 800; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em; }
        h1 { color: #14171a; font-size: 28px; font-weight: 900; margin-bottom: 20px; tracking: -0.02em; }
        p { color: #4b5563; font-size: 17px; line-height: 1.6; margin-bottom: 36px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-weight: 900; font-size: 22px; color: #14171a; letter-spacing: -0.04em; text-transform: uppercase;">WhatIF<span style="color: ${brandColor};">Lotto</span></div>
        </div>
        <div class="content">
          <h1>${title}</h1>
          <p>${heroText}</p>
          <a href="${siteUrl}/luck" class="btn">Check My Numbers</a>
        </div>
        <div class="footer">
          Sent by WhatIFLotto Australia<br>
          Helping you track your luck, every week.<br><br>
          <a href="${siteUrl}/privacy" style="color: #8899a6; text-decoration: underline;">Privacy</a> • <a href="${siteUrl}/unsubscribe" style="color: #8899a6; text-decoration: underline;">Unsubscribe</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function notifyUsers(game: string, drawDate: string, winningNumbers: number[], bonusNumbers: number[]) {
  if (!resend) return;

  const { data: tickets } = await supabase
    .from('tickets')
    .select(`user_id, numbers`)
    .eq('draw_date', drawDate)
    .eq('game', game);

  if (!tickets?.length) return;

  const userResults = new Map<string, { won: boolean }>();
  for (const ticket of tickets) {
    const result = compareNumbers(ticket.numbers, winningNumbers, bonusNumbers, game as any);
    const current = userResults.get(ticket.user_id) || { won: false };
    userResults.set(ticket.user_id, { won: current.won || result.prizeTier !== "No Prize" });
  }

  const emailBatch: any[] = [];
  const userIds = Array.from(userResults.keys());

  for (let i = 0; i < userIds.length; i += 20) {
    const chunk = userIds.slice(i, i + 20);
    const results = await Promise.all(chunk.map(id => supabase.auth.admin.getUserById(id)));

    for (let j = 0; j < results.length; j++) {
      const { data: { user } } = results[j];
      const status = userResults.get(chunk[j]);

      if (user?.email && status) {
        const subject = status.won ? `You hit a match in the ${game}` : `The ${game} results are ready for you`;
        
        emailBatch.push({
          from: 'WhatIFLotto <notifications@whatiflotto.com>',
          to: user.email,
          subject: subject,
          html: getEmailTemplate(game, drawDate, status),
          text: status.won 
            ? `You've got a match! One of your tracked sets for the ${game} draw on ${drawDate} won a prize. Check it here: ${siteUrl}/luck`
            : `The ${game} results for ${drawDate} are now available. See how you did here: ${siteUrl}/luck`,
          headers: { 'List-Unsubscribe': `<${siteUrl}/unsubscribe>` }
        });
      }
    }
  }

  for (let i = 0; i < emailBatch.length; i += 100) {
    await resend.batch.send(emailBatch.slice(i, i + 100));
  }
}

async function fetchUpcomingDraws() {
  console.log('Fetching all upcoming draws...');
  try {
    const response = await fetch('https://data.api.thelott.com/sales/vmax/web/data/lotto/opendraws', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.thelott.com',
        'Referer': 'https://www.thelott.com/'
      },
      body: JSON.stringify({ CompanyId: 'GoldenCasket', OptionalProductFilter: ['OzLotto', 'Powerball', 'TattsLotto'] }),
    });

    const data: any = await response.json();
    if (!data.Success || !data.Draws?.length) return;

    const games = ['OzLotto', 'Powerball', 'TattsLotto'];
    const upcomingToStore: any[] = [];

    // Capture ALL draws returned by the API for each game
    games.forEach(g => {
      const draws = data.Draws.filter((d: any) => d.ProductId === g);
      draws.forEach((draw: any) => {
        const displayName = g === 'OzLotto' ? 'Oz Lotto' : g === 'Powerball' ? 'Powerball' : 'Tatts Lotto';
        
        // Cache jackpot for current process run
        jackpotCache.set(`${g}-${draw.DrawNumber}`, draw.Div1Amount);

        upcomingToStore.push({
          game: displayName,
          draw_number: draw.DrawNumber,
          draw_date: draw.DrawDate.split('T')[0],
          jackpot: draw.Div1Amount,
          is_estimated: draw.IsDiv1Estimated
        });
      });
    });

    // Upsert the entire ledger
    for (const draw of upcomingToStore) {
      const { error } = await supabase
        .from('upcoming_draws')
        .upsert(draw, { onConflict: 'game,draw_number' });
      
      if (error) console.error(`Error upserting upcoming draw for ${draw.game} #${draw.draw_number}:`, error.message);
    }
    console.log(`Successfully synchronized ${upcomingToStore.length} upcoming draws across all games.`);

  } catch (error: any) {
    console.error('Upcoming Draw Sync Error:', error.message);
  }
}

async function fetchGame(game: 'OzLotto' | 'Powerball' | 'TattsLotto') {
  const displayName = game === 'OzLotto' ? 'Oz Lotto' : game === 'Powerball' ? 'Powerball' : 'Tatts Lotto';
  console.log(`Processing ${displayName} results...`);
  
  try {
    const response = await fetch('https://data.api.thelott.com/sales/vmax/web/data/lotto/latestresults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.thelott.com',
        'Referer': 'https://www.thelott.com/'
      },
      body: JSON.stringify({ CompanyId: 'GoldenCasket', MaxDrawCount: 1, OptionalProductFilter: [game] }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(`Result Parsing Error: Non-JSON response received.`);
      return;
    }

    if (!data.Success || !data.DrawResults?.length) return;

    const latest = data.DrawResults[0];
    const drawNumber = latest.DrawNumber;
    const drawDate = latest.DrawDate.split('T')[0];

    const { data: existing } = await supabase.from('draw_results').select('id').eq('draw_number', drawNumber).eq('game', displayName).maybeSingle();
    if (existing) {
      console.log(`${displayName} Block #${drawNumber} already exists in history.`);
      return;
    }

    const prizes: Record<string, number> = {};
    latest.Dividends.forEach((div: any) => {
      let amount = div.BlocDividend;
      // Bridge Jackpot if needed
      if (div.Division === 1 && amount === 0) {
        const cachedAmount = jackpotCache.get(`${game}-${drawNumber}`);
        if (cachedAmount) {
          amount = cachedAmount;
          console.log(`Jackpot found in memory: $${amount.toLocaleString()}`);
        }
      }
      prizes[`Division ${div.Division}`] = amount;
    });
    prizes['No Prize'] = 0;

    // Second level bridge check: query DB ledger if memory cache missed
    if (prizes['Division 1'] === 0) {
      const { data: dbEntry } = await supabase
        .from('upcoming_draws')
        .select('jackpot')
        .eq('game', displayName)
        .eq('draw_number', drawNumber)
        .maybeSingle();
      
      if (dbEntry) {
        prizes['Division 1'] = dbEntry.jackpot;
        console.log(`Jackpot retrieved from DB Ledger: $${dbEntry.jackpot.toLocaleString()}`);
      }
    }

    await supabase.from('draw_results').insert({
      draw_number: drawNumber,
      draw_date: drawDate,
      game: displayName,
      numbers: latest.PrimaryNumbers,
      bonus: latest.SecondaryNumbers,
      prizes: prizes,
    });

    console.log(`Sync Complete: ${displayName} Block #${drawNumber}`);
    
    // Cleanup ledger
    await supabase.from('upcoming_draws').delete().eq('game', displayName).eq('draw_number', drawNumber);

    await notifyUsers(displayName, drawDate, latest.PrimaryNumbers, latest.SecondaryNumbers);

  } catch (error: any) {
    console.error(`Processing Failure:`, error.message);
  }
}

async function run() {
  await fetchUpcomingDraws();
  await fetchGame('OzLotto');
  await fetchGame('Powerball');
  await fetchGame('TattsLotto');
}

run();
