/**
 * Manual Setup Script
 * Run this ONCE if automatic setup fails at server startup.
 *
 * Usage:
 *   node run-setup.mjs
 *
 * Make sure your .env file has:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Load .env manually
if (existsSync(".env")) {
  const env = readFileSync(".env", "utf-8");
  env.split("\n").forEach(line => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SQL = `
ALTER TABLE departments ADD COLUMN IF NOT EXISTS plain_password TEXT;

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(is_active);

CREATE TABLE IF NOT EXISTS department_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'general',
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  posted_by TEXT DEFAULT 'teacher',
  email_sent BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dept_updates_dept ON department_updates(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_updates_active ON department_updates(is_active);
CREATE INDEX IF NOT EXISTS idx_dept_updates_created ON department_updates(created_at DESC);

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_updates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_subscribers' AND policyname='Public insert for email_subscribers') THEN
    CREATE POLICY "Public insert for email_subscribers" ON email_subscribers FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_subscribers' AND policyname='Public read for active subscribers') THEN
    CREATE POLICY "Public read for active subscribers" ON email_subscribers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='department_updates' AND policyname='Public read for active updates') THEN
    CREATE POLICY "Public read for active updates" ON department_updates FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='department_updates' AND policyname='Service role full access on updates') THEN
    CREATE POLICY "Service role full access on updates" ON department_updates USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

async function runSQL() {
  console.log("🔧 Running SQL via pg-meta API...");
  const pgMetaUrl = `${SUPABASE_URL}/pg-meta/v1/query`;

  const res = await fetch(pgMetaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    console.log("✅ SQL migration completed!");
    return true;
  }

  const errText = await res.text();
  console.warn("⚠️ pg-meta failed:", res.status, errText.substring(0, 200));
  return false;
}

async function createBucket() {
  console.log("🪣 Creating storage bucket...");
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some(b => b.id === "updates-files")) {
    console.log("✅ Bucket 'updates-files' already exists");
    return;
  }
  const { error } = await supabase.storage.createBucket("updates-files", {
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"],
  });
  if (error && !error.message.includes("already exists")) {
    console.error("❌ Bucket creation failed:", error.message);
  } else {
    console.log("✅ Bucket 'updates-files' ready");
  }
}

(async () => {
  const sqlOk = await runSQL();
  await createBucket();

  if (!sqlOk) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Automatic SQL migration failed.
    Please run new-tables.sql manually:

    1. Open Supabase Dashboard
    2. Go to SQL Editor
    3. Paste contents of: new-tables.sql
    4. Click "Run"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  } else {
    console.log("\n✅ Setup complete! You can now start the server.");
  }
})();
