'client load';

import * as React from 'react';

export default function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#1a1a2e',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '20px 0',
      }}
    >
      <h2 style={{ color: '#eee', marginBottom: '16px' }}>
        Interactive Counter (Client Component)
      </h2>
      <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#00d9ff', margin: '20px 0' }}>
        {count}
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={() => setCount((c) => c - 1)}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            backgroundColor: '#ff4757',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          -
        </button>
        <button
          onClick={() => setCount((c) => c + 1)}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            backgroundColor: '#2ed573',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
