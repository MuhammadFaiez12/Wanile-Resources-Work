import api from './axios';
import type { Employee } from '../types';

export const employeesApi = {
  getAll: (all = false) =>
    api.get<Employee[]>('/employees', { params: all ? { all: 'true' } : {} }).then((r) => r.data),

  create: (data: { name: string; slack_user_id?: string }) =>
    api.post<Employee>('/employees', data).then((r) => r.data),

  update: (id: string, data: Partial<Employee>) =>
    api.put<Employee>(`/employees/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.delete(`/employees/${id}`).then((r) => r.data),
};
