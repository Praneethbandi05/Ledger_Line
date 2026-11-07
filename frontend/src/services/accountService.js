import api from './api';

export const accountService = {
  getMyAccounts: async () => {
    const response = await api.get('/accounts/my');
    return response.data.data;
  },

  getAllAccounts: async () => {
    const response = await api.get('/accounts/all');
    return response.data.data;
  },

  getAccountById: async (accountId) => {
    const response = await api.get(`/accounts/${accountId}`);
    return response.data.data;
  },

  createAccount: async (accountType = 'CHECKING', currency = 'USD') => {
    const response = await api.post('/accounts', { accountType, currency });
    return response.data.data;
  },
};
