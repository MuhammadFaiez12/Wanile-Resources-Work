import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export function useOverview(date?: string) {
  return useQuery({
    queryKey: ['dashboard', 'overview', date],
    queryFn: () => dashboardApi.getOverview(date),
    staleTime: 30_000,
  });
}

export function useEmployeeStats(name: string) {
  return useQuery({
    queryKey: ['dashboard', 'employee', name],
    queryFn: () => dashboardApi.getEmployeeStats(name),
    enabled: !!name,
    staleTime: 30_000,
  });
}

export function useMonthlyData(month: number, year: number) {
  return useQuery({
    queryKey: ['dashboard', 'monthly', month, year],
    queryFn: () => dashboardApi.getMonthly(month, year),
    staleTime: 60_000,
  });
}

export function useTeamData() {
  return useQuery({
    queryKey: ['dashboard', 'team'],
    queryFn: dashboardApi.getTeam,
    staleTime: 60_000,
  });
}

export function useAnalytics(filters: Parameters<typeof dashboardApi.getAnalytics>[0] = {}) {
  return useQuery({
    queryKey: ['dashboard', 'analytics', filters],
    queryFn: () => dashboardApi.getAnalytics(filters),
    staleTime: 30_000,
  });
}
