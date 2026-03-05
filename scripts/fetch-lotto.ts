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
  
  const title = status.won ? `Draw Results: Match Detected` : `Draw Results: Published`;
  const heroText = status.won 
    ? `Your tracked numbers for the ${game} draw on ${drawDate} have successfully matched winning criteria.`
    : `The official results for the ${game} draw on ${drawDate} are now available for your review.`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${game} Results</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
      </style>
      <![endif]-->
      <style>
        body { margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .content { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; margin-top: 40px; overflow: hidden; border: 1px solid #e5e7eb; }
        .header { padding: 32px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #f3f4f6; }
        .body { padding: 40px; text-align: center; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.5; }
        .button { display: inline-block; padding: 14px 28px; background-color: ${brandColor}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .badge { display: inline-block; padding: 4px 12px; background-color: #f3f4f6; color: #4b5563; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
        h1 { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 16px 0; }
        p { font-size: 16px; color: #4b5563; margin: 0 0 32px 0; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="content">
          <div class="header">
            <div style="font-weight: 900; font-size: 20px; color: #111827; letter-spacing: -0.02em;">WhatIF<span style="color: ${brandColor};">Lotto</span></div>
          </div>
          <div class="body">
            <div class="badge">System Notification</div>
            <h1>${title}</h1>
            <p>${heroText}</p>
            <a href="${siteUrl}/luck" class="button">Access Archive</a>
          </div>
          <div class="footer">
            <p>
              This is a transactional message regarding your tracked sequences on WhatIFLotto.<br>
              Australia • <a href="${siteUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy Policy</a>
            </p>
            <p style="margin-top: 16px; font-size: 10px; opacity: 0.8;">
              If you wish to stop receiving these specific alerts, please adjust your notification settings in your account profile.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function notifyUsers(game: string, drawDate: string, winningNumbers: number[], bonusNumbers: number[]) {
  if (!resend) return;

  console.log(`Processing notification queue for ${game} (${drawDate})...`);

  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .select(`user_id, numbers`)
    .eq('draw_date', drawDate)
    .eq('game', game);

  if (ticketError || !tickets?.length) {
    console.log(`Queue empty for ${game} on ${drawDate}.`);
    return;
  }

  const userResults = new Map<string, { won: boolean }>();
  for (const ticket of tickets) {
    const result = compareNumbers(ticket.numbers, winningNumbers, bonusNumbers, game as any);
    const current = userResults.get(ticket.user_id) || { won: false };
    userResults.set(ticket.user_id, { won: current.won || result.prizeTier !== "No Prize" });
  }

  const userIds = Array.from(userResults.keys());
  const emailBatch: any[] = [];

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
        // Use more neutral, transactional subject lines to bypass "Promotion" tabs
        const subject = `Notification: ${game} Draw Results (${drawDate})`;
        const html = getEmailTemplate(game, drawDate, status);

        emailBatch.push({
          from: 'WhatIFLotto <notifications@whatiflotto.com>',
          to: user.email,
          subject: subject,
          html: html,
          // Add plain text version for spam filters
          text: `The official results for the ${game} draw on ${drawDate} are now available. View your results at: ${siteUrl}/luck`,
          headers: {
            'X-Entity-Ref-ID': `${userId}-${drawDate}`,
            'List-Unsubscribe': `<${siteUrl}/unsubscribe>`
          }
        });
      }
    }
  }

  for (let i = 0; i < emailBatch.length; i += 100) {
    const batch = emailBatch.slice(i, i + 100);
    try {
      await resend.batch.send(batch);
      console.log(`Transmitted batch of ${batch.length} ${game} notifications.`);
    } catch (e) {
      console.error(`Transmission failure:`, e);
    }
  }
}

async function fetchGame(game: 'OzLotto' | 'Powerball') {
  console.log(`Querying node for ${game} results...`);
  const displayName = game === 'OzLotto' ? 'Oz Lotto' : 'Powerball';
  
  try {
    const response = await fetch('https://data.api.thelott.com/sales/vmax/web/data/lotto/latestresults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0',
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
      console.log(`Block #${drawNumber} already synchronized.`);
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
    console.log(`Committed ${displayName} Block #${drawNumber}`);

    await notifyUsers(displayName, drawDate, latest.PrimaryNumbers, latest.SecondaryNumbers);

  } catch (error: any) {
    console.error(`Node Sync Error (${game}):`, error.message);
  }
}

async function run() {
  await fetchGame('OzLotto');
  await fetchGame('Powerball');
}

run();
