import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { useSubmitReport } from '../hooks/useReports';
import { Alert } from '../components/ui/Alert';

const MOODS = [
  { value: 1, emoji: '😴', label: 'Drained' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'On fire' },
];

const today = () => new Date().toISOString().slice(0, 10);

const STORAGE_KEY = 'daily_report_employee';

const emptyForm = () => ({
  employee_name: localStorage.getItem(STORAGE_KEY) || '',
  date: today(),
  project_task: '',
  work_done: '',
  hours_spent: 8,
  blockers: '',
  tomorrow_plan: '',
  mood: 3,
  progress_percent: 50,
});

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function SubmitPage() {
  const { data: employees = [], isLoading: empLoading } = useEmployees();
  const submitReport = useSubmitReport();
  const [form, setForm] = useState(emptyForm);
  const [done, setDone] = useState<{ name: string; date: string } | null>(null);

  useEffect(() => {
    if (form.employee_name) localStorage.setItem(STORAGE_KEY, form.employee_name);
  }, [form.employee_name]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await submitReport.mutateAsync({
      ...form,
      hours_spent: Number(form.hours_spent),
      mood: Number(form.mood),
      progress_percent: Number(form.progress_percent),
    });
    if (result.success) setDone({ name: form.employee_name, date: form.date });
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className="w-full rounded-2xl bg-white p-10 shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✅
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Report submitted!</h1>
          <p className="mt-2 text-slate-600">
            Thanks <span className="font-semibold">{done.name}</span> — your report for{' '}
            <span className="font-semibold">{done.date}</span> has been recorded.
          </p>
          <button
            onClick={() => { setForm(emptyForm()); setDone(null); }}
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Submit another report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Daily Work Report</h1>
          <p className="text-slate-500">Takes about 2 minutes. Submit before you log off.</p>
        </div>
        <Link to="/dashboard" className="text-sm font-medium text-indigo-600 hover:underline">
          PM Login →
        </Link>
      </div>

      {submitReport.isError && (
        <div className="mb-4">
          <Alert type="error" message={submitReport.error?.message || 'Submission failed. Please try again.'} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-lg">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Employee Name" required>
            <select
              className={inputCls}
              value={form.employee_name}
              onChange={set('employee_name')}
              required
              disabled={empLoading}
            >
              <option value="">{empLoading ? 'Loading…' : 'Select your name…'}</option>
              {employees.map((e) => (
                <option key={e._id || e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Date" required>
            <input type="date" className={inputCls} value={form.date} onChange={set('date')} required />
          </Field>
        </div>

        <Field label="Project / Task Name" required>
          <input
            className={inputCls}
            placeholder="e.g. Website Redesign"
            value={form.project_task}
            onChange={set('project_task')}
            required
          />
        </Field>

        <Field label="Work Done Today" required>
          <textarea
            className={inputCls}
            rows={3}
            placeholder="What did you complete today?"
            value={form.work_done}
            onChange={set('work_done')}
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Hours Spent (1–12)" required>
            <input
              type="number"
              min={1}
              max={12}
              step={0.5}
              className={inputCls}
              value={form.hours_spent}
              onChange={set('hours_spent')}
              required
            />
          </Field>
          <Field label="Overall Progress on Task">
            <div className="pt-1">
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress_percent}
                onChange={set('progress_percent')}
                className="w-full accent-indigo-600"
              />
              <div className="mt-1 text-right text-sm font-semibold text-indigo-600">
                {form.progress_percent}%
              </div>
            </div>
          </Field>
        </div>

        <Field label="Mood / Energy Level">
          <div className="flex justify-between gap-2 pt-1">
            {MOODS.map((m) => {
              const active = Number(form.mood) === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mood: m.value }))}
                  className={`flex flex-1 flex-col items-center rounded-xl border-2 py-2 transition ${
                    active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="mt-1 text-xs text-slate-500">{m.label}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Blockers / Issues">
          <textarea
            className={inputCls}
            rows={2}
            placeholder='Anything blocking you? Type "None" if all clear.'
            value={form.blockers}
            onChange={set('blockers')}
          />
        </Field>

        <Field label="Tomorrow's Plan" required>
          <textarea
            className={inputCls}
            rows={2}
            placeholder="What will you focus on next?"
            value={form.tomorrow_plan}
            onChange={set('tomorrow_plan')}
            required
          />
        </Field>

        <button
          type="submit"
          disabled={submitReport.isPending}
          className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitReport.isPending ? 'Submitting…' : 'Submit Daily Report'}
        </button>
      </form>
    </div>
  );
}
