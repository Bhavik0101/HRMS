const supabase = require('../config/supabase');

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

// GET /api/timeoff/allocation  (current employee's own allocation, or ?employeeId= for admin)
async function getAllocation(req, res) {
  try {
    const isAdmin = ['admin', 'hr'].includes(req.user.role);
    const employeeId = (isAdmin && req.query.employeeId) || req.user.id;
    const year = new Date().getFullYear();

    let { data, error } = await supabase
      .from('timeoff_allocations')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('year', year)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      const { data: created, error: createErr } = await supabase
        .from('timeoff_allocations')
        .insert({ employee_id: employeeId, year })
        .select()
        .single();
      if (createErr) throw createErr;
      data = created;
    }

    res.json({ allocation: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch time off allocation' });
  }
}

// POST /api/timeoff/requests  (Employee applies for leave)
async function createRequest(req, res) {
  try {
    const employeeId = req.user.id;
    const { timeOffType, startDate, endDate, remarks, attachmentUrl } = req.body;

    if (!timeOffType || !startDate || !endDate) {
      return res.status(400).json({ error: 'timeOffType, startDate and endDate are required' });
    }
    if (!['paid_time_off', 'sick_leave', 'unpaid_leave'].includes(timeOffType)) {
      return res.status(400).json({ error: 'Invalid timeOffType' });
    }

    const daysRequested = daysBetween(startDate, endDate);

    const { data, error } = await supabase
      .from('timeoff_requests')
      .insert({
        employee_id: employeeId,
        time_off_type: timeOffType,
        start_date: startDate,
        end_date: endDate,
        days_requested: daysRequested,
        remarks,
        attachment_url: attachmentUrl,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({ request: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit time off request' });
  }
}

// GET /api/timeoff/requests  (Employee: own requests + direct reports; Admin/HR: all requests for the company)
async function listRequests(req, res) {
  try {
    const isAdmin = ['admin', 'hr'].includes(req.user.role);
    const userId = req.user.id;

    let query = supabase
      .from('timeoff_requests')
      .select('*, employees!timeoff_requests_employee_id_fkey(first_name,last_name,login_id,company_id,manager_id)')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      // Find if this user has any direct reports
      const { data: reports } = await supabase.from('employees').select('id').eq('manager_id', userId);
      const reportIds = (reports || []).map((r) => r.id);
      
      if (reportIds.length > 0) {
        query = query.or(`employee_id.eq.${userId},employee_id.in.(${reportIds.join(',')})`);
      } else {
        query = query.eq('employee_id', userId);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const filtered = isAdmin ? data.filter((r) => r.employees?.company_id === req.user.companyId) : data;

    res.json({ requests: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch time off requests' });
  }
}

// PATCH /api/timeoff/requests/:id  (Admin/HR approves or rejects)
async function reviewRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewerComments } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or rejected' });
    }

    const { data: reqRow, error: findErr } = await supabase
      .from('timeoff_requests')
      .select('*, employees!timeoff_requests_employee_id_fkey(manager_id)')
      .eq('id', id)
      .single();
    if (findErr) throw findErr;

    // Authorization Check
    const isAdmin = ['admin', 'hr'].includes(req.user.role);
    const isManager = reqRow.employees?.manager_id === req.user.id;
    if (!isAdmin && !isManager) {
      return res.status(403).json({ error: 'You are not authorized to review this request' });
    }

    const { data, error } = await supabase
      .from('timeoff_requests')
      .update({ status, reviewed_by: req.user.id, reviewer_comments: reviewerComments })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Deduct from allocation when approved
    if (status === 'approved') {
      const year = new Date(reqRow.start_date).getFullYear();
      const { data: allocation } = await supabase
        .from('timeoff_allocations')
        .select('*')
        .eq('employee_id', reqRow.employee_id)
        .eq('year', year)
        .maybeSingle();

      if (allocation) {
        const field =
          reqRow.time_off_type === 'paid_time_off'
            ? 'paid_time_off_used'
            : reqRow.time_off_type === 'sick_leave'
            ? 'sick_leave_used'
            : 'unpaid_leave_used';

        await supabase
          .from('timeoff_allocations')
          .update({ [field]: (allocation[field] || 0) + Number(reqRow.days_requested) })
          .eq('id', allocation.id);
      }

      await supabase.from('employees').update({ status: 'on_leave' }).eq('id', reqRow.employee_id);
    }

    res.json({ request: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to review time off request' });
  }
}

module.exports = { getAllocation, createRequest, listRequests, reviewRequest };
