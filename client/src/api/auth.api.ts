import api from './axios';

export const authApi = {
  verify: (pin: string) =>
    api.post<{ ok: boolean }>('/auth', { pin }).then((r) => r.data),
};
