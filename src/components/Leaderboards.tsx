import React, { useState } from 'react';
import { BarChart3, Trophy, TrendingUp, Search, Crown, Flame } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  rating: number;
  games: number;
  wins: number;
  ratingChange?: number;
}

interface LeaderboardsProps {
  currentUsername: string;
  currentRating: number;
}

export function Leaderboards({ currentUsername, currentRating }: LeaderboardsProps) {
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'weekly' | 'bullet' | 'blitz' | 'rapid' | 'classic'>('global');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock leaderboard data
  const mockLeaderboards: Record<string, LeaderboardEntry[]> = {
    global: [
      { rank: 1, username: 'MagnusBot', rating: 2850, games: 1203, wins: 892, ratingChange: 45 },
      { rank: 2, username: 'AlphaChess', rating: 2780, games: 987, wins: 745, ratingChange: 12 },
      { rank: 3, username: 'NarrowMind', rating: 2650, games: 654, wins: 521, ratingChange: -8 },
      { rank: 4, username: currentUsername, rating: currentRating, games: 156, wins: 98, ratingChange: 23 },
      { rank: 5, username: 'SilentKnight', rating: 1850, games: 342, wins: 189 },
    ],
    weekly: [
      { rank: 1, username: 'FlashMaster', rating: 2200, games: 87, wins: 71, ratingChange: 156 },
      { rank: 2, username: 'RapidFox', rating: 2050, games: 103, wins: 62, ratingChange: 112 },
      { rank: 3, username: currentUsername, rating: currentRating, games: 45, wins: 31, ratingChange: 67 },
    ],
    bullet: [
      { rank: 1, username: 'LightningStrike', rating: 2400, games: 1543, wins: 1087 },
      { rank: 2, username: 'BlitzKing', rating: 2180, games: 892, wins: 634 },
      { rank: 3, username: currentUsername, rating: currentRating, games: 234, wins: 156 },
    ],
    blitz: [
      { rank: 1, username: 'BlitzMaster', rating: 2380, games: 1203, wins: 876 },
      { rank: 2, username: 'FastThinking', rating: 2150, games: 654, wins: 478 },
      { rank: 3, username: currentUsername, rating: currentRating, games: 187, wins: 124 },
    ],
    rapid: [
      { rank: 1, username: 'RapidGenius', rating: 2520, games: 543, wins: 398 },
      { rank: 2, username: 'CarefulPlayer', rating: 2340, games: 421, wins: 312 },
      { rank: 3, username: currentUsername, rating: currentRating, games: 156, wins: 98 },
    ],
    classic: [
      { rank: 1, username: 'ClassicMaster', rating: 2680, games: 234, wins: 187 },
      { rank: 2, username: 'DeepThinking', rating: 2520, games: 198, wins: 156 },
      { rank: 3, username: currentUsername, rating: currentRating, games: 89, wins: 67 },
    ],
  };

  const leaderboard = mockLeaderboards[leaderboardType] || [];
  const filtered = leaderboard.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUserEntry = leaderboard.find(e => e.username === currentUsername);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold flex items-center gap-2 mb-4">
            <Trophy className="text-amber-400" size={32} />
            Leaderboards
          </h1>

          {/* Current user card */}
          {currentUserEntry && (
            <div className="bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-xl p-3 border border-blue-400/50 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Your Rank</p>
                  <p className="text-2xl font-extrabold">#{currentUserEntry.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">{currentUserEntry.rating} rating</p>
                  <p className="text-sm text-blue-200">{currentUserEntry.games} games</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/20 px-4">
        <div className="max-w-4xl mx-auto flex overflow-x-auto gap-1">
          {(['global', 'weekly', 'bullet', 'blitz', 'rapid', 'classic'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setLeaderboardType(tab)}
              className={`px-4 py-3 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
                leaderboardType === tab
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'global' ? '🌍 Global' : tab === 'weekly' ? '📅 This Week' : tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-black/20 px-4 py-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto p-4 pb-8">
        <div className="space-y-1">
          {filtered.map((entry, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                entry.username === currentUsername
                  ? 'bg-blue-600/30 border-2 border-blue-400'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              {/* Rank badge */}
              <div className="flex-shrink-0 w-10 text-center font-extrabold">
                {entry.rank === 1 ? (
                  <Crown size={24} className="text-amber-400 mx-auto" />
                ) : entry.rank === 2 ? (
                  <Flame size={20} className="text-slate-400 mx-auto" />
                ) : entry.rank === 3 ? (
                  <Flame size={20} className="text-orange-600 mx-auto" />
                ) : (
                  <span className="text-slate-400">#{entry.rank}</span>
                )}
              </div>

              {/* Player info */}
              <div className="flex-1">
                <p className="font-bold text-white">{entry.username}</p>
                <p className="text-sm text-slate-400">{entry.games} games • {entry.wins} wins</p>
              </div>

              {/* Rating */}
              <div className="text-right">
                <p className="text-2xl font-extrabold text-blue-400">{entry.rating}</p>
                {entry.ratingChange && (
                  <p className={`text-sm font-bold ${entry.ratingChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {entry.ratingChange > 0 ? '+' : ''}{entry.ratingChange}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No players found</p>
          </div>
        )}
      </div>
    </div>
  );
}
