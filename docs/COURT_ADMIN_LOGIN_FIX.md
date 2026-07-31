# Court Admin Login Fix - Step by Step Instructions

## Problem Solved
✅ Schema file updated with correct password hash for `admin123`
✅ Old duplicate admin panel file deleted

## To Fix Login Issue

### Option 1: Update Existing Admin Password in Database (QUICKEST)

If you already have the database setup, run this in Supabase SQL Editor:

```sql
UPDATE court_main_admin 
SET password = '$2b$10$2S.wv7lMYqwbH6RfQrK/kurTMIBV2h7gloOdm3KPgiM/EFybylLzm'
WHERE username = 'admin';
```

### Option 2: Fresh Database Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy entire content from `court-admin-supabase-schema-fixed.sql` file
6. Paste in SQL Editor
7. Click "Run" button

This will create all tables with correct admin credentials.

## Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

## Files Status

✅ `client/src/pages/court-admin-main.tsx` - Main admin panel (ACTIVE)
✅ `client/src/pages/court-admin-login.tsx` - Login page (ACTIVE)
❌ `client/src/pages/court-admin.tsx` - DELETED (was duplicate/old version)

## Routes

- Login: `/court-admin-login`
- Admin Panel: `/court-admin`

---

**Important**: After running the SQL, try logging in with username `admin` and password `admin123`.
