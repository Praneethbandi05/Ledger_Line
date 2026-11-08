import api from './api';

export const transactionService = {
  deposit: async (accountNumber, amount, description) => {
    const idempotencyKey = 'DEP-' + crypto.randomUUID();
    const response = await api.post(
      '/transactions/deposit',
      {
        accountNumber,
        amount: parseFloat(amount),
        description: description || 'Customer deposit',
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    return response.data;
  },

  withdraw: async (accountNumber, amount, description) => {
    const idempotencyKey = 'WDL-' + crypto.randomUUID();
    const response = await api.post(
      '/transactions/withdraw',
      {
        accountNumber,
        amount: parseFloat(amount),
        description: description || 'Customer withdrawal',
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    return response.data;
  },

  transfer: async (sourceAccountNumber, destinationAccountNumber, amount, description) => {
    const idempotencyKey = 'TRF-' + crypto.randomUUID();
    const response = await api.post(
      '/transactions/transfer',
      {
        sourceAccountNumber,
        destinationAccountNumber,
        amount: parseFloat(amount),
        description: description || 'Internal transfer',
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    return response.data;
  },

  getMyTransactions: async () => {
    const response = await api.get('/transactions/my');
    return response.data.data;
  },

  getAccountTransactions: async (accountId) => {
    const response = await api.get(`/transactions/account/${accountId}`);
    return response.data.data;
  },

  getTransactionByReference: async (reference) => {
    const response = await api.get(`/transactions/${reference}`);
    return response.data.data;
  },

  getAllTransactions: async () => {
    const response = await api.get('/transactions/all');
    return response.data.data;
  },

  getAllLedgerEntries: async () => {
    const response = await api.get('/transactions/ledger');
    return response.data.data;
  },

  getAccountStatement: async (accountId) => {
    const response = await api.get(`/transactions/statement/${accountId}`);
    return response.data.data;
  },
};
