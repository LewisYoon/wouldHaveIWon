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
  const brandColor = isOz ? '#10b981' : '#4f46e5';
  
  const title = status.won ? `Update: Draw Results Match` : `Update: Draw Results Available`;
  const heroText = status.won 
    ? `System analysis has identified a winning match for your ${game} tracked numbers (${drawDate}).`
    : `The official results for the ${game} draw on ${drawDate} have been synchronized with your archive.`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${game} Results</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f4f7f9; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; border: 1px solid #e1e8ed; overflow: hidden; }
        .header { padding: 30px; text-align: center; border-bottom: 1px solid #f0f4f8; }
        .content { padding: 40px; text-align: center; }
        .footer { padding: 25px; text-align: center; font-size: 12px; color: #8899a6; background: #f8f9fa; }
        .btn { display: inline-block; padding: 14px 30px; background: ${brandColor}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; }
        h1 { color: #14171a; font-size: 22px; margin-bottom: 20px; }
        p { color: #657786; font-size: 16px; line-height: 1.5; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span style="font-weight: 900; font-size: 18px; color: #14171a; text-transform: uppercase;">WhatIF<span style="color: ${brandColor};">Lotto</span></span>
        </div>
        <div class="content">
          <h1>${title}</h1>
          <p>${heroText}</p>
          <a href="${siteUrl}/luck" class="btn">View My Archive</a>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} WhatIFLotto Australia • Transactional Service Alert<br>
          <a href="${siteUrl}/privacy" style="color: #8899a6;">Privacy Policy</a> • <a href="${siteUrl}/unsubscribe" style="color: #8899a6;">Unsubscribe</a>
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
        emailBatch.push({
          from: 'WhatIFLotto <notifications@whatiflotto.com>',
          to: user.email,
          subject: `Service: ${game} Results Sync (${drawDate})`,
          html: getEmailTemplate(game, drawDate, status),
          text: `The ${game} results for ${drawDate} are available. View at: ${siteUrl}/luck`,
          headers: { 'List-Unsubscribe': `<${siteUrl}/unsubscribe>` }
        });
      }
    }
  }

  for (let i = 0; i < emailBatch.length; i += 100) {
    await resend.batch.send(emailBatch.slice(i, i + 100));
  }
}

async function fetchGame(game: 'OzLotto' | 'Powerball') {
  const displayName = game === 'OzLotto' ? 'Oz Lotto' : 'Powerball';
  
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
      console.error(`Block Sync Error: Received non-JSON response from node.`);
      return;
    }

    if (!data.Success || !data.DrawResults?.length) return;

    const latest = data.DrawResults[0];
    const drawNumber = latest.DrawNumber;
    const drawDate = latest.DrawDate.split('T')[0];

    const { data: existing } = await supabase.from('draw_results').select('id').eq('draw_number', drawNumber).eq('game', displayName).maybeSingle();
    if (existing) return;

    const prizes: Record<string, number> = {};
    latest.Dividends.forEach((div: any) => prizes[`Division ${div.Division}`] = div.BlocDividend);
    prizes['No Prize'] = 0;

    await supabase.from('draw_results').insert({
      draw_number: drawNumber,
      draw_date: drawDate,
      game: displayName,
      numbers: latest.PrimaryNumbers,
      bonus: latest.SecondaryNumbers,
      prizes: prizes,
    });

    console.log(`Sync Complete: ${displayName} Block #${drawNumber}`);
    await notifyUsers(displayName, drawDate, latest.PrimaryNumbers, latest.SecondaryNumbers);

  } catch (error: any) {
    console.error(`Sync Failure:`, error.message);
  }
}

async function run() {
  await fetchGame('OzLotto');
  await fetchGame('Powerball');
}

run();
