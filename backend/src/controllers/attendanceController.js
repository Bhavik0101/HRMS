const supabase = require('../config/supabase');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// POST /api/attendance/check-in  (employee marks their own attendance)
async function checkIn(req, res) {
  try {
    const employeeId = req.user.id;
    const date = todayStr();

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', date)
      .maybeSingle();

    if (existing && existing.check_in) {
      return res.status(409).json({ error: 'Already checked in today' });
    }

    const now = new Date().toISOString();
    let record;
    if (existing) {
      const { data, error } = await supabase
        .from('attendance')
        .update({ check_in: now, status: 'present' })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      record = data;
    } else {
      const { data, error } = await supabase
        .from('attendance')
        .insert({ employee_id: employeeId, attendance_date: date, check_in: now, status: 'present' })
        .select()
        .single();
      if (error) throw error;
      record = data;
    }

    await supabase.from('employees').update({ status: 'present' }).eq('id', employeeId);

    res.json({ attendance: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in' });
  }
}

// POST /api/attendance/check-out
async function checkOut(req, res) {
  try {
    const employeeId = req.user.id;
    const date = todayStr();

    const { data: existing, error: findErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', date)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!existing || !existing.check_in) {
      return res.status(400).json({ error: 'You must check in before checking out' });
    }
    if (existing.check_out) {
      return res.status(409).json({ error: 'Already checked out today' });
    }

    const now = new Date();
    const checkInTime = new Date(existing.check_in);
    const totalHours = (now - checkInTime) / (1000 * 60 * 60);
    const standardHours = 8;
    const workHours = Math.min(totalHours, standardHours);
    const extraHours = Math.max(totalHours - standardHours, 0);

    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: now.toISOString(),
        work_hours: Number(workHours.toFixed(2)),
        extra_hours: Number(extraHours.toFixed(2)),
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;

    res.json({ attendance: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check out' });
  }
}

// GET /api/attendance?employeeId=&date=&from=&to=
// Employees only see their own; Admin/HR can see anyone's (or all, for a given day)
async function listAttendance(req, res) {
  try {
    const { employeeId, date, from, to } = req.query;
    const isAdmin = ['admin', 'hr'].includes(req.user.role);

    let query = supabase.from('attendance').select('*, employees(first_name,last_name,login_id)');

    if (!isAdmin) {
      query = query.eq('employee_id', req.user.id);
    } else if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (date) query = query.eq('attendance_date', date);
    if (from) query = query.gte('attendance_date', from);
    if (to) query = query.lte('attendance_date', to);

    query = query.order('attendance_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    res.json({ attendance: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
}

module.exports = { checkIn, checkOut, listAttendance };
