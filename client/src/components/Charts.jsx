import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const MOOD_EMOJI = { 1: '😴', 2: '😕', 3: '😐', 4: '🙂', 5: '🔥' };

function Card({ title, children, subtitle }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

export function HoursByEmployeeChart({ data }) {
  return (
    <Card title="Hours Logged by Employee">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} name="Hours" />
      </BarChart>
    </Card>
  );
}

export function HoursOverTimeChart({ data }) {
  return (
    <Card title="Hours Over Time" subtitle="Daily total across the team">
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Hours" />
      </LineChart>
    </Card>
  );
}

export function MoodChart({ data }) {
  const pretty = data.map((d) => ({ ...d, label: `${MOOD_EMOJI[d.mood]} ${d.mood}` }));
  return (
    <Card title="Team Mood Distribution">
      <BarChart data={pretty} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 14 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Reports">
          {pretty.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </Card>
  );
}

export function ProjectPieChart({ data }) {
  return (
    <Card title="Hours by Project">
      <PieChart>
        <Pie data={data} dataKey="hours" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fontSize: 11 }}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </Card>
  );
}
