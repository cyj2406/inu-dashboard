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

async function testSimple() {
  console.log("Selecting only '학수번호' and filtering on '학년'...");
  const { data, error } = await supabase
    .from("inu-dashboard")
    .select("학수번호")
    .eq("학년", "전학년")
    .limit(1);

  if (error) {
    console.error("Simple Query Error:", error);
  } else {
    console.log("Simple Query Success! Data:", data);
  }
}

testSimple();
