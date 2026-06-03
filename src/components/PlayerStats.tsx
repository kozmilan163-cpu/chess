import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Target, Clock, BarChart3, Trophy } from 'lucide-react';
import { UserProfile } from './Profile';
import { Chess } from 'chess.js';

interface GameRecord {
  pgn: string;
  result: 'win' | 'loss' | 'draw';
  timestamp: number;
  opponent?: string;
  timeControl?: string;
  openingMoves?: string;
}

interface StatsData {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentRating: number;
  highestRating: number;
  ratingTrend: number[];
  favoriteOpenings: Array<{ name: string; count: number; result: number }>;
  averageGameDuration: number;
  longestWinStreak: number;
  lastTenGames: GameRecord[];
}

interface PlayerStatsProps {
  profile: UserProfile;
  onClose?: () => void;
}

const getOpeningName = (pgn: string): string => {
  const game = new Chess();
  const moves = pgn.split(' ').filter(m => !m.includes('.') && m.trim());
  
  const openings: Record<string, string> = {
    'e2e4': 'Italian Game',
    'e2e4 c7c5': 'Sicilian Defense',
    'e2e4 e7e5': 'Open Game',
    'd2d4': 'Queen\'s Gambit',
    'd2d4 d7d5': 'Queen\'s Gambit Declined',
    'd2d4 g8f6': 'Indian Defense',
    'c2c4': 'English Opening',
    'g1f3': 'Reti Opening',
  };
  
  for (let i = 1; i <= Math.min(3, moves.length); i++) {
    const key = moves.slice(0, i).join('');
    if (openings[key]) return openings[key];
  }
  
  return 'Unknown Opening';
};

export function PlayerStats({ profile, onClose }: PlayerStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'openings' | 'history'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      const gameHistory = JSON.parse(localStorage.getItem('chess_game_history') || '[]') as GameRecord[];
      const currentRating = profile?.localRating || 1200;
      const highestRating = Math.max(currentRating, ...gameHistory.map(g => g.result === 'win' ? currentRating + 20 : currentRating - 10));
      
      const wins = gameHistory.filter(g => g.result === 'win').length;
      const losses = gameHistory.filter(g => g.result === 'loss').length;
      const draws = gameHistory.filter(g => g.result === 'draw').length;
      const totalGames = gameHistory.length;
      const winRate = totalGames > 0 ? (wins / totalGames * 100) : 0;

      // Calculate openings
      const openingsMap: Record<string, { count: number; wins: number }> = {};
      gameHistory.forEach(game => {
        const opening = getOpeningName(game.pgn);
        if (!openingsMap[opening]) {
          openingsMap[opening] = { count: 0, wins: 0 };
        }
        openingsMap[opening].count++;
        if (game.result === 'win') openingsMap[opening].wins++;
      });

      const favoriteOpenings = Object.entries(openingsMap)
        .map(([name, data]) => ({
          name,
          count: data.count,
          result: data.wins
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      for (const game of gameHistory.slice().reverse()) {
        if (game.result === 'win') {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      // Average game duration
      const totalDuration = gameHistory.reduce((sum, g) => sum + (g.timeControl ? parseInt(g.timeControl) : 300), 0);
      const averageGameDuration = gameHistory.length > 0 ? totalDuration / gameHistory.length : 0;

      // Rating trend (last 20 games)
      const ratingTrend = gameHistory.slice(-20).map((g, idx) => {
        const baseRating = currentRating;
        return baseRating + (g.result === 'win' ? 20 : g.result === 'loss' ? -20 : 0) * (idx / 20);
      });

      setStats({
        totalGames,
        wins,
        losses,
        draws,
        winRate,
        currentRating,
        highestRating,
        ratingTrend,
        favoriteOpenings,
        averageGameDuration,
        longestWinStreak: longestStreak,
        lastTenGames: gameHistory.slice(-10)
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        currentRating: profile?.localRating || 1200,
        highestRating: profile?.localRating || 1200,
        ratingTrend: [],
        favoriteOpenings: [],
        averageGameDuration: 0,
        longestWinStreak: 0,
        lastTenGames: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Player Statistics</h2>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 border border-amber-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-amber-400" size={18} />
            <span className="text-sm text-amber-300">Rating</span>
          </div>
          <div className="text-3xl font-bold text-amber-400">{stats.currentRating}</div>
          <div className="text-xs text-amber-300/70">Peak: {stats.highestRating}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-emerald-400" size={18} />
            <span className="text-sm text-emerald-300">Win Rate</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{stats.winRate.toFixed(1)}%</div>
          <div className="text-xs text-emerald-300/70">{stats.wins}W-{stats.losses}L-{stats.draws}D</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-blue-400" size={18} />
            <span className="text-sm text-blue-300">Total Games</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.totalGames}</div>
          <div className="text-xs text-blue-300/70">Career total</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600/20 to-orange-600/5 border border-orange-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-orange-400" size={18} />
            <span className="text-sm text-orange-300">Win Streak</span>
          </div>
          <div className="text-3xl font-bold text-orange-400">{stats.longestWinStreak}</div>
          <div className="text-xs text-orange-300/70">Longest streak</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-purple-400" size={18} />
            <span className="text-sm text-purple-300">Avg Duration</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">{Math.round(stats.averageGameDuration / 60)}m</div>
          <div className="text-xs text-purple-300/70">Per game</div>
        </div>

        <div className="bg-gradient-to-br from-pink-600/20 to-pink-600/5 border border-pink-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-pink-400" size={18} />
            <span className="text-sm text-pink-300">Draws</span>
          </div>
          <div className="text-3xl font-bold text-pink-400">{stats.draws}</div>
          <div className="text-xs text-pink-300/70">{((stats.draws / stats.totalGames) * 100).toFixed(1)}% of games</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700">
        {(['overview', 'openings', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm transition-colors capitalize ${
              activeTab === tab
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Game Breakdown</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-white">Wins</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500"
                      style={{ width: `${stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-emerald-400 font-semibold w-12 text-right">{stats.wins}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                  <span className="text-white">Losses</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500"
                      style={{ width: `${stats.totalGames > 0 ? (stats.losses / stats.totalGames) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-rose-400 font-semibold w-12 text-right">{stats.losses}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                  <span className="text-white">Draws</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-400"
                      style={{ width: `${stats.totalGames > 0 ? (stats.draws / stats.totalGames) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-slate-400 font-semibold w-12 text-right">{stats.draws}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'openings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Favorite Openings</h3>
            {stats.favoriteOpenings.length > 0 ? (
              <div className="space-y-2">
                {stats.favoriteOpenings.map((opening, idx) => (
                  <div key={idx} className="p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{opening.name}</span>
                      <span className="text-xs text-slate-400">{opening.count} games</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500"
                          style={{ width: `${(opening.result / opening.count) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-emerald-400 text-sm">{((opening.result / opening.count) * 100).toFixed(0)}% win</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No games played yet</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Last 10 Games</h3>
            {stats.lastTenGames.length > 0 ? (
              <div className="space-y-2">
                {stats.lastTenGames.map((game, idx) => (
                  <div key={idx} className="p-3 bg-slate-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        game.result === 'win' ? 'bg-emerald-500' :
                        game.result === 'loss' ? 'bg-rose-500' : 'bg-slate-400'
                      }`}></div>
                      <div>
                        <p className="text-white capitalize font-semibold">{game.result}</p>
                        <p className="text-xs text-slate-400">{new Date(game.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {game.opponent && (
                      <span className="text-slate-400 text-sm">vs {game.opponent}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No games yet. Play your first game!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
