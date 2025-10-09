import React from 'react';

export default function Component({ label }) {
  return (
    <div>
      <button>
        {/* inline note */}
        {label}
      </button>
    </div>
  );
}
