# Supabase Setup Instructions

## Step 1: Run the Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire content from `supabase-schema.sql` file
6. Paste it into the SQL Editor
7. Click "Run" button

This will create all necessary tables for your college management system.

## Step 2: Change Default Admin Password

The default admin credentials are:
- **Username**: `admin`
- **Password**: `admin123`

**IMPORTANT**: Change this password immediately for security!

To change the password:
1. Go to SQL Editor in Supabase
2. Run this query with your new password:
```sql
UPDATE head_admin 
SET password = crypt('YOUR_NEW_PASSWORD', gen_salt('bf'))
WHERE username = 'admin';
```

## Step 3: Enable Realtime

1. Go to "Database" → "Replication" in Supabase Dashboard
2. Enable realtime for these tables:
   - departments
   - department_data
   - notices
   - college_settings
   - events
   - holidays
   - timings

## Tables Created

### Core Tables:
- **head_admin**: Main admin users
- **departments**: Department information and credentials
- **department_data**: All department-specific data
- **notices**: College-wide and department notices
- **events**: College and department events
- **college_settings**: General college information
- **holidays**: College holidays
- **timings**: Facility timings (library, labs, etc.)
- **courses**: College courses and programs (UG, PG, Diploma, etc.)
- **staff_members**: Staff and faculty information

## Features Enabled:
✅ Real-time updates across all panels
✅ Row Level Security (RLS) for data protection
✅ Public read access for notices and events
✅ UUID-based primary keys
✅ Automatic timestamps
✅ Indexed columns for fast queries

## Environment Variables Already Set:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Your system is ready to use!
