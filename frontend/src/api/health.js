import { http } from './http';

export const healthApi = {
  service: () => http.get('/health'),
  database: () => http.get('/health/db'),
  databaseStats: () => http.get('/health/db/stats'),
};
