import api from './axios';
import type { Analytics, DashboardOverview, EmployeeStats, MonthlyData, TeamData } from '../types';

export const dashboardApi = {
  getOverview: (date?: string) =>
    api.get<DashboardOverview>('/dashboard/overview', { params: date ? { date } : {} }).then((r) => r.data),

  getEmployeeStats: (name: string) =>
    api.get<EmployeeStats>(`/dashboard/employee/${encodeURIComponent(name)}`).then((r) => r.data),

  getMonthly: (month: number, year: number) =>
    api.get<MonthlyData>('/dashboard/monthly', { params: { month, year } }).then((r) => r.data),

  getTeam: () =>
    api.get<TeamData>('/dashboard/team').then((r) => r.data),

  getAnalytics: (params: { from?: string; to?: string; employee?: string } = {}) =>
    api.get<Analytics>('/dashboard/analytics', { params }).then((r) => r.data),

  sendReminder: () =>
    api.post('/reminder').then((r) => r.data),
};
