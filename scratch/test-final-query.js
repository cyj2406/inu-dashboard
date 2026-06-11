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

async function testFinalQuery() {
  console.log("Testing final query with alias and quotes for filter...");
  let query = supabase.from("inu-dashboard").select(`
    학수번호, 
    교과목명, 
    담당교수, 
    이수구분, 
    수강, 
    정원, 
    원어강의, 
    수업방법, 
    학점, 
    "시간표(교시)", 
    "시간표(시간)", 
    대학:"대학(원)", 
    학과:"학과(부)"
  `);

  query = query.eq('"대학(원)"', "인문대학");
  query = query.eq('"학과(부)"', "국어국문학과");

  const { data, error } = await query;

  if (error) {
    console.error("Final Query Error:", error);
  } else {
    console.log(`Final Query Success! Returned ${data.length} rows.`);
    console.log("First row:", data[0]);
  }
}

testFinalQuery();
