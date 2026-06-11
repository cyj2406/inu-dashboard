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

async function test1() {
  console.log("Test 1: Select with alias, Filter with original '대학(원)'");
  const { data, error } = await supabase
    .from("inu-dashboard")
    .select('대학:"대학(원)"')
    .eq("대학(원)", "인문대학")
    .limit(1);

  if (error) {
    console.error("Test 1 Error:", error.message);
  } else {
    console.log("Test 1 Success! Data:", data);
  }
}

async function test2() {
  console.log("Test 2: Select with alias, Filter with alias '대학'");
  const { data, error } = await supabase
    .from("inu-dashboard")
    .select('대학:"대학(원)"')
    .eq("대학", "인문대학")
    .limit(1);

  if (error) {
    console.error("Test 2 Error:", error.message);
  } else {
    console.log("Test 2 Success! Data:", data);
  }
}

async function runTests() {
  await test1();
  await test2();
}

runTests();
