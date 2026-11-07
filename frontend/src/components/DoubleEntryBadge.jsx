import React from 'react';

export const DoubleEntryBadge = ({ entryType, amount, currency = 'USD' }) => {
  const isDebit = entryType === 'DEBIT';

  return (
    <span className={`badge ${isDebit ? 'badge-debit' : 'badge-credit'}`}>
      <span>{entryType}</span>
      <span>•</span>
      <span>
        {isDebit ? '-' : '+'}
        {currency} {parseFloat(amount).toFixed(2)}
      </span>
    </span>
  );
};
