import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../api/employees.api';

export function useEmployees(all = false) {
  return useQuery({
    queryKey: ['employees', { all }],
    queryFn: () => employeesApi.getAll(all),
    staleTime: 60_000,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof employeesApi.update>[1] }) =>
      employeesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}
