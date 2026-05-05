import { supabase } from './supabase';

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('departments').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.log('⚠️ Supabase tables may not exist yet. Please run the SQL schema.');
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

export async function seedInitialData() {
  try {
    console.log('🔄 Seeding initial college data...');
    
    // Check if college settings already exist
    const { data: existing } = await supabase
      .from('college_settings')
      .select('key')
      .eq('key', 'college_basic_info')
      .single();
    
    if (existing) {
      console.log('ℹ️ Initial data already exists, skipping seed');
      return true;
    }

    // Insert basic college info
    const { error: collegeError } = await supabase
      .from('college_settings')
      .insert({
        key: 'college_basic_info',
        value: {
          name: "R.K.S.D. (PG) College, Kaithal",
          established_year: 1954,
          principal: "Dr. Rajbir Parashar",
          address: "Ambala Road, Kaithal, Haryana, India - PIN 136027",
          phone: "+91-1746-222368"
        }
      });

    if (collegeError) {
      console.error('Error seeding college info:', collegeError);
      return false;
    }

    console.log('✅ Initial data seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return false;
  }
}
