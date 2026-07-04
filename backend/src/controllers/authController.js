const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { generateLoginId } = require('../utils/loginId');

// Generates a random temporary password the first time a user is created
// by an HR officer/Admin, matching the wireframe note:
// "Their password should be system generated for the first time."
function generateTempPassword() {
  return Math.random().toString(36).slice(-8) + '@1A';
}

function signToken(employee) {
  return jwt.sign(
    {
      id: employee.id,
      loginId: employee.login_id,
      role: employee.role,
      companyId: employee.company_id,
      email: employee.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeEmployee(emp) {
  const { password_hash, ...rest } = emp;
  return rest;
}

// -----------------------------------------------------------------------
// POST /api/auth/signup
// Used the FIRST time a company registers (creates company + first Admin).
// Body: { companyName, firstName, lastName, email, phone, password }
// -----------------------------------------------------------------------
async function signup(req, res) {
  try {
    const { companyName, firstName, lastName, email, phone, password } = req.body;

    if (!companyName || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'companyName, firstName, lastName, email and password are required' });
    }

    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .insert({ company_name: companyName })
      .select()
      .single();
    if (companyErr) throw companyErr;

    const joiningYear = new Date().getFullYear();
    const loginId = await generateLoginId({ companyName, firstName, lastName, joiningYear });
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: employee, error: empErr } = await supabase
      .from('employees')
      .insert({
        company_id: company.id,
        login_id: loginId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password_hash: passwordHash,
        role: 'admin', // First user to sign up is the company Admin/HR Officer
        must_change_password: false,
        status: 'present',
      })
      .select()
      .single();
    if (empErr) throw empErr;

    await supabase.from('salary_structures').insert({ employee_id: employee.id });
    await supabase.from('timeoff_allocations').insert({ employee_id: employee.id });

    const token = signToken(employee);
    res.status(201).json({ token, user: sanitizeEmployee(employee) });
  } catch (err) {
    console.error('signup error', err);
    res.status(500).json({ error: 'Failed to sign up', details: err.message });
  }
}

// -----------------------------------------------------------------------
// POST /api/auth/signin
// Body: { loginIdOrEmail, password }
// -----------------------------------------------------------------------
async function signin(req, res) {
  try {
    const { loginIdOrEmail, password } = req.body;
    if (!loginIdOrEmail || !password) {
      return res.status(400).json({ error: 'loginIdOrEmail and password are required' });
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .or(`email.eq.${loginIdOrEmail},login_id.eq.${loginIdOrEmail}`)
      .maybeSingle();

    if (error) throw error;
    if (!employee) {
      return res.status(401).json({ error: 'Invalid Login ID/Email or password' });
    }

    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid Login ID/Email or password' });
    }

    const token = signToken(employee);
    res.json({
      token,
      user: sanitizeEmployee(employee),
      mustChangePassword: employee.must_change_password,
    });
  } catch (err) {
    console.error('signin error', err);
    res.status(500).json({ error: 'Failed to sign in', details: err.message });
  }
}

// -----------------------------------------------------------------------
// POST /api/auth/change-password  (authenticated)
// -----------------------------------------------------------------------
async function changePassword(req, res) {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'newPassword must be at least 6 characters' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from('employees')
      .update({ password_hash: passwordHash, must_change_password: false })
      .eq('id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('changePassword error', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

// -----------------------------------------------------------------------
// GET /api/auth/me  (authenticated) - returns current logged in profile
// -----------------------------------------------------------------------
async function me(req, res) {
  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({ user: sanitizeEmployee(employee) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
}

module.exports = { signup, signin, changePassword, me, generateTempPassword, signToken, sanitizeEmployee };
