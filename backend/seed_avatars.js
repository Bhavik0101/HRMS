const supabase = require('./src/config/supabase');

async function run() {
  console.log('Fetching employees...');
  const { data: employees, error } = await supabase.from('employees').select('id, login_id');
  if (error) {
    console.error('Error fetching employees:', error);
    process.exit(1);
  }

  for (const emp of employees) {
    const avatarUrl = `https://i.pravatar.cc/150?u=${emp.login_id}`;
    console.log(`Setting avatar for ${emp.login_id}: ${avatarUrl}`);
    const { error: updateError } = await supabase
      .from('employees')
      .update({ profile_picture_url: avatarUrl })
      .eq('id', emp.id);
    
    if (updateError) {
      console.error(`Error updating ${emp.login_id}:`, updateError);
    }
  }

  console.log('All avatars updated successfully!');
  process.exit(0);
}

run();
