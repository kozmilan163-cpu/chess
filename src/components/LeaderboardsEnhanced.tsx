import React, { useState } from 'react';
import { Trophy, TrendingUp, Search, Crown, Flame, Award, BarChart3 } from 'lucide-react';
import { LeaderboardEntry, buildGlobalLeaderboard, getRankBadge, formatRatingDelta, isTopTen, generateMockLeaderboard } from '../utils/leaderboard';
import { RankBadge } from './RankBadge';

interface LeaderboardsEnhancedProps {
  currentUsername: string;
  currentRating: number;
  currentPlayerId?: string;
}

export function LeaderboardsEnhanced({ currentUsername, currentRating, currentPlayerId }: LeaderboardsEnhancedProps) {
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [players] = useState<LeaderboardEntry[]>(generateMockLeaderboard());

  const leaderboard = buildGlobalLeaderboard(players);
  const filtered = leaderboard.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUserEntry = leaderboard.find(e => e.username === currentUsername);
  const topTenCount = leaderboard.filter(p => isTopTen(p.rank || 0)).length;

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-amber-400" size={36} />
            <h1 className="text-4xl font-extrabold">Global Leaderboards</h1>
          </div>

          {/* Current user card */}
          {currentUserEntry && (
            <div className="bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-lg p-4 border border-blue-400/50 backdrop-blur mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <RankBadge rating={currentUserEntry.rating} rank={currentUserEntry.rank} size="lg" />
                  <div>
                    <p className="text-sm text-blue-200">Your Ranking</p>
                    <p className="text-2xl font-bold">{currentUserEntry.username}</p>
                    <p className="text-sm text-blue-100">
                      {currentUserEntry.games} games • {Math.round((currentUserEntry.wins / currentUserEntry.games) * 100)}% win rate
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-200">Rating</p>
                  <p className="text-3xl font-bold">{currentUserEntry.rating}</p>
                  {currentUserEntry.ratingDelta !== undefined && (
                    <p className={`text-sm font-semibold ${currentUserEntry.ratingDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatRatingDelta(currentUserEntry.ratingDelta)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filters and search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              {(['global', 'weekly', 'monthly'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setLeaderboardType(type)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    leaderboardType === type
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/50'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/70'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search player..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 backdrop-blur">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">Player</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-300">Rating</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-300">Δ</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-300">Games</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-300">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.slice(0, 100).map((entry, idx) => {
                    const isCurrentUser = entry.username === currentUsername;
                    const isTop10 = isTopTen(entry.rank || 0);
                    return (
                      <tr
                        key={`${entry.username}-${idx}`}
                        className={`border-b border-slate-700/50 transition-colors ${
                          isCurrentUser ? 'bg-blue-900/30' : 'hover:bg-slate-700/30'
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {isTop10 && <Crown className="text-amber-400" size={16} />}
                            <span className={`font-bold text-lg ${isTop10 ? 'text-amber-400' : 'text-white'}`}>
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <RankBadge rating={entry.rating} size="sm" />
                            <div>
                              <p className={`font-semibold ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                                {entry.username}
                              </p>
                              <p className="text-xs text-gray-400">{getRankBadge(entry.rating).label}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-lg">{entry.rating}</td>
                        <td className="px-4 py-4 text-right">
                          {entry.ratingDelta !== undefined && (
                            <span className={`font-semibold ${entry.ratingDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatRatingDelta(entry.ratingDelta)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-300">{entry.games}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold">{Math.round((entry.wins / entry.games) * 100)}%</span>
                            {Math.round((entry.wins / entry.games) * 100) > 55 && (
                              <Flame className="text-orange-500" size={16} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No players found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <Award className="text-green-400" size={24} />
              <h3 className="font-semibold text-gray-300">Total Players</h3>
            </div>
            <p className="text-3xl font-bold text-white">{leaderboard.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <Crown className="text-amber-400" size={24} />
              <h3 className="font-semibold text-gray-300">Top Ranked</h3>
            </div>
            <p className="text-2xl font-bold text-amber-400">{leaderboard[0]?.username}</p>
            <p className="text-sm text-gray-400">{leaderboard[0]?.rating} rating</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="text-purple-400" size={24} />
              <h3 className="font-semibold text-gray-300">Avg Rating</h3>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {Math.round(leaderboard.reduce((sum, p) => sum + p.rating, 0) / leaderboard.length)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
