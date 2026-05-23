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
  pieces?: Record<string, { name: string, url: string, shapeUrl?: string, textureUrl?: string, color?: string }>;
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
  avatar?: string; // base64 avatar
  followers?: number;
  following?: number;
  history?: Array<{ 
    id: string; 
    pgn: string; 
    result: string; 
    opponent: string; 
    date: string;
    white?: string;
    black?: string;
    movesCount?: number;
    fen?: string;
  }>;
}

interface ProfileProps {
  profile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
}

export function Profile({ profile, onUpdateProfile }: ProfileProps) {
  const [username, setUsername] = useState(profile?.username || '');
  const [chessComUsername, setChessComUsername] = useState(profile?.chessComUsername || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode] = useState(() => 'V-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [showVerification, setShowVerification] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const followers = profile?.followers || 0;
  const following = profile?.following || 0;
  const history = profile?.history || [];
  const totalGames = history.length;
  const wins = history.filter(g => g.result?.toLowerCase().includes('white') || g.result?.toLowerCase().includes('win')).length;
  const losses = totalGames - wins;
  const draws = history.filter(g => g.result?.toLowerCase().includes('draw')).length;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

  // Analyze game
  const analyzeGame = (gameId: string) => {
    setSelectedGameId(gameId);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onUpdateProfile({
        ...profile!,
        avatar: base64
      });
      setShowAvatarUpload(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBasic = () => {
    if (!username) return;
    onUpdateProfile({
      ...profile!,
      username,
      localRating: profile?.localRating || 1200,
      chessComUsername: profile?.chessComUsername,
      chessComRating: profile?.chessComRating,
      isVerified: profile?.isVerified,
    });
  };

  const verifyAndLink = async () => {
    if (!chessComUsername) return;
    setLoading(true);
    setError('');
    
    try {
      const profileResponse = await fetch(`https://api.chess.com/pub/player/${chessComUsername}`);
      if (!profileResponse.ok) {
        throw new Error('User not found on Chess.com');
      }
      
      const profileData = profileResponse.json();
      const location = (await profileData).location || '';
      const about = (await profileData).about || '';
      const isVerified = location.includes(verificationCode) || about.includes(verificationCode);
      
      if (!isVerified) {
        throw new Error(`Could not find "${verificationCode}" in your Chess.com 'Location' or 'About me' section.`);
      }

      const statsResponse = await fetch(`https://api.chess.com/pub/player/${chessComUsername}/stats`);
      if (!statsResponse.ok) {
        throw new Error('Could not fetch user stats.');
      }
      const data = await statsResponse.json();
      
      let rating = data?.chess_rapid?.last?.rating || data?.chess_blitz?.last?.rating || 1200;

      onUpdateProfile({
        ...profile!,
        username: profile?.username || username || 'Anonymous',
        localRating: rating,
        chessComUsername: chessComUsername,
        chessComRating: rating,
        isVerified: true,
      });

      setShowVerification(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startVerification = () => {
    if (!chessComUsername) return;
    setShowVerification(true);
  };

  // Get display FEN for game history
  const getGameFen = (game: any) => {
    return game.fen || 'start';
  };

  // Get result badge color
  const getResultColor = (result: string) => {
    if (result?.toLowerCase().includes('win')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (result?.toLowerCase().includes('loss')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (result?.toLowerCase().includes('draw')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getResultText = (result: string) => {
    if (result?.toLowerCase().includes('win')) return '🏆 Win';
    if (result?.toLowerCase().includes('loss')) return '❌ Loss';
    if (result?.toLowerCase().includes('draw')) return '🤝 Draw';
    return result;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-6 px-4 md:px-8">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Cover area */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
          
          {/* Profile Content */}
          <div className="px-6 pb-6 pt-0">
            <div className="flex flex-col md:flex-row gap-6 -mt-16">
              {/* Avatar */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  <button
                    onClick={() => setShowAvatarUpload(!showAvatarUpload)}
                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center font-bold text-white text-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 hover:shadow-2xl transition-shadow cursor-pointer"
                  >
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      <User size={56} />
                    )}
                  </button>
                  <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-lg text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    <Upload size={16} />
                  </div>
                </div>

                {showAvatarUpload && (
                  <div className="mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-extrabold text-slate-900">@{username || 'Player'}</h1>
                    {profile?.isVerified && <CheckCircle size={24} className="text-blue-600" />}
                  </div>
                  <p className="text-slate-500">Chess.com: {chessComUsername || 'Not linked'}</p>
                </div>

                {/* Follow Stats */}
                <div className="flex gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{followers}</div>
                    <div className="text-xs text-slate-500 font-medium">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{following}</div>
                    <div className="text-xs text-slate-500 font-medium">Following</div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    <UserPlus size={16} /> Follow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-2">
              <Award className="text-blue-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{profile?.localRating || 1200}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Rating</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-2">
              <Play className="text-indigo-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalGames}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Games</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-2">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{wins}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Wins</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-2">
              <Zap className="text-amber-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{winRate}%</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Win Rate</div>
          </div>
        </div>

        {/* Edit Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              onClick={handleSaveBasic}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h3 className="font-medium text-slate-900">Link Chess.com Account</h3>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Chess.com Username</label>
              <input
                type="text"
                value={chessComUsername}
                onChange={(e) => setChessComUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              onClick={startVerification}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Link Account
            </button>
          </div>
        </div>

        {/* Game History */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Game History</h2>
          
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No games yet. Start playing!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.slice().reverse().map(game => (
                <div
                  key={game.id}
                  onClick={() => analyzeGame(game.id)}
                  className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-slate-50"
                >
                  {/* Board */}
                  <div className="bg-slate-900 p-2">
                    <div className="rounded-lg overflow-hidden max-w-[200px] mx-auto">
                      <Chessboard
                        position={getGameFen(game)}
                        arePiecesDraggable={false}
                        showBoardNotation={false}
                      />
                    </div>
                  </div>

                  {/* Game Info */}
                  <div className="p-4 space-y-2">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getResultColor(game.result)}`}>
                      {getResultText(game.result)}
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">vs </span>
                      <span>{game.opponent}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(game.date).toLocaleDateString()}
                    </div>
                    {game.movesCount && (
                      <div className="text-xs text-slate-500">
                        {game.movesCount} moves
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis Modal */}
        {selectedGameId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">Game Analysis</h3>
                <button onClick={() => setSelectedGameId(null)} className="text-slate-500 hover:text-slate-700">
                  <X size={24} />
                </button>
              </div>
              <p className="text-slate-600">Game analysis coming soon with Stockfish integration.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
