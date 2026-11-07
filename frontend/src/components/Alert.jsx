import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const Alert = ({ type = 'danger', message, errors = [] }) => {
  if (!message && (!errors || errors.length === 0)) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'info':
        return <Info size={18} />;
      default:
        return <AlertCircle size={18} />;
    }
  };

  return (
    <div className={`alert alert-${type}`}>
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        {message && <div style={{ fontWeight: 600 }}>{message}</div>}
        {errors && errors.length > 0 && (
          <ul style={{ marginTop: '0.25rem', paddingLeft: '1.25rem', fontSize: '0.8125rem' }}>
            {errors.map((err, idx) => (
              <li key={idx}>
                {err.field ? <strong>{err.field}: </strong> : null}
                {err.message || err}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
