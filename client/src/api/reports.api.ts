import api from './axios';
import type { Report, ReportFilters } from '../types';

export interface CreateReportPayload {
  employee_name: string;
  date: string;
  project_task: string;
  work_done: string;
  hours_spent: number;
  blockers: string;
  tomorrow_plan: string;
  mood: number;
  progress_percent: number;
}

export const reportsApi = {
  submit: (data: CreateReportPayload) =>
    api.post<{ success: boolean; action: string; report: Report }>('/reports', data).then((r) => r.data),

  getAll: (filters: ReportFilters = {}) =>
    api.get<Report[]>('/reports', { params: filters }).then((r) => r.data),

  getToday: () =>
    api.get<Report[]>('/reports/today').then((r) => r.data),

  deleteById: (id: string) =>
    api.delete(`/reports/${id}`).then((r) => r.data),

  exportCSVUrl: (month: number, year: number) =>
    `${import.meta.env.VITE_API_URL || '/api'}/reports/export?month=${month}&year=${year}`,
};
