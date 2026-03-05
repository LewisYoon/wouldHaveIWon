// scripts/remind-draw.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { Resend } from 'resend';

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

  // Get current date in Sydney time (YYYY-MM-DD)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(now);
  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  const sydneyDate = `${year}-${month}-${day}`;

  console.log(`--- Draw Day Reminder for ${sydneyDate} ---`);

  // 1. Get all registered users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching users:', authError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No registered users found.');
    return;
  }

  // 2. Get users who ALREADY have tickets for today
  const { data: ticketsToday, error: ticketError } = await supabase
    .from('tickets')
    .select('user_id')
    .eq('draw_date', sydneyDate);

  if (ticketError) {
    console.error('Error checking today\'s tickets:', ticketError);
    return;
  }

  const usersWithTickets = new Set(ticketsToday?.map(t => t.user_id) || []);

  // 3. Remind users who haven't "secured" their luck yet
  for (const user of users) {
    if (!user.email) continue;

    if (usersWithTickets.has(user.id)) {
      console.log(`Skipping ${user.email} - Already has tickets for today.`);
      continue;
    }

    try {
      console.log(`Sending reminder to: ${user.email}...`);

      const result = await resend.emails.send({
        from: 'WhatIFLotto <onboarding@resend.dev>',
        to: user.email,
        subject: "🎰 Today is Draw Day! Pick your lucky numbers",
        text: `Today is Oz Lotto day (${sydneyDate})! Don't forget to secure your free (fake) tickets on WhatIFLotto before the results are announced tonight. Will today be the day you 'would have' won millions? Test your luck now!`,
      });

      if (result.error) {
        console.error(`Resend error for ${user.email}:`, result.error);
      } else {
        console.log(`Successfully sent reminder to ${user.email}`);
      }
    } catch (e) {
      console.error(`Failed to remind user ${user.id}:`, e);
    }
  }
}

sendReminders();
