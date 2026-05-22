import React from 'react';

interface TimerProps {
  timeInSeconds: number;
  isActive: boolean;
  isWhite: boolean;
}

export function Timer({ timeInSeconds, isActive, isWhite }: TimerProps) {
  const minutes = Math.floor(Math.max(0, timeInSeconds) / 60);
  const seconds = Math.floor(Math.max(0, timeInSeconds) % 60);
  
  // To avoid floating point issues, round the time strictly
  const rawTenths = Math.floor((Math.max(0, timeInSeconds) * 10) % 10);
  // Only show tenths when under 10 seconds
  const showTenths = timeInSeconds < 10 && timeInSeconds > 0;
  
  const isDanger = timeInSeconds <= 30;

  // For styling, active timers should pop. White timer is light, black timer is dark.
  let colorClass = 'bg-slate-100 text-slate-500 border border-slate-200'; // inactive default
  if (isActive) {
    if (isWhite) {
      colorClass = 'bg-white text-slate-900 shadow-md border border-slate-200';
    } else {
      colorClass = 'bg-slate-800 text-white shadow-md border border-slate-700';
    }
  }

  if (isDanger && isActive) {
    colorClass = 'bg-red-600 text-white shadow-md shadow-red-500/20 border border-red-500'; // chess.com danger mode is usually a red background
  }

  return (
    <div className={`font-mono font-bold text-3xl tabular-nums rounded-2xl px-4 py-2 transition-colors flex items-end justify-center min-w-[120px] ${colorClass}`}>
      <span>{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
      {showTenths ? (
        <span className="text-xl mb-[2px]">.{rawTenths}</span>
      ) : (
        <span className="text-xl mb-[2px] opacity-0 pointer-events-none">.0</span>
      )}
    </div>
  );
}
