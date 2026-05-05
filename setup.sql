-- ============================================================
-- RKSD College — Complete Supabase Setup
-- Run this ONE file in Supabase SQL Editor
-- Creates all tables, indexes, RLS policies, realtime
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. HEAD ADMIN
-- ============================================================
CREATE TABLE IF NOT EXISTS head_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. DEPARTMENTS (Mini Panels)
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  department_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  plain_password TEXT,
  head_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  description TEXT,
  panel_link TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES head_admin(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Agar departments table pehle se thi aur plain_password nahi tha toh add karo
ALTER TABLE departments ADD COLUMN IF NOT EXISTS plain_password TEXT;

-- ============================================================
-- 3. DEPARTMENT DATA
-- ============================================================
CREATE TABLE IF NOT EXISTS department_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. COLLEGE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS college_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. NOTICES
-- ============================================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  notice_type TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES head_admin(id),
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. EVENTS / ACHIEVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  youtube_url TEXT,
  instagram_url TEXT,
  video_url TEXT,
  formatted_message TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES head_admin(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. HOLIDAYS
-- ============================================================
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  holiday_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. TIMINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS timings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_name TEXT NOT NULL,
  opening_time TIME,
  closing_time TIME,
  days TEXT[],
  special_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. COURSES
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_name TEXT NOT NULL,
  course_code TEXT UNIQUE NOT NULL,
  course_type TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  duration TEXT,
  description TEXT,
  eligibility TEXT,
  total_seats INTEGER,
  fees_per_year DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. STAFF MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'Staff',
  designation TEXT,
  email TEXT,
  phone TEXT,
  qualification TEXT,
  specialization TEXT,
  joining_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. DEPARTMENT LOCAL FACULTY (teacher panel ka apna staff)
-- ============================================================
CREATE TABLE IF NOT EXISTS department_local_faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  role TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  phone TEXT,
  qualification TEXT,
  specialization TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. CLASS SCHEDULES (teacher panel timetable)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL,
  shift TEXT NOT NULL,
  year INTEGER NOT NULL,
  section TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number TEXT,
  teacher_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  teacher_name TEXT,
  subject TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. EMAIL SUBSCRIBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- ============================================================
-- 14. DEPARTMENT UPDATES (teacher/admin posts with file)
-- ============================================================
CREATE TABLE IF NOT EXISTS department_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'general',
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  posted_by TEXT,
  email_sent BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_departments_slug ON departments(slug);
CREATE INDEX IF NOT EXISTS idx_departments_department_id ON departments(department_id);
CREATE INDEX IF NOT EXISTS idx_department_data_dept ON department_data(department_id);
CREATE INDEX IF NOT EXISTS idx_notices_active ON notices(is_active);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_dept ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_dept ON staff_members(department_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_dept ON class_schedules(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_local_faculty_dept ON department_local_faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_dept_updates_dept ON department_updates(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_updates_active ON department_updates(is_active);
CREATE INDEX IF NOT EXISTS idx_dept_updates_created ON department_updates(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE head_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_local_faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read for departments" ON departments FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for department_data" ON department_data FOR SELECT USING (true);
CREATE POLICY "Public read for notices" ON notices FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for college_settings" ON college_settings FOR SELECT USING (true);
CREATE POLICY "Public read for events" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for holidays" ON holidays FOR SELECT USING (true);
CREATE POLICY "Public read for timings" ON timings FOR SELECT USING (true);
CREATE POLICY "Public read for courses" ON courses FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for staff_members" ON staff_members FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for class_schedules" ON class_schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for department_local_faculty" ON department_local_faculty FOR SELECT USING (is_active = true);
CREATE POLICY "Public insert for email_subscribers" ON email_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read for email_subscribers" ON email_subscribers FOR SELECT USING (true);
CREATE POLICY "Public read for active updates" ON department_updates FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full access on updates" ON department_updates USING (true) WITH CHECK (true);

-- ============================================================
-- REALTIME (safe — ignore if already added)
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'departments','department_data','notices','college_settings',
    'events','holidays','timings','courses','staff_members',
    'class_schedules','department_local_faculty','email_subscribers','department_updates'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- DEFAULT HEAD ADMIN
-- Username: admin  |  Password: admin123
-- CHANGE PASSWORD IMMEDIATELY after first login!
-- ============================================================
INSERT INTO head_admin (username, password, email)
VALUES ('admin', '$2b$10$rVxYvpYLQc6SxQJYw4b.XuGr5ILlMZQqX/KZL.qHNjKwH8LfKJ8Ku', 'admin@rksdcollege.ac.in')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- STORAGE BUCKET (manually karo Supabase Dashboard mein)
-- Storage → New Bucket → Name: updates-files → Public: ON
-- ============================================================
