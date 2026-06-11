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

async function checkColumns() {
  console.log("Fetching 1 row from 'inu-dashboard' to check available columns...");
  const { data, error } = await supabase
    .from("inu-dashboard")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error fetching data:", error);
  } else if (data && data.length > 0) {
    console.log("Success! Columns found in 'inu-dashboard' table:");
    console.log(Object.keys(data[0]));
    console.log("\nSample data row:", data[0]);
  } else {
    console.log("Success, but no rows returned from table.");
  }
}

checkColumns();
