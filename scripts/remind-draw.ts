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
  
  const title = alreadyHasTicket ? `Schedule Update: ${game}` : `Action Required: ${game} Sequence`;
  const heroText = alreadyHasTicket
    ? `Your existing sequences for the ${targetDate} ${game} draw are scheduled for verification. You may authorize additional sets if required.`
    : `The ${game} draw cycle for ${targetDate} is approaching. System authorization for your tracked numbers is required before the results are published.`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${game} Reminder</title>
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
            <div class="badge">Service Update</div>
            <h1>${title}</h1>
            <p>${heroText}</p>
            <a href="${siteUrl}/luck" class="button">Configure Sequences</a>
          </div>
          <div class="footer">
            <p>
              This is a standard service reminder for WhatIFLotto users.<br>
              Australia • <a href="${siteUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy Policy</a>
            </p>
            <p style="margin-top: 16px; font-size: 10px; opacity: 0.8;">
              Manage your alert preferences in your account settings. <a href="${siteUrl}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendRemindersForGame(game: 'Oz Lotto' | 'Powerball') {
  if (!resend) return;

  const targetDrawDate = getNextDrawDates(1, game)[0];
  console.log(`Initializing reminder batch for ${game} (${targetDrawDate})...`);

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

    // Transactional-style subject lines are less likely to be flagged as "Promotions"
    const subject = alreadyHasTicket 
      ? `Update: Your ${game} sequences for ${targetDrawDate}` 
      : `Reminder: Action required for ${game} draw (${targetDrawDate})`;

    const html = getReminderTemplate(game, targetDrawDate, alreadyHasTicket);
    const plainText = alreadyHasTicket
      ? `Your ${game} sequences for ${targetDrawDate} are scheduled. Configure more at: ${siteUrl}/luck`
      : `The ${game} draw for ${targetDrawDate} is approaching. Configure your numbers at: ${siteUrl}/luck`;

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

  // Send in batches of 100
  for (let i = 0; i < emailBatch.length; i += 100) {
    const batch = emailBatch.slice(i, i + 100);
    try {
      await resend.batch.send(batch);
      console.log(`Successfully dispatched batch of ${batch.length} ${game} reminders.`);
    } catch (e) {
      console.error(`Batch dispatch failure:`, e);
    }
  }
}

async function run() {
  const today = new Date().getDay();
  // Monday (1) or Tuesday (2) -> Oz Lotto
  if (today === 1 || today === 2) await sendRemindersForGame('Oz Lotto');
  // Wednesday (3) or Thursday (4) -> Powerball
  if (today === 3 || today === 4) await sendRemindersForGame('Powerball');
}

run();
