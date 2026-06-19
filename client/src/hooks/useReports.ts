import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi, type CreateReportPayload } from '../api/reports.api';
import type { ReportFilters } from '../types';

export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportsApi.getAll(filters),
    staleTime: 30_000,
  });
}

export function useTodayReports() {
  return useQuery({
    queryKey: ['reports', 'today'],
    queryFn: reportsApi.getToday,
    staleTime: 30_000,
  });
}

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportPayload) => reportsApi.submit(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportsApi.deleteById,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
