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

async function checkRest() {
  try {
    const response = await fetch(`${url}/rest/v1/courses?select=교과목명&limit=1`, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });
    console.log("Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    const text = await response.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

checkRest();
