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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

      const message = alreadyHasTicket
        ? `You've already got tickets secured for the ${targetDrawDate} ${game} draw on WhatIFLotto! Why not boost your chances? Secure a few more "what-if" tickets before the results are announced.`
        : `The ${game} draw for ${targetDrawDate} is coming up! Don't forget to secure your free (fake) tickets on WhatIFLotto before the results are announced tonight.`;

      const { error } = await resend.emails.send({
        from: 'WhatIFLotto <notifications@whatiflotto.com>',
        to: user.email,
        subject: subject,
        text: `${message}\n\nLock in your numbers: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://whatiflotto.com'}`,
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
