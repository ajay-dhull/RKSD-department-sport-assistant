# 🚀 Supabase Setup Instructions

## ⚠️ IMPORTANT: You must complete this step for the admin panel to work!

The database tables need to be created in your Supabase project. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run the Database Schema

1. Open the file `supabase-schema.sql` in this project
2. Copy the ENTIRE content of the file
3. Paste it into the Supabase SQL Editor
4. Click the "Run" button (or press `Ctrl/Cmd + Enter`)

### Step 3: Verify Tables Were Created

After running the SQL, you should see a success message. To verify:

1. Go to "Table Editor" in Supabase
2. You should see these tables:
   - ✅ head_admin
   - ✅ departments
   - ✅ department_data
   - ✅ notices
   - ✅ college_settings
   - ✅ events
   - ✅ holidays
   - ✅ timings
   - ✅ courses
   - ✅ staff_members

### Step 4: Restart the Application

1. The application will automatically detect the tables
2. All features will now work:
   - ✅ Add Courses
   - ✅ Add Staff
   - ✅ Create Departments
   - ✅ Add Custom Information
   - ✅ Real-time updates

## Default Admin Credentials

After setup, you can login with:
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately after first login!

## Troubleshooting

### Error: "Could not find table in schema cache"
- **Solution**: Run the SQL schema in Supabase SQL Editor (Step 2 above)

### Error: "Relation already exists"
- **Solution**: Tables are already created. You're good to go!

### Error: "Permission denied"
- **Solution**: Make sure you're using the correct Supabase project and have admin access

## Need Help?

If you encounter any issues:
1. Make sure your Supabase environment variables are set correctly
2. Check that you selected the correct project in Supabase
3. Verify your internet connection
4. Try refreshing the Supabase schema cache by clicking the "Refresh" button in Table Editor

---

After completing these steps, all admin panel features will work perfectly! 🎉
