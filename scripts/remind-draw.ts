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

async function sendReminders() {
  if (!resend) {
    console.log('Skipping reminders: RESEND_API_KEY not set.');
    return;
  }

  // Get the target draw date (The upcoming Tuesday)
  const targetDrawDate = getNextDrawDates(1)[0];

  console.log(`--- WhatIFLotto Universal Reminder ---`);
  console.log(`Target Draw Date: ${targetDrawDate}`);

  // 1. Get all registered users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching users from Supabase Auth:', authError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No registered users found in Supabase.');
    return;
  }

  console.log(`Sending reminders to ALL ${users.length} users...`);

  // 2. Get users who already have tickets (just for personalized messaging)
  const { data: ticketsForTargetDate } = await supabase
    .from('tickets')
    .select('user_id')
    .eq('draw_date', targetDrawDate);

  const usersWithTickets = new Set(ticketsForTargetDate?.map(t => t.user_id) || []);

  // 3. Notify everyone
  let sentCount = 0;
  for (const user of users) {
    if (!user.email) continue;

    const alreadyHasTicket = usersWithTickets.has(user.id);

    try {
      console.log(`[Sending] Reminder to: ${user.email} (Already has tickets: ${alreadyHasTicket})...`);

      const subject = alreadyHasTicket 
        ? "🎰 Boost your luck! Secure more tickets" 
        : "🎰 Don't miss the draw! Pick your lucky numbers";

      const message = alreadyHasTicket
        ? `You've already got tickets secured for the ${targetDrawDate} draw on WhatIFLotto! 
        
Why not boost your chances? Secure a few more "what-if" tickets before the results are announced. 

Add more numbers here: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://whatiflotto.com'}`
        : `The Oz Lotto draw for ${targetDrawDate} is coming up! 

Don't forget to secure your free (fake) tickets on WhatIFLotto before the results are announced. 

Will this be the week you 'would have' won the jackpot? Jump in now and lock in your numbers: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://whatiflotto.com'}`;

      const result = await resend.emails.send({
        from: 'WhatIFLotto <onboarding@resend.dev>',
        to: user.email,
        subject: subject,
        text: message,
      });

      if (result.error) {
        console.error(`Resend error for ${user.email}:`, result.error);
      } else {
        sentCount++;
        console.log(`[Success] Email sent to ${user.email}`);
      }
    } catch (e) {
      console.error(`[Fail] Could not notify user ${user.id}:`, e);
    }
  }

  console.log(`--- Finished. Universal reminders sent: ${sentCount} ---`);
}

sendReminders();
