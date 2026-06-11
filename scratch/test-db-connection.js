const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env.local");
let envContent;
try {
  envContent = fs.readFileSync(envPath, "utf-8");
} catch (e) {
  console.error("Failed to read .env.local file:", e.message);
  process.exit(1);
}

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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Checking Supabase Environment Settings:");
console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "FOUND" : "MISSING", `(${supabaseUrl || ""})`);
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "FOUND" : "MISSING", `(${supabaseAnonKey ? supabaseAnonKey.substring(0, 15) + "..." : ""})`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Missing Supabase credentials in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log("\nAttempting to connect to Supabase inu-dashboard table...");
  const { data, count, error } = await supabase
    .from("inu-dashboard")
    .select("교과목명", { count: "exact" });

  if (error) {
    console.error("Connection Error:", error.message);
    console.error("Details:", error);
  } else {
    console.log("Connection successful!");
    console.log("Total rows in 'inu-dashboard' table:", count ?? (data ? data.length : 0));
  }
}

testConnection();
