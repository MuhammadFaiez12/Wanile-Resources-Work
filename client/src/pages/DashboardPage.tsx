import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useOverview, useEmployeeStats, useMonthlyData, useTeamData, useAnalytics } from '../hooks/useDashboard';
import { useEmployees, useCreateEmployee, useDeactivateEmployee } from '../hooks/useEmployees';
import { useReports, useDeleteReport } from '../hooks/useReports';
import { authApi } from '../api/auth.api';
import { dashboardApi } from '../api/dashboard.api';
import { reportsApi } from '../api/reports.api';
import { StatCard } from '../components/ui/StatCard';
import { Alert } from '../components/ui/Alert';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCardsGridSkeleton } from '../components/skeletons/StatCardSkeleton';
import { TableSkeleton } from '../components/skeletons/TableSkeleton';
import { ChartSkeleton } from '../components/skeletons/ChartSkeleton';
import {
  HoursByEmployeeChart,
  HoursOverTimeChart,
  MoodChart,
  ProjectPieChart,
} from '../components/Charts';

const MOOD_EMOJI: Record<number, string> = { 1: '😴', 2: '😕', 3: '😐', 4: '🙂', 5: '🔥' };

const inputCls =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginView({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const verify = useMutation({
    mutationFn: (p: string) => authApi.verify(p),
    onSuccess: (data) => {
      if (data.ok) {
        sessionStorage.setItem('pm_pin', pin);
        onSuccess();
      }
    },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-4">
      <form
        onSubmit={(e) => { e.preventDefault(); verify.mutate(pin); }}
        className="w-full rounded-2xl bg-white p-8 shadow-xl"
      >
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
        {verify.isError && <Alert type="error" message="Incorrect PIN. Try again." />}
        {verify.data && !verify.data.ok && <Alert type="error" message="Incorrect PIN. Try again." />}
        <button
          disabled={verify.isPending}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {verify.isPending ? 'Checking…' : 'Unlock Dashboard'}
        </button>
        <Link to="/submit" className="mt-4 block text-center text-sm text-slate-400 hover:underline">
          ← Back to report form
        </Link>
      </form>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data, isLoading, isError } = useOverview();
  if (isLoading) return (
    <div className="space-y-6">
      <StatCardsGridSkeleton count={4} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton /><ChartSkeleton />
      </div>
    </div>
  );
  if (isError || !data) return <Alert type="error" message="Failed to load overview." />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Employees" value={data.total} />
        <StatCard label="Submitted Today" value={data.submitted.length} accent="text-emerald-600" />
        <StatCard label="Missing" value={data.missing.length} accent="text-rose-600" />
        <StatCard label="Avg Mood" value={data.avgMood ? `${MOOD_EMOJI[Math.round(Number(data.avgMood))]} ${data.avgMood}` : '—'} accent="text-amber-500" />
      </div>
      {data.submitted.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">✅ Submitted ({data.submitted.length})</h3>
          <div className="flex flex-wrap gap-2">
            {data.submitted.map((n) => (
              <span key={n} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">{n}</span>
            ))}
          </div>
        </div>
      )}
      {data.missing.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">⚠️ Not Yet Submitted ({data.missing.length})</h3>
          <div className="flex flex-wrap gap-2">
            {data.missing.map((n) => (
              <span key={n} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">{n}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Employee ────────────────────────────────────────────────────────────

function EmployeeTab() {
  const { data: employees = [] } = useEmployees();
  const [selected, setSelected] = useState('');
  const { data, isLoading, isError } = useEmployeeStats(selected);

  return (
    <div className="space-y-5">
      <select
        className={`${inputCls} max-w-xs`}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Select employee…</option>
        {employees.map((e) => (
          <option key={e._id || e.id} value={e.name}>{e.name}</option>
        ))}
      </select>

      {!selected && <p className="text-slate-400">Select an employee to view their stats.</p>}

      {isLoading && selected && (
        <div className="space-y-4">
          <StatCardsGridSkeleton count={4} />
          <TableSkeleton rows={6} cols={5} />
        </div>
      )}

      {isError && <Alert type="error" message="Failed to load employee data." />}

      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Reports" value={data.stats.total} />
            <StatCard label="Avg Hours" value={data.stats.avgHours} accent="text-indigo-600" />
            <StatCard label="Avg Progress" value={`${data.stats.avgProgress}%`} accent="text-emerald-600" />
            <StatCard label="Blockers" value={data.stats.blockers} accent="text-amber-600" />
          </div>
          <div className="rounded-2xl bg-white p-5 shadow">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Last {data.reports.length} Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                    {['Date', 'Project', 'Hours', 'Progress', 'Mood', 'Blockers'].map((h) => (
                      <th key={h} className="py-2 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.reports.map((r) => (
                    <tr key={r._id || r.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{r.date}</td>
                      <td className="py-2 pr-3">{r.project_task}</td>
                      <td className="py-2 pr-3">{r.hours_spent}h</td>
                      <td className="py-2 pr-3"><ProgressBar value={r.progress_percent} /></td>
                      <td className="py-2 pr-3 text-lg">{MOOD_EMOJI[r.mood]}</td>
                      <td className="py-2 pr-3 max-w-xs text-slate-500 text-xs">
                        {r.blockers?.toLowerCase() === 'none' ? <span className="text-slate-300">—</span> : r.blockers}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Monthly ─────────────────────────────────────────────────────────────

function MonthlyTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading, isError } = useMonthlyData(month, year);

  const pin = sessionStorage.getItem('pm_pin') || '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Month</span>
          <select className={inputCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Year</span>
          <input
            type="number"
            className={inputCls}
            style={{ width: 90 }}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
        <a
          href={`${reportsApi.exportCSVUrl(month, year)}&x-pm-pin=${pin}`}
          download
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      {isLoading && <TableSkeleton rows={5} cols={6} />}
      {isError && <Alert type="error" message="Failed to load monthly data." />}

      {data && (
        <div className="rounded-2xl bg-white p-5 shadow overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                {['Employee', 'Days Submitted', 'Avg Hours', 'Avg Progress', 'Avg Mood', 'Blockers'].map((h) => (
                  <th key={h} className="py-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.summary.map((row) => (
                <tr key={row.employee} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-4 font-medium">{row.employee}</td>
                  <td className="py-2 pr-4">{row.days_submitted}</td>
                  <td className="py-2 pr-4">{row.avg_hours}h</td>
                  <td className="py-2 pr-4"><ProgressBar value={row.avg_progress} /></td>
                  <td className="py-2 pr-4">{MOOD_EMOJI[Math.round(Number(row.avg_mood))]} {row.avg_mood}</td>
                  <td className="py-2 pr-4">{row.total_blockers}</td>
                </tr>
              ))}
              {data.summary.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-slate-400">No data for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Team ────────────────────────────────────────────────────────────────

function TeamTab() {
  const { data, isLoading, isError } = useTeamData();
  if (isLoading) return <TableSkeleton rows={5} cols={5} />;
  if (isError) return <Alert type="error" message="Failed to load team data." />;
  if (!data) return null;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Work Days This Month" value={data.work_days} />
        <StatCard label="Team Size" value={data.team.length} />
        <StatCard label="Month" value={`${data.month}/${data.year}`} />
      </div>
      <div className="rounded-2xl bg-white p-5 shadow overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
              {['Employee', 'Total Hours', 'Days Submitted', 'Submission Rate', 'Avg Mood'].map((h) => (
                <th key={h} className="py-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.team.map((row) => (
              <tr key={row.employee} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2 pr-4 font-medium">{row.employee}</td>
                <td className="py-2 pr-4">{row.total_hours}h</td>
                <td className="py-2 pr-4">{row.days_submitted}</td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${row.submission_rate >= 80 ? 'bg-emerald-500' : row.submission_rate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                        style={{ width: `${row.submission_rate}%` }}
                      />
                    </div>
                    <span className="text-xs">{row.submission_rate}%</span>
                  </div>
                </td>
                <td className="py-2 pr-4">{MOOD_EMOJI[Math.round(Number(row.avg_mood))]} {row.avg_mood}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Analytics ──────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data: employees = [] } = useEmployees();
  const [filters, setFilters] = useState({ from: '', to: '', employee: '' });
  const { data, isLoading, isError } = useAnalytics(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow">
        {['from', 'to'].map((key) => (
          <label key={key} className="text-sm">
            <span className="mb-1 block text-xs font-medium capitalize text-slate-500">{key}</span>
            <input
              type="date"
              className={inputCls}
              value={(filters as Record<string, string>)[key]}
              onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Employee</span>
          <select
            className={inputCls}
            value={filters.employee}
            onChange={(e) => setFilters((f) => ({ ...f, employee: e.target.value }))}
          >
            <option value="">All employees</option>
            {employees.map((e) => <option key={e._id || e.id} value={e.name}>{e.name}</option>)}
          </select>
        </label>
        <button onClick={() => setFilters({ from: '', to: '', employee: '' })} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Clear
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <StatCardsGridSkeleton count={6} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartSkeleton /><ChartSkeleton /><ChartSkeleton />
          </div>
        </div>
      )}
      {isError && <Alert type="error" message="Failed to load analytics." />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Reports" value={data.totals.total_reports} />
            <StatCard label="Total Hours" value={data.totals.total_hours} accent="text-indigo-600" />
            <StatCard label="Avg Hours" value={data.totals.avg_hours} />
            <StatCard label="Active People" value={data.totals.active_employees} />
            <StatCard label="Avg Mood" value={`${MOOD_EMOJI[Math.round(data.totals.avg_mood)] || ''} ${data.totals.avg_mood}`} accent="text-amber-500" />
            <StatCard label="Avg Progress" value={`${data.totals.avg_progress}%`} accent="text-emerald-600" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <HoursByEmployeeChart data={data.hoursByEmployee} />
            <HoursOverTimeChart data={data.hoursByDate} />
            <MoodChart data={data.moodDistribution} />
            {data.hoursByProject.length > 0 && <ProjectPieChart data={data.hoursByProject} />}
          </div>
          {data.blockers.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">🚧 Active Blockers</h3>
              <ul className="space-y-2">
                {data.blockers.map((b) => (
                  <li key={b._id || b.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">{b.employee_name}</span>
                      <span className="text-xs text-slate-400">{b.date} · {b.project_task}</span>
                    </div>
                    <p className="mt-1 text-slate-600">{b.blockers}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab: Admin ───────────────────────────────────────────────────────────────

function AdminTab() {
  const { data: employees = [], isLoading } = useEmployees(true);
  const createEmployee = useCreateEmployee();
  const deactivate = useDeactivateEmployee();
  const [name, setName] = useState('');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createEmployee.mutateAsync({ name: name.trim() });
    setName('');
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h3 className="mb-1 text-sm font-semibold text-slate-700">Add Employee</h3>
        <form onSubmit={add} className="mt-3 flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            placeholder="Employee name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            disabled={createEmployee.isPending}
            className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Add
          </button>
        </form>
        {createEmployee.isError && <Alert type="error" message={createEmployee.error?.message || 'Could not add employee'} />}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Employees</h3>
        {isLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {employees.map((e) => (
              <li key={e._id || e.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className={`font-medium ${e.is_active === false ? 'text-slate-400 line-through' : ''}`}>{e.name}</span>
                  {e.is_active === false && <span className="ml-2 text-xs text-slate-400">(inactive)</span>}
                </div>
                {e.is_active !== false && (
                  <button
                    onClick={() => { if (confirm(`Deactivate ${e.name}?`)) deactivate.mutate(e._id || e.id); }}
                    className="text-xs font-medium text-rose-500 hover:underline"
                  >
                    Deactivate
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── All Reports Tab ─────────────────────────────────────────────────────────

function AllReportsTab() {
  const { data: employees = [] } = useEmployees();
  const [filters, setFilters] = useState({ employee: '', from: '', to: '' });
  const { data: reports = [], isLoading, isError } = useReports(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  );
  const deleteReport = useDeleteReport();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Employee</span>
          <select className={inputCls} value={filters.employee} onChange={(e) => setFilters((f) => ({ ...f, employee: e.target.value }))}>
            <option value="">All</option>
            {employees.map((e) => <option key={e._id || e.id} value={e.name}>{e.name}</option>)}
          </select>
        </label>
        {['from', 'to'].map((key) => (
          <label key={key} className="text-sm">
            <span className="mb-1 block text-xs font-medium capitalize text-slate-500">{key}</span>
            <input type="date" className={inputCls} value={(filters as Record<string, string>)[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))} />
          </label>
        ))}
        <button onClick={() => setFilters({ employee: '', from: '', to: '' })} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Clear</button>
      </div>

      {isLoading && <TableSkeleton rows={6} cols={8} />}
      {isError && <Alert type="error" message="Failed to load reports." />}

      {!isLoading && !isError && (
        <div className="rounded-2xl bg-white p-5 shadow overflow-x-auto">
          <p className="mb-3 text-sm text-slate-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                {['Date', 'Employee', 'Project', 'Hours', 'Progress', 'Mood', 'Blockers', ''].map((h) => (
                  <th key={h} className="py-2 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r._id || r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{r.date}</td>
                  <td className="py-2 pr-3 whitespace-nowrap font-medium">{r.employee_name}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.project_task}</td>
                  <td className="py-2 pr-3">{r.hours_spent}h</td>
                  <td className="py-2 pr-3"><ProgressBar value={r.progress_percent} /></td>
                  <td className="py-2 pr-3 text-lg">{MOOD_EMOJI[r.mood]}</td>
                  <td className="py-2 pr-3 max-w-[12rem] text-slate-500 text-xs">
                    {r.blockers?.toLowerCase() === 'none' ? <span className="text-slate-300">—</span> : r.blockers}
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => { if (confirm('Delete this report?')) deleteReport.mutate(r._id || r.id); }}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-slate-400">No reports match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'analytics', label: '📈 Analytics' },
  { id: 'employee', label: '👤 Employee' },
  { id: 'monthly', label: '📅 Monthly' },
  { id: 'team', label: '👥 Team' },
  { id: 'reports', label: '📋 Reports' },
  { id: 'admin', label: '⚙️ Admin' },
];

function DashboardShell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState('overview');
  const [reminderMsg, setReminderMsg] = useState('');

  async function testReminder() {
    setReminderMsg('Sending…');
    try {
      await dashboardApi.sendReminder();
      setReminderMsg('✅ Reminder sent!');
    } catch {
      setReminderMsg('⚠️ Slack not configured or failed');
    }
    setTimeout(() => setReminderMsg(''), 5000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
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

      {reminderMsg && (
        <div className="mb-4">
          <Alert type="info" message={reminderMsg} />
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'employee' && <EmployeeTab />}
        {tab === 'monthly' && <MonthlyTab />}
        {tab === 'team' && <TeamTab />}
        {tab === 'reports' && <AllReportsTab />}
        {tab === 'admin' && <AdminTab />}
      </div>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [authed, setAuthed] = useState(Boolean(sessionStorage.getItem('pm_pin')));

  function logout() {
    sessionStorage.removeItem('pm_pin');
    setAuthed(false);
  }

  return authed ? <DashboardShell onLogout={logout} /> : <LoginView onSuccess={() => setAuthed(true)} />;
}
