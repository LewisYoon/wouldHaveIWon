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
  const sydneyDate = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).split('/').reverse().join('-');

  console.log(`Checking for tickets on draw date: ${sydneyDate}...`);

  // 1. Get all unique users who have tickets for today
  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .select('user_id')
    .eq('draw_date', sydneyDate);

  if (ticketError) {
    console.error('Error fetching tickets:', ticketError);
    return;
  }

  if (!tickets || tickets.length === 0) {
    console.log('No user tickets found for today.');
    return;
  }

  const userIds = Array.from(new Set(tickets.map(t => t.user_id)));
  console.log(`Found ${userIds.length} users to remind.`);

  // 2. Send reminders
  for (const userId of userIds) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !user?.email) {
        console.error(`Could not get email for user ${userId}:`, userError);
        continue;
      }

      await resend.emails.send({
        from: 'WhatIFLotto <onboarding@resend.dev>',
        to: user.email,
        subject: "🎫 Secure your tickets to try your luck - Today is Draw Day!",
        text: `Today is the draw day for Oz Lotto (${sydneyDate})! Don't forget to secure your tickets at https://wouldhaveiwon.pages.dev to test your luck!`,
      });

      console.log(`Reminder sent to ${user.email}`);
    } catch (e) {
      console.error(`Failed to remind user ${userId}:`, e);
    }
  }
}

sendReminders();
