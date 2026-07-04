const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hrms_token');
}

export function setToken(token) {
  if (typeof window !== 'undefined') localStorage.setItem('hrms_token', token);
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
  }
}

export function setUser(user) {
  if (typeof window !== 'undefined') localStorage.setItem('hrms_user', JSON.stringify(user));
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('hrms_user');
  return raw ? JSON.parse(raw) : null;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body, auth: false }),
  signin: (body) => request('/auth/signin', { method: 'POST', body, auth: false }),
  changePassword: (body) => request('/auth/change-password', { method: 'POST', body }),
  me: () => request('/auth/me'),

  listEmployees: () => request('/employees'),
  getEmployee: (id) => request(`/employees/${id}`),
  createEmployee: (body) => request('/employees', { method: 'POST', body }),
  updateEmployee: (id, body) => request(`/employees/${id}`, { method: 'PUT', body }),
  getSalary: (id) => request(`/employees/${id}/salary`),
  updateSalary: (id, body) => request(`/employees/${id}/salary`, { method: 'PUT', body }),

  checkIn: () => request('/attendance/check-in', { method: 'POST' }),
  checkOut: () => request('/attendance/check-out', { method: 'POST' }),
  listAttendance: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/attendance${qs ? `?${qs}` : ''}`);
  },

  getAllocation: (employeeId) =>
    request(`/timeoff/allocation${employeeId ? `?employeeId=${employeeId}` : ''}`),
  listTimeoffRequests: () => request('/timeoff/requests'),
  createTimeoffRequest: (body) => request('/timeoff/requests', { method: 'POST', body }),
  reviewTimeoffRequest: (id, body) => request(`/timeoff/requests/${id}`, { method: 'PATCH', body }),
};
