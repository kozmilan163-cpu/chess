import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'avatar';
  lines?: number;
}

export function Skeleton({ className = '', variant = 'rect', lines = 1 }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700 rounded';

  if (variant === 'circle') {
    return <div className={`${baseClasses} rounded-full ${className}`} />;
  }

  if (variant === 'avatar') {
    return <div className={`${baseClasses} rounded-full w-10 h-10 ${className}`} />;
  }

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} h-4`}
            style={{ width: `${85 + Math.random() * 15}%` }}
          />
        ))}
      </div>
    );
  }

  return <div className={`${baseClasses} ${className}`} />;
}

export function SkeletonPost() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-32 h-4" />
          <Skeleton variant="text" className="w-20 h-3" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPost key={i} />
      ))}
    </div>
  );
}
