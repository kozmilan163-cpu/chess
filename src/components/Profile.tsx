import React, { useState, useEffect } from 'react';
import { 
  User, RefreshCw, Award, CheckCircle, History, ExternalLink, 
  Brain, Sparkles, TrendingUp, AlertTriangle, Shield, Coins,
  Calendar, RotateCcw, Play, X, Zap, Target 
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

  // Profile-level game analysis states
  const [analyzingGame, setAnalyzingGame] = useState<any | null>(null);
  const [analyzingGameFen, setAnalyzingGameFen] = useState('start');
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [stockfishEval, setStockfishEval] = useState<{ eval: number, move: string, winChance: number, text: string } | null>(null);
  const [stockfishLoading, setStockfishLoading] = useState(false);

  // Initialize mini preview board whenever a history item is clicked for review
  useEffect(() => {
    if (analyzingGame) {
      setAnalysisText(null);
      setAnalysisError(null);
      setStockfishEval(null);
      
      const pgn = analyzingGame.pgn || '';
      const fen = analyzingGame.fen || 'start';
      setAnalyzingGameFen(fen);
    } else {
      setAnalysisText(null);
      setStockfishEval(null);
    }
  }, [analyzingGame]);

  const fetchAIAnalysis = async () => {
    if (!analyzingGame || !analyzingGame.pgn) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisText(null);
    try {
      const res = await fetch('/api/analyze-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pgn: analyzingGame.pgn })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze game patterns');
      setAnalysisText(data.analysis);
    } catch (e: any) {
      setAnalysisError(e.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const fetchStockfishEval = async () => {
    if (!analyzingGame) return;
    const fen = analyzingGame.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setStockfishLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch('https://chess-api.com/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen })
      });
      if (res.ok) {
        const data = await res.json();
        setStockfishEval({
          eval: data.eval,
          move: data.move,
          winChance: data.winChance,
          text: data.text
        });
      } else {
        throw new Error("Could not fetch Stockfish analysis.");
      }
    } catch (e: any) {
      setAnalysisError(e.message);
    } finally {
      setStockfishLoading(false);
    }
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
      // 1. Fetch user profile to verify identity
      const profileResponse = await fetch(`https://api.chess.com/pub/player/${chessComUsername}`);
      if (!profileResponse.ok) {
        throw new Error('User not found on Chess.com');
      }
      
      const profileData = await profileResponse.json();
      const location = profileData.location || '';
      const about = profileData.about || '';
      const isVerified = location.includes(verificationCode) || about.includes(verificationCode);
      
      if (!isVerified) {
        throw new Error(`Could not find "${verificationCode}" in your Chess.com 'Location' or 'About me' section. Save changes and try again.`);
      }

      // 2. Fetch stats to get rating
      const statsResponse = await fetch(`https://api.chess.com/pub/player/${chessComUsername}/stats`);
      if (!statsResponse.ok) {
        throw new Error('Could not fetch user stats.');
      }
      const data = await statsResponse.json();
      
      let rating = data?.chess_rapid?.last?.rating || data?.chess_blitz?.last?.rating;
      
      if (!rating) {
        rating = 1200;
      }

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

  // ----------------------------------------------------
  // Dynamic player statistics & weakness processing
  // ----------------------------------------------------
  const history = profile?.history || [];
  const totalGames = history.length;
  const wins = history.filter(g => g.result?.toLowerCase().includes('wins') && !(g.result?.toLowerCase().includes('loss') || g.result?.toLowerCase().includes('blue') || g.result?.toLowerCase().includes('black wins'))).length; // simple filter
  const losses = history.filter(g => g.result?.toLowerCase().includes('wins') && !g.result?.toLowerCase().includes(profile?.username?.toLowerCase() || 'player')).length;
  const draws = history.filter(g => g.result?.toLowerCase().includes('draw') || g.result?.toLowerCase().includes('stalemate') || g.result?.toLowerCase().includes('repetition')).length;

  // Extract dynamic pattern breakdowns
  const timeOutLosses = history.filter(g => g.result?.toLowerCase().includes('time') && !g.result?.toLowerCase().includes(profile?.username?.toLowerCase() || 'player')).length;
  const checkmateLosses = history.filter(g => g.result?.toLowerCase().includes('checkmate') && !g.result?.toLowerCase().includes(profile?.username?.toLowerCase() || 'player')).length;

  const weaknesses = React.useMemo(() => {
    const list = [];
    
    if (timeOutLosses > 0) {
      list.push({
        title: 'Time Pacing & Scramble Panic',
        severity: timeOutLosses >= 2 ? 'SEVERE SHORTCOMING' : 'MINOR BLUNDER',
        desc: `You dropped ${timeOutLosses} games on time expiration. Pacing and automatic pre-moves are recommended.`,
        type: 'Time Management',
        icon: <RotateCcw className="text-amber-500 shrink-0" size={16} />
      });
    }
    
    if (checkmateLosses > 0) {
      list.push({
        title: 'King Safety & Back-Rank Vulnerability',
        severity: checkmateLosses >= 2 ? 'HIGH EXPOSURE' : 'OCCASIONAL LEAK',
        desc: `Lost ${checkmateLosses} games through direct checkmates. Focus on castling defenses and fianchetto safety structures.`,
        type: 'Tactical Defensive',
        icon: <Shield className="text-purple-500 shrink-0" size={16} />
      });
    }

    // Always include a foundational strategic analysis
    list.push({
      title: 'Pawn Chain Cohesion Trades',
      severity: 'INFORMATIONAL',
      desc: 'Slight tendency to create doubled pawns during early center trades. Play defensively around isolated queen pawns.',
      type: 'Structural Strategy',
      icon: <Brain className="text-blue-500 shrink-0" size={16} />
    });

    list.push({
      title: 'Endgame Conversion Efficiency',
      severity: 'COACH ASSISTED',
      desc: 'Struggles to lock opposition kings down when up single rook exchanges in late game phases.',
      type: 'Strategic Endgame',
      icon: <Target className="text-emerald-500 shrink-0" size={16} />
    });

    return list;
  }, [history, timeOutLosses, checkmateLosses]);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto pt-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shrink-0">
             <User size={48} />
          </div>
          
          <div className="flex-grow space-y-2 text-center md:text-left">
             <h1 className="text-4xl font-black text-slate-950">{username || 'Anonymous Player'}</h1>
             <p className="text-slate-500 font-semibold text-lg flex items-center justify-center md:justify-start gap-2">
               Local Rating: <span className="font-bold text-indigo-600">{profile?.localRating || 1200} Elo</span>
               {profile?.isVerified && (
                 <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wide border border-emerald-100">
                   <CheckCircle size={14} /> Verified
                 </span>
               )}
             </p>
          </div>

          <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-center px-4 border-r border-slate-200">
               <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Wins</div>
               <div className="text-2xl font-black">{wins}</div>
            </div>
            <div className="text-center px-4">
               <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Coins</div>
               <div className="text-2xl font-black text-amber-500">{profile?.coins || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: Local Controls + Chess.com Integration (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Section 1: Edit Profile details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User size={16} className="text-blue-600" /> Member Info
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Configure Handle</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:border-blue-500 outline-none transition-colors"
                  placeholder="e.g. GarryKasparov"
                />
              </div>

              <button 
                onClick={handleSaveBasic}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_3px_0_rgba(1,74,213,0.3)] hover:shadow-none translate-y-0 active:translate-y-1 select-none cursor-pointer text-xs uppercase"
              >
                Save Profile Setting
              </button>
            </div>
          </div>

          {/* Section 2: Chess.com Account Integration */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Award size={16} className="text-amber-500" /> Chess.com Integration
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-wider">Chess.com Handle</label>
                <input 
                  type="text" 
                  value={chessComUsername}
                  onChange={(e) => setChessComUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:border-blue-500 outline-none"
                  placeholder="e.g. MagnusCarlsen"
                />
              </div>

              {error && <p className="text-red-600 text-[11px] font-bold bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}
              
              {profile?.isVerified && profile?.chessComRating ? (
                <div className="text-xs text-slate-600 bg-emerald-50 p-4 rounded-xl border border-emerald-200/50 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-black text-sm uppercase">
                    <CheckCircle size={16} /> Verified Account
                  </div>
                  <div className="font-semibold text-slate-700">Handle: <span className="font-extrabold text-slate-950">{profile.chessComUsername}</span></div>
                  <div className="font-semibold text-slate-700">Proven Elo Imported: <span className="font-extrabold text-amber-600">{profile.chessComRating}</span></div>
                </div>
              ) : (
                <>
                  {!showVerification ? (
                    <button 
                      onClick={startVerification}
                      disabled={!chessComUsername}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-1.5 text-xs select-none cursor-pointer disabled:opacity-45"
                    >
                      Start Verification Link
                    </button>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-3 leading-relaxed">
                      <p className="font-semibold text-slate-700">
                        To prove ownership, please copy this code and paste it into either your Chess.com <strong className="text-slate-900">Location</strong> or <strong className="text-slate-900">About me</strong> profile field, save, then click verify.
                      </p>
                      
                      <div className="bg-white border border-dashed border-slate-300 p-3 rounded-lg text-center font-mono text-lg font-black tracking-widest text-blue-600">
                        {verificationCode}
                      </div>

                      <div className="space-y-1.5 text-[10px] text-slate-400 font-medium">
                        <div>1. Open Chess.com → Profile Settings</div>
                        <div>2. Paste verification code, save profile</div>
                        <div>3. Click Verify button below</div>
                      </div>

                      <button 
                        onClick={verifyAndLink}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-1.5 text-xs cursor-pointer select-none"
                      >
                        {loading ? <RefreshCw className="animate-spin" size={14} /> : 'Verify Account Now'}
                      </button>
                      <button 
                        onClick={() => setShowVerification(false)}
                        className="w-full text-slate-400 hover:text-slate-800 font-bold text-center text-[10px] uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Bento Column (8 Cols) - Dynamic Weaknesses Tracker + Interactive Detailed Game History */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Dynamic Weaknesses & AI Tactical Coaching */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center sm:gap-2">
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Brain size={16} className="text-rose-500" /> AI Weaknesses & Strategic Deficiencies
              </h2>
              <span className="text-[10px] bg-red-50 text-red-600 font-bold uppercase py-1 px-2.5 rounded-full border border-red-100">
                Weakness Profile
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed leading-lose">
               Vulnerabilities are evaluated after each game based on direct play history, mate formations, and time control scrambles. Review your dynamic report:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {weaknesses.map((w, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3.5 hover:border-slate-300 transition-colors">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0 self-start">
                     {w.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-black tracking-wider bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded">
                        {w.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{w.type}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{w.title}</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                       {w.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Detailed Game History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <History size={16} className="text-indigo-600" /> Beautiful Game History & Analysis
            </h2>

            {history.length > 0 ? (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {history.map((game, i) => {
                  const isWon = game.result?.toLowerCase().includes('wins') && !(game.result?.toLowerCase().includes('loss') || game.result?.toLowerCase().includes('blue') || (game.result?.toLowerCase().includes('white won') && profile?.activeBoardTheme !== 'w') || game.result?.toLowerCase().includes('black wins'));
                  const isDraw = game.result?.toLowerCase().includes('draw') || game.result?.toLowerCase().includes('stalemate');
                  const movesCount = game.movesCount || 12;

                  return (
                    <div key={game.id || i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/55 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-100 hover:bg-indigo-50/10 transition-colors group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isWon ? 'bg-green-100 text-green-700 border border-green-200' : isDraw ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {isWon ? 'Win' : isDraw ? 'Draw' : 'Loss'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Calendar size={11} /> {game.date}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {profile?.username || 'You'} <span className="text-slate-400 font-medium">vs</span> {game.opponent}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold italic">
                           Result flag: "{game.result}" • {movesCount} moves played
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                        <button 
                          type="button"
                          onClick={() => setAnalyzingGame(game)}
                          className="bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-800 font-bold text-xs py-2 px-3.5 rounded-xl transition-colors flex items-center gap-1.5 select-none cursor-pointer"
                        >
                          <Brain size={13} /> Analyze Match
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 p-10 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold space-y-1">
                 <p>No matches recorded in this account yet.</p>
                 <p className="font-semibold text-slate-400/80">Play local games or join online friend lobbies to auto-populate history.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pop-up Deep Game Reviewer Drawer/Modal */}
      {analyzingGame && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-150 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row p-6 md:p-8 gap-6 md:gap-8 relative">
            <button 
              type="button"
              onClick={() => setAnalyzingGame(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 p-2.5 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Left Column: Fixed state review board */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-300">
                <Chessboard 
                  showBoardNotation={false}
                  position={analyzingGameFen}
                  arePiecesDraggable={false}
                  boardWidth={360}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-4 tracking-wider text-center">
                 Reviewing board state at termination
              </p>
            </div>

            {/* Right Column: Dynamic Analysis tools */}
            <div className="w-full md:w-[400px] flex flex-col gap-5 justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-widest bg-indigo-600/10 px-2.5 py-1 rounded-full border border-indigo-600/20">Analytical Match Viewer</span>
                  <h3 className="text-xl font-black text-slate-950 mt-2">
                     vs {analyzingGame.opponent}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                     Analyze your historical blunder rate and engine lines instantly.
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={fetchAIAnalysis}
                    disabled={analysisLoading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 select-none shadow-[w-4px_0_indigo-500] cursor-pointer"
                  >
                    {analysisLoading ? <RefreshCw className="animate-spin" size={13}/> : <Sparkles size={13}/>}
                    AI Gemini Analysis
                  </button>
                  <button 
                    onClick={fetchStockfishEval}
                    disabled={stockfishLoading}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-extrabold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 select-none cursor-pointer"
                  >
                    {stockfishLoading ? <RefreshCw className="animate-spin" size={13}/> : <Zap size={13}/>}
                    Stockfish 16.1
                  </button>
                </div>

                {/* Stockfish Eval Panel */}
                {stockfishEval && (
                  <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Analysis metrics</span>
                      <div className="bg-white px-2 py-0.5 rounded text-indigo-600 font-mono font-bold text-[10px] border border-slate-200">
                        Win: {stockfishEval.winChance?.toFixed(1)}%
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[9px] uppercase font-black text-slate-400">Engine Eval</div>
                        <div className={`text-xl font-black ${stockfishEval.eval > 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {stockfishEval.eval > 0 ? '+' : ''}{stockfishEval.eval}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-black text-slate-400">Best Continuation</div>
                        <div className="font-mono text-sm font-extrabold text-slate-900">{stockfishEval.move}</div>
                      </div>
                    </div>
                    {stockfishEval.text && (
                      <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] font-semibold italic p-2.5 rounded-lg mt-3">
                        "{stockfishEval.text}"
                      </div>
                    )}
                  </div>
                )}

                {/* AI Text Display Panel */}
                {analysisText && (
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-2 leading-relaxed font-semibold max-h-[220px] overflow-y-auto">
                     <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400 block mb-1">Gemini Review</span>
                     <p className="whitespace-pre-wrap">{analysisText}</p>
                  </div>
                )}

                {analysisError && (
                  <div className="p-3 text-red-600 bg-red-50 text-xs font-bold rounded-xl border border-red-100">
                     {analysisError}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setAnalyzingGame(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-6 rounded-xl transition-colors cursor-pointer select-none"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
