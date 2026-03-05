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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing required environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Helper to wait between requests to respect rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendReminders() {
  if (!resend) {
    console.log('Skipping reminders: RESEND_API_KEY not set.');
    return;
  }

  const targetDrawDate = getNextDrawDates(1)[0];
  console.log(`--- WhatIFLotto Universal Reminder ---`);
  console.log(`Target Draw Date: ${targetDrawDate}`);

  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError || !users) {
    console.error('Error fetching users:', authError);
    return;
  }

  console.log(`Processing reminders for ${users.length} users...`);

  const { data: ticketsForTargetDate } = await supabase
    .from('tickets')
    .select('user_id')
    .eq('draw_date', targetDrawDate);

  const usersWithTickets = new Set(ticketsForTargetDate?.map(t => t.user_id) || []);

  let sentCount = 0;
  for (const user of users) {
    if (!user.email) continue;

    const alreadyHasTicket = usersWithTickets.has(user.id);

    try {
      console.log(`[Queueing] Reminder to: ${user.email}...`);

      const subject = alreadyHasTicket 
        ? "🎰 Boost your luck! Secure more tickets" 
        : "🎰 Don't miss the draw! Pick your lucky numbers";

      const message = alreadyHasTicket
        ? `You've already got tickets secured for the ${targetDrawDate} draw on WhatIFLotto! Why not boost your chances? Secure a few more "what-if" tickets before the results are announced. \n\nAdd more: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://whatiflotto.com'}`
        : `The Oz Lotto draw for ${targetDrawDate} is coming up! Don't forget to secure your free (fake) tickets on WhatIFLotto before the results are announced tonight. \n\nLock in your numbers: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://whatiflotto.com'}`;

      const { data, error } = await resend.emails.send({
        from: 'WhatIFLotto <notifications@wouldhaveiwon.dev>',
        to: user.email,
        subject: subject,
        text: message,
      });

      if (error) {
        // If we hit a restriction or rate limit, log it clearly
        console.error(`[Resend Error] for ${user.email}:`, error.message);
      } else {
        sentCount++;
        console.log(`[Success] Email sent to ${user.email}`);
      }

      // WAIT 600ms between each email to respect the "2 requests per second" limit
      await sleep(600);

    } catch (e) {
      console.error(`[System Fail] Could not notify user ${user.id}:`, e);
    }
  }

  console.log(`--- Finished. Universal reminders successfully accepted by Resend: ${sentCount} ---`);
  console.log(`Note: If success count is lower than user count, check logs for '403 Forbidden' (unverified domain) or '429' (rate limit).`);
}

sendReminders();
