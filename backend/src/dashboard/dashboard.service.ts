import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from '../reports/schemas/report.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { getPKTDate } from '../common/helpers/pkt-time.helper';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  async getOverview(date?: string) {
    const target = date || getPKTDate();
    const [todayReports, employees] = await Promise.all([
      this.reportModel.find({ date: target }).lean(),
      this.employeeModel.find({ is_active: true }).lean(),
    ]);
    const submitted = todayReports.map((r) => r.employee_name);
    const missing = employees.filter((e) => !submitted.includes(e.name)).map((e) => e.name);
    const avgMood = todayReports.length
      ? (todayReports.reduce((a, r) => a + r.mood, 0) / todayReports.length).toFixed(1)
      : null;
    return { date: target, submitted, missing, total: employees.length, avgMood };
  }

  async getEmployeeStats(name: string) {
    const reports = await this.reportModel
      .find({ employee_name: decodeURIComponent(name) })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    const n = reports.length;
    const avg = (key: keyof Report) =>
      n ? (reports.reduce((a, r) => a + (r[key] as number), 0) / n).toFixed(1) : '0';
    const blockers = reports.filter((r) => r.blockers && r.blockers.toLowerCase() !== 'none').length;
    return {
      reports,
      stats: {
        avgHours: avg('hours_spent'),
        avgMood: avg('mood'),
        avgProgress: n ? Math.round(reports.reduce((a, r) => a + r.progress_percent, 0) / n) : 0,
        blockers,
        total: n,
      },
    };
  }

  async getMonthly(month: number, year: number) {
    const ms = String(month).padStart(2, '0');
    const [reports, employees] = await Promise.all([
      this.reportModel
        .find({ date: { $gte: `${year}-${ms}-01`, $lte: `${year}-${ms}-31` } })
        .lean(),
      this.employeeModel.find({ is_active: true }).lean(),
    ]);
    const summary = employees.map((emp) => {
      const r = reports.filter((x) => x.employee_name === emp.name);
      const days = r.length;
      return {
        employee: emp.name,
        days_submitted: days,
        avg_hours: days ? (r.reduce((a, x) => a + x.hours_spent, 0) / days).toFixed(1) : '0',
        avg_progress: days ? Math.round(r.reduce((a, x) => a + x.progress_percent, 0) / days) : 0,
        avg_mood: days ? (r.reduce((a, x) => a + x.mood, 0) / days).toFixed(1) : '0',
        total_blockers: r.filter((x) => x.blockers && x.blockers.toLowerCase() !== 'none').length,
      };
    });
    return { reports, summary, month, year };
  }

  async getTeam() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const ms = String(month).padStart(2, '0');
    const [reports, employees] = await Promise.all([
      this.reportModel
        .find({ date: { $gte: `${year}-${ms}-01`, $lte: `${year}-${ms}-31` } })
        .lean(),
      this.employeeModel.find({ is_active: true }).lean(),
    ]);
    const workDays = new Set(reports.map((r) => r.date)).size || 1;
    const team = employees.map((emp) => {
      const r = reports.filter((x) => x.employee_name === emp.name);
      const days = new Set(r.map((x) => x.date)).size;
      return {
        employee: emp.name,
        total_hours: r.reduce((a, x) => a + x.hours_spent, 0),
        days_submitted: days,
        submission_rate: Math.round((days / workDays) * 100),
        avg_mood: r.length ? (r.reduce((a, x) => a + x.mood, 0) / r.length).toFixed(1) : '0',
      };
    });
    return { team, work_days: workDays, month, year };
  }

  async getAnalytics({ from, to, employee }: { from?: string; to?: string; employee?: string }) {
    const filter: Record<string, unknown> = {};
    if (employee) filter.employee_name = employee;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, string>).$gte = from;
      if (to) (filter.date as Record<string, string>).$lte = to;
    }

    const reports = await this.reportModel.find(filter).lean();
    const n = reports.length;

    const groupBy = <T>(arr: T[], key: keyof T) =>
      arr.reduce((acc, item) => {
        const k = String(item[key]);
        (acc[k] = acc[k] || []).push(item);
        return acc;
      }, {} as Record<string, T[]>);

    const byEmployee = groupBy(reports, 'employee_name');
    const byDate = groupBy(reports, 'date');

    const round1 = (v: number) => Math.round(v * 10) / 10;

    const hoursByEmployee = Object.entries(byEmployee).map(([name, r]) => ({
      name,
      reports: r.length,
      hours: round1(r.reduce((a, x) => a + x.hours_spent, 0)),
      mood: round1(r.reduce((a, x) => a + x.mood, 0) / r.length),
      progress: Math.round(r.reduce((a, x) => a + x.progress_percent, 0) / r.length),
    })).sort((a, b) => b.hours - a.hours);

    const hoursByDate = Object.entries(byDate)
      .map(([date, r]) => ({
        date,
        hours: round1(r.reduce((a, x) => a + x.hours_spent, 0)),
        reports: r.length,
        mood: round1(r.reduce((a, x) => a + x.mood, 0) / r.length),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const moodCounts = [1, 2, 3, 4, 5].map((m) => ({
      mood: m,
      count: reports.filter((r) => r.mood === m).length,
    }));

    const byProject = groupBy(reports, 'project_task');
    const hoursByProject = Object.entries(byProject)
      .map(([name, r]) => ({
        name: name || 'Unknown',
        hours: round1(r.reduce((a, x) => a + x.hours_spent, 0)),
        reports: r.length,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 12);

    const blockers = reports
      .filter((r) => r.blockers && !['none', 'n/a', ''].includes(r.blockers.toLowerCase().trim()))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 50);

    return {
      totals: {
        total_reports: n,
        total_hours: round1(reports.reduce((a, r) => a + r.hours_spent, 0)),
        avg_hours: n ? round1(reports.reduce((a, r) => a + r.hours_spent, 0) / n) : 0,
        avg_mood: n ? round1(reports.reduce((a, r) => a + r.mood, 0) / n) : 0,
        avg_progress: n ? Math.round(reports.reduce((a, r) => a + r.progress_percent, 0) / n) : 0,
        active_employees: new Set(reports.map((r) => r.employee_name)).size,
      },
      hoursByEmployee,
      hoursByDate,
      moodDistribution: moodCounts,
      hoursByProject,
      blockers,
    };
  }
}
