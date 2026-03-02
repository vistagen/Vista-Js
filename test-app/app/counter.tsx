'use client';

import { useState, useEffect } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {mounted ? '✅ Client component hydrated (useEffect ran)' : '⏳ Server rendered...'}
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
        >
          −
        </button>
        <span className="text-2xl font-mono font-bold text-black dark:text-white w-16 text-center">
          {count}
        </span>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
