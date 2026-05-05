/**
 * Auto Database Setup
 * Runs at server startup — creates new tables and storage bucket automatically.
 * Uses Supabase pg-meta API (accessible with service role key).
 */

import { supabase } from "./supabase";

const NEW_TABLES_SQL = `
-- Add plain_password column to departments (safe to run multiple times)
ALTER TABLE departments ADD COLUMN IF NOT EXISTS plain_password TEXT;

-- Email Subscribers Table
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

-- Department Updates Table
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

-- Enable RLS
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (safe: IF NOT EXISTS not supported for policies, use DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_subscribers' AND policyname = 'Public insert for email_subscribers'
  ) THEN
    CREATE POLICY "Public insert for email_subscribers" ON email_subscribers FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_subscribers' AND policyname = 'Public read for active subscribers'
  ) THEN
    CREATE POLICY "Public read for active subscribers" ON email_subscribers FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'department_updates' AND policyname = 'Public read for active updates'
  ) THEN
    CREATE POLICY "Public read for active updates" ON department_updates FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'department_updates' AND policyname = 'Service role full access on updates'
  ) THEN
    CREATE POLICY "Service role full access on updates" ON department_updates USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

async function runSqlViaSupabase(sql: string): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn("⚠️ DB Setup: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set, skipping");
    return false;
  }

  // Supabase pg-meta API — accessible with service role key
  const pgMetaUrl = `${supabaseUrl}/pg-meta/v1/query`;

  try {
    const res = await fetch(pgMetaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "x-connection-encrypted": "true",
      },
      body: JSON.stringify({ query: sql }),
    });

    if (res.ok) {
      return true;
    }

    const errText = await res.text();
    // pg-meta might not be available on all Supabase plans — try fallback
    console.warn(`⚠️ DB Setup pg-meta attempt: ${res.status} — ${errText.substring(0, 100)}`);
    return false;
  } catch (err: any) {
    console.warn("⚠️ DB Setup pg-meta error:", err.message);
    return false;
  }
}

async function createStorageBucket(): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.id === "updates-files");

    if (exists) {
      console.log("✅ Storage bucket 'updates-files' already exists");
      return;
    }

    const { error } = await supabase.storage.createBucket("updates-files", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"],
    });

    if (error) {
      // Bucket might already exist (race condition or different error)
      if (error.message?.includes("already exists")) {
        console.log("✅ Storage bucket 'updates-files' already exists");
      } else {
        console.warn("⚠️ Could not create storage bucket:", error.message);
      }
    } else {
      console.log("✅ Storage bucket 'updates-files' created successfully");
    }
  } catch (err: any) {
    console.warn("⚠️ Storage bucket setup error:", err.message);
  }
}

async function verifyTablesExist(): Promise<{ emailSubs: boolean; deptUpdates: boolean }> {
  const [subsCheck, updatesCheck] = await Promise.all([
    supabase.from("email_subscribers").select("id").limit(1),
    supabase.from("department_updates").select("id").limit(1),
  ]);
  return {
    emailSubs: !subsCheck.error,
    deptUpdates: !updatesCheck.error,
  };
}

export async function runDatabaseSetup(): Promise<void> {
  console.log("🔧 Running auto database setup...");

  // Step 1: Check if tables already exist
  const existing = await verifyTablesExist();

  if (existing.emailSubs && existing.deptUpdates) {
    console.log("✅ All new tables already exist — skipping SQL migration");
  } else {
    console.log(`📋 Missing tables — email_subscribers:${existing.emailSubs}, department_updates:${existing.deptUpdates}`);
    console.log("🔧 Running SQL migration via pg-meta...");

    const ok = await runSqlViaSupabase(NEW_TABLES_SQL);

    if (ok) {
      console.log("✅ Database migration completed via pg-meta API");
    } else {
      // pg-meta failed — this is usually because the project is on a Supabase plan
      // that doesn't expose pg-meta externally. Print instructions.
      console.error(`
❌ AUTO MIGRATION FAILED — Please run the SQL manually:

1. Go to your Supabase Dashboard → SQL Editor
2. Open the file: new-tables.sql
3. Paste and run the contents

OR run: node run-setup.mjs
`);
    }
  }

  // Step 2: Create storage bucket (always try — it's idempotent)
  await createStorageBucket();

  console.log("✅ Database setup check complete");
}
