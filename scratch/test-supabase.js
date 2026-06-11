const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lwzpbssueccqcbqwnepj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3enBic3N1ZWNjcWNicXduZXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMDg0ODQsImV4cCI6MjA5NjY4NDQ4NH0.nhKv5gbmSOEcHmT5sYEp1t88r280bep9FwjUuZXtYT4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('inu-dashboard')
      .select('대학:"대학(원)", 학과:"학과(부)"');
    
    if (error) {
      console.error('Query failed:', error);
      return;
    }
    
    const matchedCollege = data.filter(row => row.대학 === '기초교육원');
    const matchedDept = data.filter(row => row.대학 === '기초교육원' && row.학과 === '교양');
    console.log('Total rows:', data.length);
    console.log('Rows matching 기초교육원:', matchedCollege.length);
    console.log('Rows matching 기초교육원 & 교양:', matchedDept.length);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
