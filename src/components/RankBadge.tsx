import React from 'react';
import { getRankBadge, isTopTen, isTopHundred } from '../utils/leaderboard';

interface RankBadgeProps {
  rating: number;
  rank?: number;
  size?: 'sm' | 'md' | 'lg';
  showRank?: boolean;
}

export function RankBadge({ rating, rank, size = 'md', showRank = false }: RankBadgeProps) {
  const badge = getRankBadge(rating);
  const isTop10 = rank && isTopTen(rank);
  const isTop100 = rank && isTopHundred(rank);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const borderColor = {
    gold: isTop10 ? 'border-yellow-400' : 'border-yellow-600',
    silver: isTop100 ? 'border-gray-300' : 'border-gray-600',
    bronze: 'border-orange-600',
    default: `border-${badge.color}-500`,
  };

  let border = borderColor.default;
  if (isTop10) border = borderColor.gold;
  else if (isTop100) border = borderColor.silver;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          flex items-center justify-center rounded-full border-2 font-bold
          ${sizeClasses[size]} ${border}
          ${isTop10 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/50' : ''}
          ${isTop100 && !isTop10 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/30' : ''}
          ${!isTop100 ? `bg-${badge.color}-600/80 text-white` : ''}
        `}
        title={`${badge.label} (${rating} rating)`}
      >
        {badge.icon}
      </div>
      {showRank && rank && (
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">Rank</span>
          <span className={`font-bold ${isTop10 ? 'text-yellow-400' : 'text-white'}`}>
            #{rank}
          </span>
        </div>
      )}
    </div>
  );
}
