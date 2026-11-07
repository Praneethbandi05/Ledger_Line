import React from 'react';

function App() {
  return (
    <div className="app-container">
      <header style={{ padding: '1.5rem 2rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
          LEDGERLINE <span style={{ color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 500 }}>Money Movement With a Ledger You Can Prove</span>
        </h1>
      </header>
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <h2>System Foundation Ready</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            Phase 1 Foundation Initialized. Ready for secure financial transaction management.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
