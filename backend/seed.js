require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('Seeding Demo Database...');

  // 1. Delete all existing employees (which cascades to timeoff, attendance, etc.)
  console.log('Clearing old data...');
  await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // deletes everything
  await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // deletes everything

  // 2. Create Company
  const { data: company, error: cErr } = await supabase.from('companies').insert({
    company_name: 'Acme Corp',
  }).select().single();
  if (cErr) throw cErr;

  // Generate generic password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. Create Users
  const usersToCreate = [
    { first_name: 'Admin', last_name: 'User', email: 'admin@acme.com', role: 'admin', designation: 'Administrator', department: 'Management', login_id: 'ACADMI20260001' },
    { first_name: 'HR', last_name: 'User', email: 'hr@acme.com', role: 'hr', designation: 'HR Officer', department: 'Human Resources', login_id: 'ACHRUS20260002' },
    { first_name: 'Alice', last_name: 'Manager', email: 'manager@acme.com', role: 'employee', designation: 'Engineering Manager', department: 'Engineering', login_id: 'ACALMA20260003' },
    { first_name: 'Bob', last_name: 'Developer', email: 'employee1@acme.com', role: 'employee', designation: 'Software Engineer', department: 'Engineering', login_id: 'ACBODE20260004' },
    { first_name: 'Charlie', last_name: 'Designer', email: 'employee2@acme.com', role: 'employee', designation: 'Product Designer', department: 'Design', login_id: 'ACCHDE20260005' }
  ];

  const createdUsers = {};
  for (const u of usersToCreate) {
    const { data: emp, error: eErr } = await supabase.from('employees').insert({
      company_id: company.id,
      ...u,
      password_hash: passwordHash,
      must_change_password: false,
      status: 'present'
    }).select().single();
    if (eErr) throw eErr;
    createdUsers[u.first_name] = emp;

    // Create default salary/timeoff alloc
    await supabase.from('salary_structures').insert({ employee_id: emp.id });
    await supabase.from('timeoff_allocations').insert({ employee_id: emp.id });
  }

  // 4. Assign Manager
  await supabase.from('employees')
    .update({ manager_id: createdUsers['Alice'].id })
    .in('id', [createdUsers['Bob'].id, createdUsers['Charlie'].id]);

  console.log('Manager assigned to Bob and Charlie');

  // 5. Create Sample Time Off Requests
  const today = new Date();
  const tmrw = new Date(today); tmrw.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

  await supabase.from('timeoff_requests').insert([
    {
      employee_id: createdUsers['Bob'].id,
      time_off_type: 'paid_time_off',
      start_date: tmrw.toISOString().split('T')[0],
      end_date: tmrw.toISOString().split('T')[0],
      days_requested: 1,
      remarks: 'Doctor appointment',
      status: 'pending'
    },
    {
      employee_id: createdUsers['Charlie'].id,
      time_off_type: 'sick_leave',
      start_date: nextWeek.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      days_requested: 1,
      remarks: 'Feeling unwell',
      status: 'pending'
    }
  ]);

  console.log('Sample time off requests created');

  console.log('✅ Demo Database Seeded Successfully!');
  console.log('----------------------------------------------------');
  console.log('Login credentials (password for all is "password123"):');
  console.log('Admin  : ', createdUsers['Admin'].login_id);
  console.log('HR     : ', createdUsers['HR'].login_id);
  console.log('Manager: ', createdUsers['Alice'].login_id);
  console.log('Emp 1  : ', createdUsers['Bob'].login_id);
  console.log('Emp 2  : ', createdUsers['Charlie'].login_id);
  console.log('----------------------------------------------------');
}

run().catch(console.error);
