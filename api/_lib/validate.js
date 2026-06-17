/** Validates and normalises an incoming daily report payload. */
export function validateReport(b = {}) {
  const errors = [];
  const name = (b.employee_name || '').trim();
  const date = (b.date || '').trim();
  const project = (b.project || '').trim();
  const work_done = (b.work_done || '').trim();
  const tomorrow_plan = (b.tomorrow_plan || '').trim();
  const hours = Number(b.hours);
  const mood = Number(b.mood);
  const progress = Number(b.progress);

  if (!name) errors.push('Employee name is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('Valid date (YYYY-MM-DD) is required');
  if (!project) errors.push('Project / task name is required');
  if (!work_done) errors.push('Work done is required');
  if (!tomorrow_plan) errors.push("Tomorrow's plan is required");
  if (!(hours >= 1 && hours <= 12)) errors.push('Hours must be between 1 and 12');
  if (!(mood >= 1 && mood <= 5)) errors.push('Mood must be between 1 and 5');
  if (!(progress >= 0 && progress <= 100)) errors.push('Progress must be 0–100');

  return {
    errors,
    value: {
      employee_name: name,
      date,
      project,
      work_done,
      tomorrow_plan,
      blockers: (b.blockers || '').trim() || 'None',
      hours,
      mood,
      progress,
    },
  };
}
