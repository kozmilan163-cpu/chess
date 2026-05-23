import React, { useState, useEffect } from 'react';
import {
  User, RefreshCw, Award, CheckCircle, History, ExternalLink,
  Brain, Sparkles, TrendingUp, AlertTriangle, Shield, Coins,
  Calendar, RotateCcw, Play, X, Zap, Target, Upload, Users, UserPlus
} from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export interface GeneratedTheme {
  id: string;
  themeName: string;
  light: string;
  dark: string;
  border?: string;
  pieces?: Record<string, { name: string; url: string; shapeUrl?: string; textureUrl?: string; color?: string }>;
  customBoardImage?: string;
  date?: string;
}

export interface UserProfile {
  username: string;
  chessComUsername?: string;
  localRating: number;
  chessComRating?: number;
  isVerified?: boolean;
  coins?: number;
  inventory?: string[];
  activeBoardTheme?: string;
  customBoardImage?: string;
  customThemes?: GeneratedTheme[];
  avatar?: string;
  followers?: number;
  following?: number;
  history?: Array<{
    id: string;
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    pgn: string;
    date: string;
    ratingChange: number;
  }>;
  friendRequests?: { incoming: string[]; outgoing: string[] };
  friends?: string[];
}

interface ProfileProps {
  profile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
}

type ProfileTab = 'stats' | 'history' | 'themes' | 'social' | 'settings';

export function Profile({ profile, onUpdateProfile }: ProfileProps) {
  const [username, setUsername] = useState(profile?.username || '');
  const [chessComUsername, setChessComUsername] = useState(profile?.chessComUsername || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode] = useState(() => 'V-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [showVerification, setShowVerification] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'requests'>('all');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setChessComUsername(profile.chessComUsername || '');
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const winRate = profile.history
    ? Math.round((profile.history.filter(h => h.result === 'win').length / profile.history.length) * 100)
    : 0;

  const totalGames = profile.history?.length || 0;
  const wins = profile.history?.filter(h => h.result === 'win').length || 0;
  const losses = profile.history?.filter(h => h.result === 'loss').length || 0;
  const draws = profile.history?.filter(h => h.result === 'draw').length || 0;

  const handleSave = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      onUpdateProfile({ ...profile, username, chessComUsername });
      setLoading(false);
    }, 500);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateProfile({ ...profile, avatar: reader.result as string });
      setShowAvatarUpload(false);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyChessCom = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://api.chess.com/pub/player/${chessComUsername}`);
      if (!res.ok) throw new Error('User not found');
      const data = await res.json();
      const statsRes = await fetch(`https://api.chess.com/pub/player/${chessComUsername}/stats`);
      const statsData = await statsRes.json();
      const rapid = statsData.chess_rapid?.last?.rating || 0;
      onUpdateProfile({
        ...profile,
        chessComUsername,
        chessComRating: rapid,
        isVerified: true,
      });
      setShowVerification(false);
    } catch {
      setError('Could not verify Chess.com account. Please check the username.');
    }
    setLoading(false);
  };

  const tabs: { key: ProfileTab; label: string; icon: any }[] = [
    { key: 'stats', label: 'Stats', icon: TrendingUp },
    { key: 'history', label: 'History', icon: History },
    { key: 'themes', label: 'Themes', icon: Sparkles },
    { key: 'social', label: 'Social', icon: Users },
    { key: 'settings', label: 'Settings', icon: Shield },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-0">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setShowAvatarUpload(!showAvatarUpload)}
              className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              <Upload size={14} className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.username}</h2>
              {profile.isVerified && <CheckCircle size={18} className="text-blue-500 fill-blue-500" />}
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white">{totalGames}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Games</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white">{profile.localRating}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Rating</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white">{profile.followers || 0}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white">{profile.following || 0}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Following</p>
              </div>
            </div>

            {profile.chessComUsername && (
              <a
                href={`https://chess.com/member/${profile.chessComUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors"
              >
                <ExternalLink size={14} />
                chess.com/{profile.chessComUsername}
                {profile.chessComRating && <span className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{profile.chessComRating} Elo</span>}
              </a>
            )}
          </div>
        </div>

        {/* Avatar Upload */}
        {showAvatarUpload && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
              <Upload size={24} className="text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Click to upload avatar</span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{wins}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500 font-medium">Wins</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{losses}</p>
                  <p className="text-xs text-rose-700 dark:text-rose-500 font-medium">Losses</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{draws}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">Draws</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Win Rate</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{winRate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                  <div
                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Coins</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Coins size={16} className="text-amber-500" />
                    {(profile.coins || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Best Rating</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <TrendingUp size={16} className="text-emerald-500" />
                    {Math.max(profile.localRating, profile.chessComRating || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {(!profile.history || profile.history.length === 0) ? (
                <div className="text-center py-8">
                  <History size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No games played yet</p>
                </div>
              ) : (
                profile.history.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGameId(selectedGameId === game.id ? null : game.id)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        game.result === 'win' ? 'bg-emerald-500' : game.result === 'loss' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">vs {game.opponent}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(game.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        game.ratingChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : game.ratingChange < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {game.ratingChange > 0 ? '+' : ''}{game.ratingChange}
                      </span>
                    </div>
                  </button>
                ))
              )}

              {selectedGameId && (
                <div className="mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Game Analysis</h3>
                    <button onClick={() => setSelectedGameId(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                      <X size={16} className="text-slate-500" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Game analysis coming soon with Stockfish integration.</p>
                </div>
              )}
            </div>
          )}

          {/* Themes Tab */}
          {activeTab === 'themes' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Theme</h3>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 border border-slate-200 dark:border-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{profile.activeBoardTheme || 'Default'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{profile.inventory?.length || 0} themes owned</p>
                </div>
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              {/* Friend Filters */}
              <div className="flex gap-2">
                {(['all', 'online', 'requests'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFriendFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      friendFilter === f
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {f === 'all' && <Users size={12} className="inline mr-1" />}
                    {f === 'online' && <Zap size={12} className="inline mr-1" />}
                    {f === 'requests' && <UserPlus size={12} className="inline mr-1" />}
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === 'requests' && (profile.friendRequests?.incoming.length || 0) > 0 && (
                      <span className="ml-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {profile.friendRequests?.incoming.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-center py-8">
                <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Friend system coming in the next update</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Play games and add opponents to build your friend list</p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chess.com Username</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chessComUsername}
                    onChange={e => setChessComUsername(e.target.value)}
                    placeholder="e.g. magnuscarlsen"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => setShowVerification(!showVerification)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {showVerification && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    To verify, add this code to your Chess.com profile: <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded">{verificationCode}</code>
                  </p>
                  <button
                    onClick={handleVerifyChessCom}
                    disabled={loading}
                    className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Checking...' : 'I\'ve added it'}
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-500" />
                  <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
