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

async function checkFilter() {
  console.log("Testing filter with '대학(원)'...");
  const { data, error } = await supabase
    .from("inu-dashboard")
    .select(`
      학수번호, 
      교과목명, 
      대학:"대학(원)", 
      학과:"학과(부)"
    `)
    .eq("대학(원)", "인문대학")
    .eq("학과(부)", "국어국문학과")
    .limit(1);

  if (error) {
    console.error("Filter Error:", error);
  } else {
    console.log("Filter Successful! Data row:", data[0]);
  }
}

checkFilter();
