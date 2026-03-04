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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing required environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function notifyUsers(drawDate: string, winningNumbers: number[], bonusNumbers: number[]) {
  if (!resend) {
    console.log('Skipping notifications: RESEND_API_KEY not set.');
    return;
  }

  console.log(`Starting notifications for draw date: ${drawDate}...`);

  // 1. Get all tickets for this draw date
  // We join with auth.users to get email addresses (requires service role)
  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      user_id,
      numbers
    `)
    .eq('draw_date', drawDate);

  if (ticketError) {
    console.error('Error fetching tickets for notification:', ticketError);
    return;
  }

  if (!tickets || tickets.length === 0) {
    console.log('No user tickets found for this draw.');
    return;
  }

  // 2. Group tickets by user and determine win status
  const userResults = new Map<string, { won: boolean }>();
  
  for (const ticket of tickets) {
    const userId = ticket.user_id;
    const result = compareNumbers(ticket.numbers, winningNumbers, bonusNumbers);
    const isWinner = result.prizeTier !== "No Prize";

    const current = userResults.get(userId) || { won: false };
    userResults.set(userId, { won: current.won || isWinner });
  }

  // 3. Get user emails from Supabase Auth
  // Note: Standard Supabase client can't list users easily, 
  // so we'll fetch them one by one or via a custom RPC if needed.
  // For this script, we'll try to get them via the auth.admin API.
  for (const [userId, status] of userResults.entries()) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !user?.email) {
        console.error(`Could not get email for user ${userId}:`, userError);
        continue;
      }

      const subject = status.won ? "🎉 You are a winner!" : "Lotto Results are Out!";
      const message = status.won 
        ? `Great news! One of your tickets for the ${drawDate} Oz Lotto draw has won a prize. Visit WouldHaveIWon to check your division!`
        : `The Oz Lotto results for ${drawDate} are now available. Visit WouldHaveIWon to see how your tickets performed.`;

      await resend.emails.send({
        from: 'WouldHaveIWon <onboarding@resend.dev>', // Update this after verifying your domain in Resend
        to: user.email,
        subject: subject,
        text: message,
      });

      console.log(`Notification sent to ${user.email} (Winner: ${status.won})`);
    } catch (e) {
      console.error(`Failed to notify user ${userId}:`, e);
    }
  }
}

async function fetchLatestResults() {
  console.log('Fetching latest Oz Lotto results...');
  
  try {
    const response = await fetch('https://data.api.thelott.com/sales/vmax/web/data/lotto/latestresults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.thelott.com',
        'Referer': 'https://www.thelott.com/'
      },
      body: JSON.stringify({
        CompanyId: 'GoldenCasket',
        MaxDrawCount: 1,
        OptionalProductFilter: ['OzLotto'],
      }),
    });

    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

    const data: any = await response.json();
    if (!data.Success || !data.DrawResults?.length) {
      console.log('No results found.');
      return;
    }

    const latest = data.DrawResults[0];
    const drawNumber = latest.DrawNumber;
    const drawDate = latest.DrawDate.split('T')[0];

    const { data: existing } = await supabase.from('draw_results').select('id').eq('draw_number', drawNumber).maybeSingle();
    if (existing) {
      console.log(`Draw #${drawNumber} already exists.`);
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
      game: 'Oz Lotto',
      numbers: latest.PrimaryNumbers,
      bonus: latest.SecondaryNumbers,
      prizes: prizes,
    });

    if (insertError) throw insertError;
    console.log(`Successfully saved Draw #${drawNumber}`);

    // Trigger Notifications
    await notifyUsers(drawDate, latest.PrimaryNumbers, latest.SecondaryNumbers);

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fetchLatestResults();
