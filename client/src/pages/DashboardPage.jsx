import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import {
  HoursByEmployeeChart,
  HoursOverTimeChart,
  MoodChart,
  ProjectPieChart,
} from '../components/Charts.jsx';

const MOOD_EMOJI = { 1: '😴', 2: '😕', 3: '😐', 4: '🙂', 5: '🔥' };
const inputCls =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

/* ------------------------------- Login ------------------------------- */
function Login({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth', { pin });
      sessionStorage.setItem('pm_pin', pin);
      onSuccess();
    } catch {
      setError('Incorrect PIN. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-4">
      <form onSubmit={submit} className="w-full rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-800">PM Dashboard</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Enter your PIN to continue.</p>
        <input
          type="password"
          autoFocus
          className={`${inputCls} w-full text-center text-lg tracking-widest`}
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        <button
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Checking…' : 'Unlock Dashboard'}
        </button>
        <Link to="/submit" className="mt-4 block text-center text-sm text-slate-400 hover:underline">
          ← Back to report form
        </Link>
      </form>
    </div>
  );
}

/* ------------------------------- KPIs -------------------------------- */
function Kpi({ label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent || 'text-slate-800'}`}>{value}</p>
    </div>
  );
}

/* -------------------------- Employee manager ------------------------- */
function EmployeeManager({ employees, reload }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/employees', { name });
      setName('');
      reload();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not add employee');
    }
  }

  async function remove(id) {
    if (!confirm('Remove this employee from the dropdown?')) return;
    await api.delete(`/employees/${id}`);
    reload();
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h3 className="text-sm font-semibold text-slate-700">Manage Employees</h3>
      <p className="text-xs text-slate-400">Names shown in the submission dropdown.</p>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className={`${inputCls} flex-1`} placeholder="Add employee name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">Add</button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <ul className="mt-3 divide-y divide-slate-100">
        {employees.map((e) => (
          <li key={e.id} className="flex items-center justify-between py-2 text-sm">
            <span>{e.name}</span>
            <button onClick={() => remove(e.id)} className="text-xs font-medium text-rose-500 hover:underline">
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Dashboard ---------------------------- */
function Dashboard({ onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', employee: '' });
  const [reminderMsg, setReminderMsg] = useState('');

  const loadEmployees = useCallback(() => {
    api.get('/employees').then((r) => setEmployees(r.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.employee) params.employee = filters.employee;
    api.get('/analytics', { params }).then((r) => setAnalytics(r.data)).catch(() => {});
    api.get('/reports', { params }).then((r) => setReports(r.data)).catch(() => {});
  }, [filters]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { load(); }, [load]);

  async function testReminder() {
    setReminderMsg('Sending…');
    try {
      const r = await api.post('/reminder');
      setReminderMsg(r.data?.ok ? '✅ Reminder sent to Slack!' : `⚠️ ${r.data?.error || 'Slack not configured'}`);
    } catch {
      setReminderMsg('⚠️ Failed to send reminder');
    }
    setTimeout(() => setReminderMsg(''), 5000);
  }

  if (!analytics) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading analytics…</div>;
  }

  const t = analytics.totals;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">PM Analytics Dashboard</h1>
          <p className="text-slate-500">Review team activity, workload and morale.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={testReminder} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Test Slack Reminder
          </button>
          <button onClick={onLogout} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Log out
          </button>
        </div>
      </div>
      {reminderMsg && <div className="mb-4 rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-700">{reminderMsg}</div>}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">From</span>
          <input type="date" className={inputCls} value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">To</span>
          <input type="date" className={inputCls} value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Employee</span>
          <select className={inputCls} value={filters.employee} onChange={(e) => setFilters((f) => ({ ...f, employee: e.target.value }))}>
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.name}>{e.name}</option>
            ))}
          </select>
        </label>
        <button onClick={() => setFilters({ from: '', to: '', employee: '' })} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Clear
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Reports" value={t.total_reports} />
        <Kpi label="Total Hours" value={t.total_hours} accent="text-indigo-600" />
        <Kpi label="Avg Hours/Report" value={t.avg_hours} />
        <Kpi label="Active People" value={t.active_employees} />
        <Kpi label="Avg Mood" value={`${MOOD_EMOJI[Math.round(t.avg_mood)] || ''} ${t.avg_mood}`} accent="text-amber-500" />
        <Kpi label="Avg Progress" value={`${t.avg_progress}%`} accent="text-emerald-600" />
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HoursByEmployeeChart data={analytics.hoursByEmployee} />
        <HoursOverTimeChart data={analytics.hoursByDate} />
        <MoodChart data={analytics.moodDistribution} />
        {analytics.hoursByProject.length > 0 && <ProjectPieChart data={analytics.hoursByProject} />}
      </div>

      {/* Blockers + Employee manager */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow">
          <h3 className="text-sm font-semibold text-slate-700">🚧 Active Blockers</h3>
          {analytics.blockers.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No blockers reported. 🎉</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {analytics.blockers.map((b) => (
                <li key={b.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700">{b.employee_name}</span>
                    <span className="text-xs text-slate-400">{b.date} · {b.project}</span>
                  </div>
                  <p className="mt-1 text-slate-600">{b.blockers}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <EmployeeManager employees={employees} reload={loadEmployees} />
      </div>

      {/* Reports table */}
      <div className="rounded-2xl bg-white p-5 shadow">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">All Reports ({reports.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Employee</th>
                <th className="py-2 pr-3">Project</th>
                <th className="py-2 pr-3">Work Done</th>
                <th className="py-2 pr-3">Hrs</th>
                <th className="py-2 pr-3">Mood</th>
                <th className="py-2 pr-3">Progress</th>
                <th className="py-2 pr-3">Blockers</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 align-top hover:bg-slate-50">
                  <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{r.date}</td>
                  <td className="py-2 pr-3 whitespace-nowrap font-medium">{r.employee_name}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.project}</td>
                  <td className="py-2 pr-3 max-w-xs text-slate-600">{r.work_done}</td>
                  <td className="py-2 pr-3">{r.hours}</td>
                  <td className="py-2 pr-3 text-lg">{MOOD_EMOJI[r.mood]}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${r.progress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{r.progress}%</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 max-w-[12rem] text-slate-500">
                    {r.blockers?.toLowerCase() === 'none' ? <span className="text-slate-300">—</span> : r.blockers}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">No reports match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState(Boolean(sessionStorage.getItem('pm_pin')));

  function logout() {
    sessionStorage.removeItem('pm_pin');
    setAuthed(false);
  }

  return authed ? <Dashboard onLogout={logout} /> : <Login onSuccess={() => setAuthed(true)} />;
}
