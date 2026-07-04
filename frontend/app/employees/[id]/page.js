'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import { api, getUser } from '../../../lib/api';

const TABS = ['Personal Info', 'Job Info', 'Salary Structure', 'Documents'];

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [viewer, setViewer] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [salary, setSalary] = useState(null);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace('/signin');
      return;
    }
    setViewer(u);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      const { employee: emp } = await api.getEmployee(id);
      setEmployee(emp);
      setForm(emp);
      const u = getUser();
      if (['admin', 'hr'].includes(u.role)) {
        try {
          const { employees } = await api.listEmployees();
          setAllEmployees(employees);
          const { salary } = await api.getSalary(id);
          setSalary(salary);
        } catch (_) {}
      }
    } catch (err) {
      setMsg(err.message);
    }
  }

  const isAdmin = viewer && ['admin', 'hr'].includes(viewer.role);
  const isSelf = viewer && viewer.id === id;
  const canEdit = isAdmin || isSelf;

  async function handleSave(e) {
    e.preventDefault();
    try {
      const { employee: updated } = await api.updateEmployee(id, form);
      setEmployee(updated);
      setForm(updated);
      setIsEditing(false);
      setMsg('');
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setMsg('Uploading file...');
      const { url } = await api.uploadFile(file);
      // For demo, we'll store the document URL in a JSON field or just append to 'documents' if it existed.
      // Since 'documents' field doesn't exist in the schema, we'll store it in 'about' or a custom field.
      // Assuming we can append to the 'about' field to simulate a document link.
      const newAbout = (form.about || '') + `\n[Document]: ${url}`;
      setForm({ ...form, about: newAbout });
      setMsg('File uploaded! Please Save to persist.');
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!employee) return null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-3xl font-semibold text-white overflow-hidden">
                {employee.profile_picture_url ? (
                  <img src={employee.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <>{employee.first_name?.[0]}{employee.last_name?.[0]}</>
                )}
              </div>
            </div>
            <div>
              <h1 className="font-display text-3xl text-white">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-gray-400 mt-1">
                {employee.designation || employee.role} · {employee.department}
              </p>
              <p className="text-sm text-gray-500 mt-1">{employee.email} | {employee.login_id}</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-lg bg-panel2 px-4 py-2 text-sm font-semibold text-white transition hover:bg-line"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          )}
        </div>

        {msg && <p className="mb-4 text-sm text-accent">{msg}</p>}

        <div className="flex gap-4 border-b border-line mb-6">
          {TABS.map((tab) => (
            (tab === 'Salary Structure' && !isAdmin) ? null : (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition border-b-2 ${
                  activeTab === tab ? 'border-accent2 text-accent2' : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            )
          ))}
        </div>

        <form onSubmit={handleSave}>
          <div className="bg-panel rounded-xl border border-line p-6">
            {activeTab === 'Personal Info' && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="First Name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} readonly={!isEditing || (!isAdmin)} />
                <Field label="Last Name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} readonly={!isEditing || (!isAdmin)} />
                <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} readonly={!isEditing || (!isAdmin)} />
                <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} readonly={!isEditing} />
                <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} readonly={!isEditing || (!isAdmin)} />
                <Field label="Blood Group" value={form.blood_group} onChange={(v) => setForm({ ...form, blood_group: v })} readonly={!isEditing || (!isAdmin)} />
                <div className="sm:col-span-2">
                  <Field label="Residential Address" value={form.residential_address} onChange={(v) => setForm({ ...form, residential_address: v })} readonly={!isEditing} isTextArea />
                </div>
              </div>
            )}

            {activeTab === 'Job Info' && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="Employee ID" value={form.login_id} readonly />
                <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} readonly={!isEditing || !isAdmin} />
                <Field label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} readonly={!isEditing || !isAdmin} />
                <Field label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} readonly={!isEditing || !isAdmin} />
                {isAdmin ? (
                  <div>
                    <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1.5">Manager</label>
                    <select
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                        !isEditing ? 'bg-panel border-transparent text-gray-300' : 'bg-panel2 border-line text-white focus:border-accent'
                      }`}
                      value={form.manager_id || ''}
                      onChange={(e) => isEditing && setForm({ ...form, manager_id: e.target.value })}
                      disabled={!isEditing}
                    >
                      <option value="">None</option>
                      {allEmployees.map(e => (
                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <Field label="Manager" value={employee.manager_id ? 'Assigned' : 'None'} readonly />
                )}
                <Field label="Date of Joining" value={form.date_of_joining} readonly />
                <Field label="Status" value={form.status} readonly />
              </div>
            )}

            {activeTab === 'Salary Structure' && isAdmin && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {salary ? (
                  <>
                    <Field label="Monthly Wage" value={`₹${salary.monthly_wage}`} readonly />
                    <Field label="Yearly Wage" value={`₹${salary.yearly_wage}`} readonly />
                    <Field label="Basic Salary" value={`₹${salary.basic_salary}`} readonly />
                    <Field label="HRA" value={`₹${salary.house_rent_allowance}`} readonly />
                  </>
                ) : (
                  <p className="text-gray-500">No salary structure defined.</p>
                )}
              </div>
            )}

            {activeTab === 'Documents' && (
              <div>
                <p className="text-gray-400 mb-4 text-sm">Upload identity or compliance documents.</p>
                {isEditing && (
                  <div className="mb-6">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg bg-panel2 border border-line px-4 py-2 text-sm text-white hover:bg-line transition"
                    >
                      Upload New Document
                    </button>
                  </div>
                )}
                
                <div className="bg-panel2 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-300">
                  {form.about?.includes('[Document]') ? form.about : 'No documents uploaded yet.'}
                </div>
              </div>
            )}

          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button type="submit" className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-6 py-2.5 text-sm font-semibold text-white">
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}

function Field({ label, value, onChange, readonly, type = 'text', isTextArea = false }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1.5">{label}</label>
      {isTextArea ? (
        <textarea
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
            readonly ? 'bg-panel border-transparent text-gray-300' : 'bg-panel2 border-line text-white focus:border-accent'
          }`}
          value={value || ''}
          onChange={(e) => !readonly && onChange && onChange(e.target.value)}
          readOnly={readonly}
          rows={3}
        />
      ) : (
        <input
          type={type}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
            readonly ? 'bg-panel border-transparent text-gray-300' : 'bg-panel2 border-line text-white focus:border-accent'
          }`}
          value={value || ''}
          onChange={(e) => !readonly && onChange && onChange(e.target.value)}
          readOnly={readonly}
        />
      )}
    </div>
  );
}
