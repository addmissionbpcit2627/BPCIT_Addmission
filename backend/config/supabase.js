const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.BPCIT_DATABASE_SUPABASE_URL;
const supabaseKey = process.env.BPCIT_DATABASE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Warning: Supabase credentials missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
