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

function getEmailTemplate(game: string, drawDate: string, status: { won: boolean }) {
  const isOz = game === 'Oz Lotto';
  const brandColor = isOz ? '#10b981' : '#4f46e5'; // Emerald-600 or Indigo-600
  
  const title = status.won ? `🎉 Winner! Your ${game} Results` : `${game} Results are In`;
  const heroText = status.won 
    ? `Great news! One of your tracked tickets for the ${game} draw has won a prize.`
    : `The results for the ${drawDate} ${game} draw are now available for comparison.`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-weight: 900; font-size: 24px; color: #111827; text-transform: uppercase; letter-spacing: -0.05em; }
        .logo span { color: ${brandColor}; font-style: italic; text-transform: lowercase; }
        .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 24px; padding: 40px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .badge { display: inline-block; padding: 4px 12px; background: ${brandColor}10; color: ${brandColor}; border-radius: 9999px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
        .title { font-size: 24px; font-weight: 900; color: #111827; margin-bottom: 16px; text-transform: uppercase; letter-spacing: -0.025em; }
        .text { font-size: 16px; color: #6b7280; margin-bottom: 32px; }
        .button { display: inline-block; padding: 16px 32px; background: ${brandColor}; color: #ffffff !important; text-decoration: none; border-radius: 16px; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em; transition: all 0.2s; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">WhatIF<span>lotto</span></div>
        </div>
        <div class="card">
          <div class="badge">${game} • Official Draw</div>
          <div class="title">${title}</div>
          <p class="text">${heroText}</p>
          <a href="${siteUrl}/luck" class="button">View My Results</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} WhatIFLotto Australia<br>For simulation purposes only. No real money involved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

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
        const html = getEmailTemplate(game, drawDate, status);

        emailBatch.push({
          from: 'WhatIFLotto <notifications@whatiflotto.com>',
          to: user.email,
          subject: subject,
          html: html,
        });
      }
    }
  }

  // 3. Send emails in batches of 100 (Resend limit)
  for (let i = 0; i < emailBatch.length; i += 100) {
    const batch = emailBatch.slice(i, i + 100);
    try {
      const response = await resend.batch.send(batch);
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
