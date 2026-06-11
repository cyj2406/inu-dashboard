const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lwzpbssueccqcbqwnepj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3enBic3N1ZWNjcWNicXduZXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMDg0ODQsImV4cCI6MjA5NjY4NDQ4NH0.nhKv5gbmSOEcHmT5sYEp1t88r280bep9FwjUuZXtYT4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('inu-dashboard')
      .select('"대학(원)"');
    
    if (error) {
      console.error('Query failed:', error);
      return;
    }
    
    const uniqueColleges = [...new Set(data.map(row => row['대학(원)']))];
    console.log('Unique colleges in DB:', uniqueColleges);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
