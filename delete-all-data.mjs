import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllData() {
  console.log('Starting data deletion...');

  try {
    // Delete all member_usage first to avoid foreign key constraints
    console.log('Deleting member_usage...');
    const { error: usageError } = await supabase
      .from('member_usage')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (usageError) {
      console.error('Error deleting member_usage:', usageError);
    } else {
      console.log('Successfully deleted all member_usage records.');
    }

    // Delete all meter_entries
    console.log('Deleting meter_entries...');
    const { error: entriesError } = await supabase
      .from('meter_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (entriesError) {
      console.error('Error deleting meter_entries:', entriesError);
    } else {
      console.log('Successfully deleted all meter_entries.');
    }

    console.log('Deletion complete!');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

deleteAllData();
