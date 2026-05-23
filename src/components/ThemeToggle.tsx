import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1 ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition-all ${
          theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="Light mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition-all ${
          theme === 'dark' ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="Dark mode"
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-full transition-all ${
          theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="System preference"
      >
        <Monitor size={16} />
      </button>
    </div>
  );
}
