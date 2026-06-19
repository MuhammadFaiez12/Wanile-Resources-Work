export interface Employee {
  id: string;
  _id?: string;
  name: string;
  slack_user_id?: string;
  is_active?: boolean;
}

export interface Report {
  id: string;
  _id?: string;
  employee_name: string;
  date: string;
  project_task: string;
  work_done: string;
  hours_spent: number;
  blockers: string;
  tomorrow_plan: string;
  mood: number;
  progress_percent: number;
  submitted_at: string;
}

export interface ReportFilters {
  employee?: string;
  from?: string;
  to?: string;
  date?: string;
}

export interface DashboardOverview {
  date: string;
  submitted: string[];
  missing: string[];
  total: number;
  avgMood: string | null;
}

export interface EmployeeStats {
  reports: Report[];
  stats: {
    avgHours: string;
    avgMood: string;
    avgProgress: number;
    blockers: number;
    total: number;
  };
}

export interface MonthlySummaryRow {
  employee: string;
  days_submitted: number;
  avg_hours: string;
  avg_progress: number;
  avg_mood: string;
  total_blockers: number;
}

export interface MonthlyData {
  reports: Report[];
  summary: MonthlySummaryRow[];
  month: number;
  year: number;
}

export interface TeamMember {
  employee: string;
  total_hours: number;
  days_submitted: number;
  submission_rate: number;
  avg_mood: string;
}

export interface TeamData {
  team: TeamMember[];
  work_days: number;
  month: number;
  year: number;
}

export interface Analytics {
  totals: {
    total_reports: number;
    total_hours: number;
    avg_hours: number;
    avg_mood: number;
    avg_progress: number;
    active_employees: number;
  };
  hoursByEmployee: { name: string; reports: number; hours: number; mood: number; progress: number }[];
  hoursByDate: { date: string; hours: number; reports: number; mood: number }[];
  moodDistribution: { mood: number; count: number }[];
  hoursByProject: { name: string; hours: number; reports: number }[];
  blockers: (Report & { project?: string })[];
}
