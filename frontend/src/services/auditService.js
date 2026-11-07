import api from './api';

export const auditService = {
  getAllLogs: async () => {
    const response = await api.get('/audit/logs');
    return response.data.data;
  },

  getLogsByActor: async (username) => {
    const response = await api.get(`/audit/logs/actor/${username}`);
    return response.data.data;
  },

  getLogsByResource: async (resourceId) => {
    const response = await api.get(`/audit/logs/resource/${resourceId}`);
    return response.data.data;
  },
};
