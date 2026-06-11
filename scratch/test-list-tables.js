const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkTables() {
  console.log("Checking if we can read list of tables or common table names...");
  
  // Try querying common names
  const potentialTables = ["inu_dashboard", "inu-dashboard", "courses", "course", "inu_courses", "dashboard"];
  for (const table of potentialTables) {
    const { data, count, error } = await supabase
      .from(table)
      .select("*", { count: "exact" })
      .limit(1);
    
    if (error) {
      console.log(`Table '${table}': ERROR - ${error.message} (${error.code})`);
    } else {
      console.log(`Table '${table}': SUCCESS! Count = ${count}, Data limit 1 =`, data);
    }
  }
}

checkTables();
