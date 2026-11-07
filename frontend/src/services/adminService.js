import api from './api';

export const adminService = {
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data.data;
  },

  toggleUserStatus: async (userId, enabled) => {
    const response = await api.patch(`/admin/users/${userId}/status?enabled=${enabled}`);
    return response.data.data;
  },
};
