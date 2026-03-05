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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getReminderTemplate(game: string, targetDate: string, alreadyHasTicket: boolean) {
  const isOz = game === 'Oz Lotto';
  const brandColor = isOz ? '#10b981' : '#4f46e5';
  
  const title = alreadyHasTicket ? `Boost Your Luck!` : `Pick Your Numbers`;
  const heroText = alreadyHasTicket
    ? `You've already secured tickets for the ${targetDate} ${game} draw. Why not boost your chances with a few more?`
    : `The ${game} draw for ${targetDate} is coming up! Don't forget to lock in your free tracked tickets before results are announced tonight.`;

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
          <div class="badge">${game} • Draw Reminder</div>
          <div class="title">${title}</div>
          <p class="text">${heroText}</p>
          <a href="${siteUrl}/luck" class="button">Pick My Numbers</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} WhatIFLotto Australia<br>For simulation purposes only. No real money involved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendRemindersForGame(game: 'Oz Lotto' | 'Powerball') {
  if (!resend) return;

  const targetDrawDate = getNextDrawDates(1, game)[0];
  console.log(`--- WhatIFLotto Reminder for ${game} ---`);
  console.log(`Target Draw Date: ${targetDrawDate}`);

  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError || !users) return;

  const { data: ticketsForTargetDate } = await supabase
    .from('tickets')
    .select('user_id')
    .eq('draw_date', targetDrawDate)
    .eq('game', game);

  const usersWithTickets = new Set(ticketsForTargetDate?.map(t => t.user_id) || []);

  for (const user of users) {
    if (!user.email) continue;
    const alreadyHasTicket = usersWithTickets.has(user.id);

    try {
      const subject = alreadyHasTicket 
        ? `🎰 Boost your luck! Secure more ${game} tickets` 
        : `🎰 Don't miss the ${game} draw! Pick your lucky numbers`;

      const html = getReminderTemplate(game, targetDrawDate, alreadyHasTicket);

      const { error } = await resend.emails.send({
        from: 'WhatIFLotto <notifications@whatiflotto.com>',
        to: user.email,
        subject: subject,
        html: html,
      });

      if (!error) console.log(`[Success] ${game} Reminder sent to ${user.email}`);
      await sleep(600);
    } catch (e) {
      console.error(`Fail for ${user.id}:`, e);
    }
  }
}

async function run() {
  const today = new Date().getDay();
  // If Monday (1) or Tuesday (2), remind Oz Lotto
  if (today === 1 || today === 2) await sendRemindersForGame('Oz Lotto');
  // If Wednesday (3) or Thursday (4), remind Powerball
  if (today === 3 || today === 4) await sendRemindersForGame('Powerball');
}

run();
