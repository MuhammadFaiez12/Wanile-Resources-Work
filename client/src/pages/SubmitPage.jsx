import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

const MOODS = [
  { value: 1, emoji: '😴', label: 'Drained' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'On fire' },
];

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  employee_name: '',
  date: today(),
  project: '',
  work_done: '',
  hours: 8,
  blockers: '',
  tomorrow_plan: '',
  mood: 3,
  progress: 50,
});

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

export default function SubmitPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    api.get('/employees').then((r) => setEmployees(r.data)).catch(() => {});
  }, []);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      await api.post('/reports', {
        ...form,
        hours: Number(form.hours),
        mood: Number(form.mood),
        progress: Number(form.progress),
      });
      setDone({ name: form.employee_name, date: form.date });
    } catch (err) {
      const data = err?.response?.data;
      setErrors(data?.errors || [data?.error || 'Something went wrong. Please try again.']);
    } finally {
      setSubmitting(false);
    }
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
            <span className="font-semibold">{done.date}</span> has been recorded and your
            PM has been notified on Slack.
          </p>
          <button
            onClick={() => {
              setForm(emptyForm());
              setDone(null);
            }}
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

      {errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <ul className="list-inside list-disc">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-lg">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Employee Name" required>
            <select className={inputCls} value={form.employee_name} onChange={set('employee_name')} required>
              <option value="">Select your name…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date" required>
            <input type="date" className={inputCls} value={form.date} onChange={set('date')} required />
          </Field>
        </div>

        <Field label="Project / Task Name" required>
          <input className={inputCls} placeholder="e.g. Website Redesign" value={form.project} onChange={set('project')} required />
        </Field>

        <Field label="Work Done Today" required>
          <textarea className={inputCls} rows={3} placeholder="What did you complete today?" value={form.work_done} onChange={set('work_done')} required />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Hours Spent (1–12)" required>
            <input type="number" min={1} max={12} step={0.5} className={inputCls} value={form.hours} onChange={set('hours')} required />
          </Field>

          <Field label="Overall Progress on Task">
            <div className="pt-1">
              <input type="range" min={0} max={100} value={form.progress} onChange={set('progress')} className="w-full accent-indigo-600" />
              <div className="mt-1 text-right text-sm font-semibold text-indigo-600">{form.progress}%</div>
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
                  title={m.label}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="mt-1 text-xs text-slate-500">{m.label}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Blockers / Issues">
          <textarea className={inputCls} rows={2} placeholder='Anything blocking you? Type "None" if all clear.' value={form.blockers} onChange={set('blockers')} />
        </Field>

        <Field label="Tomorrow's Plan" required>
          <textarea className={inputCls} rows={2} placeholder="What will you focus on next?" value={form.tomorrow_plan} onChange={set('tomorrow_plan')} required />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Daily Report'}
        </button>
      </form>
    </div>
  );
}
