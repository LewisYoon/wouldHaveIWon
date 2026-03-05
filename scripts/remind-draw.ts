// scripts/remind-draw.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { Resend } from 'resend';
import { getNextDrawDates } from '../lib/lotto-utils';

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

function getReminderTemplate(game: string, targetDate: string, alreadyHasTicket: boolean) {
  const isOz = game === 'Oz Lotto';
  const brandColor = isOz ? '#10b981' : '#4f46e5';
  
  const title = alreadyHasTicket ? `Secure another set?` : `Ready for tonight's draw?`;
  const heroText = alreadyHasTicket
    ? `You've already got your sequences locked in for the ${game} draw on ${targetDate}. Feeling extra lucky? You can always add a few more sets before we process the results tonight!`
    : `Tonight is the big ${game} draw for ${targetDate}! Don't forget to pick your lucky numbers and save them to your tracker before the results are announced.`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${game} Reminder</title>
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
          <a href="${siteUrl}/luck" class="btn">Pick My Numbers</a>
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

async function sendRemindersForGame(game: 'Oz Lotto' | 'Powerball') {
  if (!resend) return;

  const targetDrawDate = getNextDrawDates(1, game)[0];
  console.log(`Preparing reminder batch for ${game} (${targetDrawDate})...`);

  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError || !users) return;

  const { data: ticketsForTargetDate } = await supabase
    .from('tickets')
    .select('user_id')
    .eq('draw_date', targetDrawDate)
    .eq('game', game);

  const usersWithTickets = new Set(ticketsForTargetDate?.map(t => t.user_id) || []);
  const emailBatch: any[] = [];

  for (const user of users) {
    if (!user.email) continue;
    const alreadyHasTicket = usersWithTickets.has(user.id);

    const subject = alreadyHasTicket 
      ? `Feeling extra lucky for tonight's ${game}?` 
      : `Don't forget to pick your ${game} numbers if you have not!`;

    const html = getReminderTemplate(game, targetDrawDate, alreadyHasTicket);
    const plainText = alreadyHasTicket
      ? `You've got sequences locked in for the ${game} draw on ${targetDrawDate}. Add more at: ${siteUrl}/luck`
      : `Tonight is the ${game} draw for ${targetDrawDate}. Pick your numbers at: ${siteUrl}/luck`;

    emailBatch.push({
      from: 'WhatIFLotto <notifications@whatiflotto.com>',
      to: user.email,
      subject: subject,
      html: html,
      text: plainText,
      headers: {
        'List-Unsubscribe': `<${siteUrl}/unsubscribe>`
      }
    });
  }

  for (let i = 0; i < emailBatch.length; i += 100) {
    const batch = emailBatch.slice(i, i + 100);
    try {
      await resend.batch.send(batch);
      console.log(`Dispatched ${batch.length} reminders.`);
    } catch (e) {
      console.error(`Batch failure:`, e);
    }
  }
}

async function run() {
  const today = new Date().getDay();
  if (today === 1 || today === 2) await sendRemindersForGame('Oz Lotto');
  if (today === 3 || today === 4) await sendRemindersForGame('Powerball');
}

run();
