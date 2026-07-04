'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import { api, getUser } from '../../../lib/api';
import { Pencil, X, Check, Upload, FileText } from 'lucide-react';

const TABS = ['Personal Info', 'Job Info', 'Salary Structure', 'Documents'];

function DetailField({ label, value, onChange, readonly, type = 'text', isTextArea = false }) {
  const readStyle = {
    background: 'rgba(139,92,246,0.04)',
    border: '1px solid rgba(139,92,246,0.1)',
    color: 'var(--t-text-muted)',
    borderRadius: 12,
    padding: '0.625rem 0.875rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  };
  const editStyle = {
    background: 'rgba(10,10,18,0.7)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(139,92,246,0.3)',
    color: '#e2e2f0',
    borderRadius: 12,
    padding: '0.625rem 0.875rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
    boxShadow: 'inset 3px 3px 7px rgba(0,0,0,0.4)',
  };

  return (
    <div>
      <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color: 'rgba(192,132,252,0.6)' }}>
        {label}
      </label>
      {isTextArea ? (
        <textarea rows={3} readOnly={readonly} style={readonly ? { ...readStyle, resize: 'none' } : { ...editStyle, resize: 'none' }}
          value={value || ''} onChange={(e) => !readonly && onChange && onChange(e.target.value)} />
      ) : (
        <input type={type} readOnly={readonly} style={readonly ? readStyle : editStyle}
          value={value || ''} onChange={(e) => !readonly && onChange && onChange(e.target.value)} />
      )}
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const [viewer, setViewer]           = useState(null);
  const [employee, setEmployee]       = useState(null);
  const [allEmployees, setAllEmps]    = useState([]);
  const [salary, setSalary]           = useState(null);
  const [msg, setMsg]                 = useState('');
  const [activeTab, setActiveTab]     = useState(TABS[0]);
  const [isEditing, setIsEditing]     = useState(false);
  const [form, setForm]               = useState({});
  const fileInputRef                  = useRef(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/signin'); return; }
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
          const [{ employees }, { salary }] = await Promise.all([api.listEmployees(), api.getSalary(id)]);
          setAllEmps(employees);
          setSalary(salary);
        } catch (_) {}
      }
    } catch (err) { setMsg(err.message); }
  }

  const isAdmin = viewer && ['admin', 'hr'].includes(viewer.role);
  const isSelf  = viewer && viewer.id === id;
  const canEdit = isAdmin || isSelf;

  async function handleSave(e) {
    e.preventDefault();
    try {
      const { employee: updated } = await api.updateEmployee(id, form);
      setEmployee(updated); setForm(updated); setIsEditing(false); setMsg('');
    } catch (err) { setMsg(err.message); }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setMsg('Uploading…');
      const { url } = await api.uploadFile(file);
      setForm({ ...form, about: (form.about || '') + `\n[Document]: ${url}` });
      setMsg('✓ File uploaded! Save to persist.');
    } catch (err) { setMsg(err.message); }
  }

  if (!employee) return null;

  const visibleTabs = TABS.filter(t => t !== 'Salary Structure' || isAdmin);
  const initials = `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">

        {/* Hero card */}
        <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white overflow-hidden"
              style={{
                background: 'var(--t-accent-grad)',
                boxShadow: '6px 6px 16px rgba(0,0,0,0.5), -2px -2px 8px rgba(255,255,255,0.04), 0 0 24px var(--t-accent-glow)',
              }}
            >
              {employee.profile_picture_url
                ? <img src={employee.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="mt-1" style={{ color: 'var(--t-text-label)' }}>
                {employee.designation || employee.role}
                {employee.department && <span style={{ color:'var(--t-text-dim)' }}> · {employee.department}</span>}
              </p>
              <p className="text-sm mt-1 font-mono" style={{ color: 'var(--t-text-dim)' }}>
                {employee.email} · {employee.login_id}
              </p>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 self-start sm:self-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              style={isEditing ? {
                background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#FCA5A5',
              } : {
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#e2e2f0',
                boxShadow:'3px 3px 8px rgba(0,0,0,0.4)',
              }}
            >
              {isEditing ? <><X className="w-4 h-4" />Cancel</> : <><Pencil className="w-4 h-4" />Edit Profile</>}
            </button>
          )}
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-2.5 text-sm" style={{
            background: msg.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'var(--t-accent-glow-sm)',
            border: msg.startsWith('✓') ? '1px solid rgba(16,185,129,0.25)' : '1px solid var(--t-border)',
            color: msg.startsWith('✓') ? '#10B981' : 'var(--t-accent-s)',
          }}>{msg}</div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 p-1 rounded-2xl shrink-0" style={{ background:'var(--t-surface2)', border:'1px solid var(--t-border)' }}>
          {visibleTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={activeTab === tab ? {
                background:'var(--t-accent-glow-sm)',
                boxShadow:'inset 2px 2px 6px rgba(0,0,0,0.4)',
                color:'var(--t-accent-s)',
                border:'1px solid var(--t-border)',
              } : { color:'var(--t-text-dim)', border:'1px solid transparent' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <form onSubmit={handleSave}>
          <div className="glass-card p-6">

            {activeTab === 'Personal Info' && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailField label="First Name"  value={form.first_name}  onChange={v => setForm({...form, first_name:v})}  readonly={!isEditing || !isAdmin} />
                <DetailField label="Last Name"   value={form.last_name}   onChange={v => setForm({...form, last_name:v})}   readonly={!isEditing || !isAdmin} />
                <DetailField label="Email"       value={form.email}       onChange={v => setForm({...form, email:v})}       readonly={!isEditing || !isAdmin} />
                <DetailField label="Phone"       value={form.phone}       onChange={v => setForm({...form, phone:v})}       readonly={!isEditing} />
                <DetailField label="Date of Birth" type="date" value={form.date_of_birth} onChange={v => setForm({...form, date_of_birth:v})} readonly={!isEditing || !isAdmin} />
                <DetailField label="Blood Group" value={form.blood_group} onChange={v => setForm({...form, blood_group:v})} readonly={!isEditing || !isAdmin} />
                <div className="sm:col-span-2">
                  <DetailField label="Residential Address" value={form.residential_address} onChange={v => setForm({...form, residential_address:v})} readonly={!isEditing} isTextArea />
                </div>
              </div>
            )}

            {activeTab === 'Job Info' && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailField label="Employee ID"   value={form.login_id}    readonly />
                <DetailField label="Department"    value={form.department}  onChange={v => setForm({...form, department:v})}  readonly={!isEditing || !isAdmin} />
                <DetailField label="Designation"   value={form.designation} onChange={v => setForm({...form, designation:v})} readonly={!isEditing || !isAdmin} />
                <DetailField label="Role"          value={form.role}        onChange={v => setForm({...form, role:v})}        readonly={!isEditing || !isAdmin} />
                {isAdmin ? (
                  <div>
                    <label className="block mb-1.5 text-xs font-medium tracking-widest uppercase" style={{ color:'rgba(192,132,252,0.6)' }}>Manager</label>
                    <select
                      className="glass-input w-full px-4 py-2.5 text-sm"
                      value={form.manager_id || ''}
                      onChange={e => isEditing && setForm({...form, manager_id:e.target.value})}
                      disabled={!isEditing}
                    >
                      <option value="">None</option>
                      {allEmployees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>
                  </div>
                ) : (
                  <DetailField label="Manager" value={employee.manager_id ? 'Assigned' : 'None'} readonly />
                )}
                <DetailField label="Date of Joining" value={form.date_of_joining} readonly />
                <DetailField label="Status"          value={form.status}           readonly />
              </div>
            )}

            {activeTab === 'Salary Structure' && isAdmin && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {salary ? (
                  <>
                    {[
                      ['Monthly Wage', `₹${salary.monthly_wage}`],
                      ['Yearly Wage',  `₹${salary.yearly_wage}`],
                      ['Basic Salary', `₹${salary.basic_salary}`],
                      ['HRA',          `₹${salary.house_rent_allowance}`],
                    ].map(([l, v]) => <DetailField key={l} label={l} value={v} readonly />)}
                  </>
                ) : (
                  <p style={{ color:'var(--t-text-dim)' }}>No salary structure defined.</p>
                )}
              </div>
            )}

            {activeTab === 'Documents' && (
              <div className="space-y-4">
                <p className="text-sm" style={{ color:'var(--t-text-muted)' }}>Upload identity or compliance documents.</p>
                {isEditing && (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
                      style={{
                        background: 'var(--t-accent-glow-sm)',
                        border: '1px solid var(--t-border)',
                        color: 'var(--t-accent-s)',
                        boxShadow: '3px 3px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Document
                    </button>
                  </>
                )}
                <div
                  className="rounded-xl p-4 whitespace-pre-wrap text-sm"
                  style={{
                    background: 'var(--t-code-bg)',
                    border: '1px solid var(--t-code-border)',
                    color: 'var(--t-text-muted)',
                    minHeight: 100,
                  }}
                >
                  {form.about?.includes('[Document]')
                    ? form.about.split('\n').filter(l => l.includes('[Document]')).map((l, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                          <FileText className="w-3.5 h-3.5" style={{ color:'var(--t-accent-s)' }} />
                          <span>{l.replace('[Document]: ', '')}</span>
                        </div>
                      ))
                    : 'No documents uploaded yet.'}
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="mt-4 flex justify-end">
              <button type="submit" className="btn-glow flex items-center gap-2 px-7 py-2.5 text-sm font-semibold text-white rounded-xl">
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
