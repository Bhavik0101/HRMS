const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { generateLoginId } = require('../utils/loginId');
const { generateTempPassword, sanitizeEmployee } = require('./authController');

// GET /api/employees  (Admin/HR: all employees in the company; Employee: only self)
async function listEmployees(req, res) {
  try {
    const { companyId, role, id } = req.user;
    let query = supabase.from('employees').select('*').eq('company_id', companyId).order('created_at');
    if (!['admin', 'hr'].includes(role)) {
      query = query.eq('id', id);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ employees: data.map(sanitizeEmployee) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
}

// GET /api/employees/:id  (view-only for others, editable for self/admin - enforced on frontend)
async function getEmployee(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
    if (error) throw error;
    res.json({ employee: sanitizeEmployee(data) });
  } catch (err) {
    res.status(404).json({ error: 'Employee not found' });
  }
}

// POST /api/employees  (Admin/HR creates a new employee -> system-generated Login ID + temp password)
async function createEmployee(req, res) {
  try {
    const { companyId } = req.user;
    const { firstName, lastName, email, phone, role, department, designation } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName and email are required' });
    }

    const { data: company } = await supabase.from('companies').select('company_name').eq('id', companyId).single();
    const joiningYear = new Date().getFullYear();
    const loginId = await generateLoginId({
      companyName: company?.company_name,
      firstName,
      lastName,
      joiningYear,
    });
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        company_id: companyId,
        login_id: loginId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password_hash: passwordHash,
        role: role || 'employee',
        department,
        designation,
        must_change_password: true,
        status: 'absent',
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from('salary_structures').insert({ employee_id: employee.id });
    await supabase.from('timeoff_allocations').insert({ employee_id: employee.id });

    // NOTE: In production, email the tempPassword + loginId to the employee instead of returning it.
    res.status(201).json({
      employee: sanitizeEmployee(employee),
      loginId,
      temporaryPassword: tempPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create employee', details: err.message });
  }
}

// PUT /api/employees/:id  (Admin can edit all fields; employee can edit limited fields)
const EMPLOYEE_SELF_EDITABLE_FIELDS = [
  'phone',
  'residential_address',
  'profile_picture_url',
  'about',
  'skills',
  'certifications',
  'interests_hobbies',
  'what_i_love_about_my_job',
];

const ADMIN_EDITABLE_EXTRA_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'department',
  'designation',
  'manager_id',
  'date_of_birth',
  'personal_email',
  'blood_group',
  'role',
  'is_active',
];

async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = ['admin', 'hr'].includes(req.user.role);
    const isSelf = req.user.id === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'You are not allowed to edit this profile' });
    }

    const allowedFields = isAdmin
      ? [...EMPLOYEE_SELF_EDITABLE_FIELDS, ...ADMIN_EDITABLE_EXTRA_FIELDS]
      : EMPLOYEE_SELF_EDITABLE_FIELDS;

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No editable fields provided' });
    }

    const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json({ employee: sanitizeEmployee(data) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
}

// GET /api/employees/:id/salary  (Admin only per wireframe: "Salary Info tab should only be visible to Admin")
async function getSalary(req, res) {
  try {
    const { id } = req.params;
    if (!['admin', 'hr'].includes(req.user.role) && req.user.id !== id) {
      return res.status(403).json({ error: 'Not authorized to view this salary information' });
    }
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Salary details are visible to Admin/HR only' });
    }
    const { data, error } = await supabase.from('salary_structures').select('*').eq('employee_id', id).single();
    if (error) throw error;
    res.json({ salary: data });
  } catch (err) {
    res.status(404).json({ error: 'Salary structure not found' });
  }
}

// PUT /api/employees/:id/salary  (Admin only)
async function updateSalary(req, res) {
  try {
    const { id } = req.params;
    const {
      monthlyWage,
      yearlyWage,
      compensationType,
      basicSalary,
      houseRentAllowance,
      standardAllowance,
      performanceBonus,
      leaveTravelAllowance,
      foodAllowance,
      providentFundRate,
      professionalTax,
      numberOfWorkingDays,
    } = req.body;

    const updates = {
      monthly_wage: monthlyWage,
      yearly_wage: yearlyWage,
      compensation_type: compensationType,
      basic_salary: basicSalary,
      house_rent_allowance: houseRentAllowance,
      standard_allowance: standardAllowance,
      performance_bonus: performanceBonus,
      leave_travel_allowance: leaveTravelAllowance,
      food_allowance: foodAllowance,
      provident_fund_rate: providentFundRate,
      professional_tax: professionalTax,
      number_of_working_days: numberOfWorkingDays,
    };
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const { data, error } = await supabase
      .from('salary_structures')
      .update(updates)
      .eq('employee_id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ salary: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update salary structure' });
  }
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  getSalary,
  updateSalary,
};
