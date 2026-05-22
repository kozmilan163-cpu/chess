import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Target, CheckCircle2, XCircle, ArrowRight, RefreshCw, Zap, Loader2, Sparkles, Filter, Settings2, ShieldAlert } from 'lucide-react';
import { playChessSound } from '../audio';
import { THEMES as SHOP_THEMES } from './Shop';

import { FALLBACK_PUZZLES, PuzzleData } from '../data/puzzles_db';

export function Puzzles({ profile, onUpdateProfile }: { profile: any, onUpdateProfile: any }) {
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState<'setup' | 'loading' | 'playing' | 'success' | 'failed' | 'solution'>('setup');
  const [moveIndex, setMoveIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Find active board theme from profile
  const activeThemeId = profile?.activeBoardTheme || 'default';
  const activeCustomTheme = profile?.customThemes?.find((t: any) => t.id === activeThemeId);
  const activeTheme = activeCustomTheme || SHOP_THEMES.find((t: any) => t.id === activeThemeId) || SHOP_THEMES[0];

  const customPieces = React.useMemo(() => {
    const themeWithPieces = activeCustomTheme || (activeTheme && (activeTheme as any).pieces ? activeTheme : null);
    if (themeWithPieces && (themeWithPieces as any).pieces) {
      const pieces: Record<string, any> = {};
      for (const [pieceStr, data] of Object.entries((themeWithPieces as any).pieces)) {
        if (!data || !(data as any).url) continue;
        const pieceData = data as { name: string, url: string, textureUrl?: string, shapeUrl?: string, color?: string };
        pieces[pieceStr] = ({ squareWidth }: { squareWidth: number }) => {
          const isWhite = pieceStr.startsWith('w');
          if (pieceData.shapeUrl && (pieceData.textureUrl || pieceData.color)) {
             const blendMode = isWhite ? 'multiply' : 'screen';
             return (
               <div style={{ width: squareWidth, height: squareWidth, padding: '5%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <div style={{
                   width: '100%',
                   height: '100%',
                   position: 'relative',
                   filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.6))'
                 }}>
                   {/* Colored or textured backing */}
                   <div style={{
                     position: 'absolute',
                     top: 0, left: 0, right: 0, bottom: 0,
                     backgroundImage: pieceData.textureUrl ? `url(${pieceData.textureUrl})` : 'none',
                     backgroundColor: pieceData.color || 'transparent',
                     backgroundSize: 'cover',
                     maskImage: `url(${pieceData.shapeUrl})`,
                     maskSize: 'contain',
                     maskRepeat: 'no-repeat',
                     maskPosition: 'center',
                     WebkitMaskImage: `url(${pieceData.shapeUrl})`,
                     WebkitMaskSize: 'contain',
                     WebkitMaskRepeat: 'no-repeat',
                     WebkitMaskPosition: 'center',
                     filter: pieceData.textureUrl && !isWhite ? 'brightness(50%) contrast(120%)' : 'none',
                   }} />

                   {/* Keep outlines for solid custom pieces */}
                   {!pieceData.textureUrl && pieceData.color && (
                     <img 
                       src={pieceData.shapeUrl} 
                       alt={pieceData.name} 
                       title={pieceData.name}
                       referrerPolicy="no-referrer"
                       draggable={false}
                       style={{ 
                         position: 'absolute',
                         top: 0, left: 0, right: 0, bottom: 0,
                         width: '100%', 
                         height: '100%', 
                         objectFit: 'contain',
                         mixBlendMode: blendMode,
                         pointerEvents: 'none'
                       }} 
                     />
                   )}

                   {/* Visual Side Indicator Badge */}
                   <div style={{
                     position: 'absolute',
                     bottom: '-1px',
                     right: '-1px',
                     width: '12px',
                     height: '12px',
                     borderRadius: '50%',
                     backgroundColor: isWhite ? '#ffffff' : '#1e293b',
                     border: isWhite ? '1.5px solid #1e293b' : '1.5px solid #ffffff',
                     boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     zIndex: 30,
                     pointerEvents: 'none'
                   }}>
                     <span style={{ 
                       color: isWhite ? '#1e293b' : '#ffffff', 
                       fontSize: '7px', 
                       fontFamily: 'monospace',
                       fontWeight: 'bold',
                       lineHeight: 1
                     }}>
                       {isWhite ? 'W' : 'B'}
                     </span>
                   </div>
                 </div>
               </div>
             );
          }
          return (
            <div style={{ width: squareWidth, height: squareWidth, padding: '5%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <img 
                  src={pieceData.url} 
                  alt={pieceData.name} 
                  title={pieceData.name}
                  draggable={false}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain', 
                    filter: `drop-shadow(1px 1px 2px rgba(0,0,0,0.6)) ${!isWhite ? 'brightness(50%) contrast(120%)' : ''}`
                  }} 
                />

                {/* Visual Side Indicator Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: isWhite ? '#ffffff' : '#1e293b',
                  border: isWhite ? '1.5px solid #1e293b' : '1.5px solid #ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 30,
                  pointerEvents: 'none'
                }}>
                  <span style={{ 
                    color: isWhite ? '#1e293b' : '#ffffff', 
                    fontSize: '7px', 
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    {isWhite ? 'W' : 'B'}
                  </span>
                </div>
              </div>
            </div>
          );
        };
      }
      return pieces;
    }
    return undefined;
  }, [activeCustomTheme, activeTheme]);

  // Setup options
  const [selectedRating, setSelectedRating] = useState('auto');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const THEMES = [
    { id: 'all', label: 'Mixed Tactics' },
    { id: 'mate1', label: 'Mate in 1' },
    { id: 'mate2', label: 'Mate in 2' },
    { id: 'fork', label: 'Forks & Double Attacks' },
    { id: 'pin', label: 'Pins & Skewers' },
    { id: 'endgame', label: 'Endgame Tactics' },
  ];

  const RATINGS = [
    { id: 'auto', label: 'Auto (Based on Rating)' },
    { id: 'beginner', label: 'Beginner (< 1000)' },
    { id: 'intermediate', label: 'Intermediate (1000 - 1600)' },
    { id: 'advanced', label: 'Advanced (1600 - 2200)' },
    { id: 'master', label: 'Master (2200+)' },
  ];

  const fetchRandomPuzzle = async (theme = selectedTheme) => {
    setStatus('loading');
    
    // Determine the actual difficulty level for the database lookup / API
    let diff = selectedRating;
    if (diff === 'auto') {
      const rating = profile?.puzzleRating || 1200;
      if (rating < 1000) diff = 'beginner';
      else if (rating < 1600) diff = 'intermediate';
      else if (rating < 2200) diff = 'advanced';
      else diff = 'master';
    }

    const requestedTheme = theme === 'all' ? ['mate1', 'mate2', 'fork', 'pin', 'endgame'][Math.floor(Math.random() * 5)] : theme;

    // Fast path: Try fallback DB immediately
    const themePuzzles = FALLBACK_PUZZLES[requestedTheme as keyof typeof FALLBACK_PUZZLES] || FALLBACK_PUZZLES.mate1;
    const puzzlesList = themePuzzles[diff as keyof typeof themePuzzles] || themePuzzles.beginner;
      
    if (puzzlesList && puzzlesList.length > 0) {
      const randomIndex = Math.floor(Math.random() * puzzlesList.length);
      const selected = puzzlesList[randomIndex];
      const puzzle: PuzzleData = {
        fen: selected.fen,
        solution: [...selected.solution],
        orientation: selected.orientation,
        title: selected.title || "Calculated Tactical Attack",
        url: selected.url || "#"
      };
      setCurrentPuzzle(puzzle);
      setGame(new Chess(selected.fen));
      setStatus('playing');
      setMoveIndex(0);
      setAttempts(0);
      return;
    }

    // Fallback if DB is empty
    const fallbackFen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1';
    setCurrentPuzzle({
      fen: fallbackFen,
      solution: ['Qxf7#'],
      orientation: 'white',
      title: "Scholar's Mate (Mate in 1)",
      url: "#"
    });
    setGame(new Chess(fallbackFen));
    setStatus('playing');
    setMoveIndex(0);
    setAttempts(0);
  };

  const nextPuzzle = () => {
    fetchRandomPuzzle();
  };

  const showSolution = () => {
    if (!currentPuzzle) return;
    const newGame = new Chess(currentPuzzle.fen);
    for (const move of currentPuzzle.solution) {
      try {
        newGame.move(move);
      } catch(e) {}
    }
    setGame(newGame);
    setStatus('solution');
    
    // Penalize puzzle rating for giving up
    if (profile && status !== 'solution') {
       onUpdateProfile({
         ...profile,
         puzzleRating: Math.max(400, (profile.puzzleRating || 1200) - 10)
       });
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (status !== 'playing' || !currentPuzzle) return false;

    const gameCopy = new Chess(game.fen());
    
    let moveObj = null;
    try {
      // Basic try move
      const moves = gameCopy.moves({ verbose: true });
      const foundMove = moves.find(m => m.from === sourceSquare && m.to === targetSquare);
      if (foundMove) {
        moveObj = gameCopy.move(foundMove.san);
      }
    } catch(e) { return false; }

    if (!moveObj) return false;

    // Check if move matches solution
    const correctNextSan = currentPuzzle.solution[moveIndex];
    
    // We check if it matches in standard algebraic notation
    if (moveObj.san === correctNextSan || (moveObj.from + moveObj.to) === correctNextSan) {
      setGame(gameCopy);
      
      const isCapture = moveObj.captured || moveObj.san.includes('x') || false;
      const isCheck = moveObj.san.includes('+') || moveObj.san.includes('#') || false;
      
      if (moveIndex + 1 === currentPuzzle.solution.length) {
        playChessSound('gameEnd');
        setStatus('success');
        // Give puzzle coins/rating only if no mistakes were made
        if (profile && attempts === 0) {
           onUpdateProfile({
             ...profile,
             coins: (profile.coins || 0) + 15,
             puzzleRating: (profile.puzzleRating || 1200) + 15
           });
        }
      } else {
        setMoveIndex(moveIndex + 1);
        playChessSound(isCheck ? 'check' : (isCapture ? 'capture' : 'move'));
        
        // Auto-play opponent's response for multi-step puzzles
        if (moveIndex + 2 < currentPuzzle.solution.length) {
           setTimeout(() => {
             const oppCopy = new Chess(gameCopy.fen());
             const oppMove = oppCopy.move(currentPuzzle.solution[moveIndex + 1]);
             setGame(oppCopy);
             setMoveIndex(moveIndex + 2);
             
             if (oppMove) {
               const isOppCapture = oppMove.captured || oppMove.san.includes('x') || false;
               const isOppCheck = oppMove.san.includes('+') || oppMove.san.includes('#') || false;
               playChessSound(isOppCheck ? 'check' : (isOppCapture ? 'capture' : 'move'));
             }
           }, 400);
        } else if (moveIndex + 1 === currentPuzzle.solution.length) {
           // We finished on this player move
           playChessSound('gameEnd');
           setStatus('success');
        }
      }
      return true;
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setStatus('failed');
      
      // Penalize rating slightly if fail
      if (profile && newAttempts === 1) {
         onUpdateProfile({
           ...profile,
           puzzleRating: Math.max(400, (profile.puzzleRating || 1200) - 5)
         });
      }
      
      return false; // don't allow incorrect piece drop
    }
  };

  if (status === 'setup') {
    return (
      <div className="min-h-full flex flex-col p-4 md:p-8 bg-slate-50 items-center justify-center relative">
        {toastMsg && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <Zap size={18} className="text-yellow-400" />
            {toastMsg}
          </div>
        )}
        {/* Background decorative elements */}
        <div className="absolute top-20 left-10 md:left-40 blur-3xl opacity-20 pointer-events-none">
          <div className="w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
        </div>
        <div className="absolute bottom-20 right-10 md:right-40 blur-3xl opacity-20 pointer-events-none">
          <div className="w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
        </div>

        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10 flex flex-col md:flex-row">
          
          <div className="bg-slate-900 text-slate-100 p-8 md:w-1/3 flex flex-col justify-center">
            <Target className="text-yellow-400 mb-6" size={48} />
            <h1 className="text-3xl font-black mb-2 tracking-tight">Tactics Training</h1>
            <p className="text-slate-400 font-medium mb-8 text-sm leading-relaxed">
              Sharpen your tactical vision. Choose your focus or let us analyze your recent games to find your weaknesses.
            </p>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Puzzle Rating</div>
              <div className="text-3xl font-mono font-black text-white">{profile?.puzzleRating || 1200}</div>
            </div>
          </div>

          <div className="p-8 md:w-2/3 flex flex-col gap-8 bg-white">
            
            {/* Quick Option: Analyze Weaknesses */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" /> Auto-Train
              </h3>
              <button 
                onClick={() => {
                   if ((profile?.coins || 0) < 10) {
                     showToast('You need 10 Coins to use AI Auto-Targeting.');
                     return;
                   }
                   onUpdateProfile({
                     ...profile,
                     coins: (profile?.coins || 0) - 10
                   });
                   setSelectedTheme('all');
                   setSelectedRating('auto');
                   fetchRandomPuzzle('weaknesses');
                }}
                className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 p-4 rounded-xl flex items-center gap-4 transition-all group"
              >
                <div className="bg-blue-500 text-white p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <ShieldAlert size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-sm">Target My Game Weaknesses</div>
                  <div className="text-xs text-blue-700/80 mt-0.5">Focuses on tactical blunders common in your games</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-400/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles size={12} /> 10 Coins
                  </span>
                  <ArrowRight className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Custom Options */}
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={16} className="text-slate-500" /> Custom Training
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 px-1">Difficulty</label>
                  <div className="relative">
                    <select 
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 font-semibold"
                    >
                      {RATINGS.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 px-1">Theme</label>
                  <div className="relative">
                    <select 
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 font-semibold"
                    >
                      {THEMES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => fetchRandomPuzzle(selectedTheme)}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 text-sm uppercase tracking-wider"
              >
                Start Custom Session <ArrowRight size={16} />
              </button>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-slate-50 p-4 md:p-8 gap-6">
      
      <div className="w-full md:w-2/3 max-w-[600px] flex flex-col mx-auto md:ml-auto md:mx-0">
        <div className="bg-white p-4 rounded-t-xl flex justify-between items-center shadow-lg border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button 
               onClick={() => setStatus('setup')}
               className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
               title="Back to Setup"
            >
              <Settings2 size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Daily Puzzles</h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                 {currentPuzzle ? `Find the best move for ${currentPuzzle.orientation === 'white' ? 'White' : 'Black'}` : 'Loading puzzle...'}
              </p>
            </div>
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-right">
             <span className="text-xs uppercase text-slate-500 font-bold block">Rating</span>
             <span className="text-slate-900 text-lg font-mono font-black">{profile?.puzzleRating || 1200}</span>
          </div>
        </div>
        
        <div className="rounded-b-xl overflow-hidden shadow-xl bg-slate-100 flex items-center justify-center min-h-[400px]">
          {status === 'loading' ? (
             <div className="flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="animate-spin" size={48} />
                <div className="font-bold tracking-widest text-sm uppercase">Loading Puzzle...</div>
             </div>
          ) : (
            <Chessboard 
              showBoardNotation={false}
              position={game.fen()} 
              onPieceDrop={onDrop}
              boardOrientation={currentPuzzle?.orientation || 'white'}
              customDarkSquareStyle={{ backgroundColor: activeTheme?.dark || '#739552' }}
              customLightSquareStyle={{ backgroundColor: activeTheme?.light || '#ebecd0' }}
              customPieces={customPieces}
              animationDuration={1}
            />
          )}
        </div>
      </div>
      
      <div className="w-full md:w-1/3 flex flex-col max-w-[400px] mx-auto md:mr-auto mx-0 space-y-4">
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg flex-1 flex flex-col">
           <h3 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2"><Zap className="text-yellow-600" size={18}/> Training Progress</h3>

           {!currentPuzzle ? (
             <div className="text-slate-400 text-sm italic mb-6">Loading puzzle details...</div>
           ) : (
             <div className="bg-slate-100 p-4 rounded-2xl border border-dashed border-slate-200 flex flex-col gap-3 mb-6">
                <div className="flex justify-between items-center">
                   <span className="text-xs uppercase font-bold text-slate-500">Theme</span>
                   <span className="text-blue-600 font-bold text-sm bg-blue-500/10 px-2 py-0.5 rounded truncate max-w-[150px]" title={currentPuzzle.title}>{currentPuzzle.title}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs uppercase font-bold text-slate-500">Difficulty</span>
                   <span className="text-slate-700 font-bold text-sm font-mono">{selectedRating === 'auto' ? 'Adaptive' : RATINGS.find(r => r.id === selectedRating)?.label}</span>
                </div>
             </div>
           )}

           {/* Feedback Panels */}
           {status === 'success' && (
             <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex flex-col items-center gap-2 mb-4 animate-in zoom-in duration-300">
                <CheckCircle2 className="text-green-600" size={32} />
                <h4 className="text-green-600 font-bold text-lg">Excellent!</h4>
                {attempts === 0 ? (
                  <p className="text-xs text-green-600 mb-2">+15 Rating • +15 Coins</p>
                ) : (
                  <p className="text-xs text-green-600 mb-2">Solved (with mistakes)</p>
                )}
                <button 
                  onClick={nextPuzzle}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  Next Puzzle <ArrowRight size={16} />
                </button>
             </div>
           )}

           {status === 'failed' && (
             <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl flex flex-col items-center gap-2 mb-4 animate-in zoom-in duration-300">
                <XCircle className="text-yellow-600" size={32} />
                <h4 className="text-yellow-600 font-bold text-lg">Incorrect</h4>
                <p className="text-xs text-yellow-600 mb-2">That's not the best move. Attempt 1/2.</p>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => {
                        // Undo back to the puzzle opponent's last move pos (or initial)
                        if (!currentPuzzle) return;
                        const resetGame = new Chess(currentPuzzle.fen);
                        for (let i = 0; i < moveIndex; i++) {
                           resetGame.move(currentPuzzle.solution[i]);
                        }
                        setGame(resetGame);
                        setStatus('playing');
                    }}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-200 font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
                  >
                    <RefreshCw size={14} /> Try Again
                  </button>
                </div>
             </div>
           )}

           {status === 'solution' && currentPuzzle && (
             <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex flex-col items-center gap-2 mb-4 animate-in zoom-in duration-300">
                <XCircle className="text-red-600" size={32} />
                <h4 className="text-red-500 font-bold text-lg">Puzzle Failed</h4>
                <p className="text-xs text-red-500 mb-2">-10 Rating • Solution Revealed</p>
                <div className="w-full bg-slate-100 p-2 rounded text-center mb-2 font-mono text-sm border border-slate-200 tracking-wider text-slate-900">
                  {currentPuzzle.solution.slice(moveIndex).join(' → ')}
                </div>
                <button 
                  onClick={nextPuzzle}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  Next Puzzle <ArrowRight size={16} />
                </button>
             </div>
           )}

           <div className="mt-auto pt-4 border-t border-slate-200">
             <button
               onClick={nextPuzzle}
               disabled={status === 'loading'}
               className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-xl transition-colors border border-slate-200 shadow-sm disabled:opacity-50"
             >
               Skip Puzzle
             </button>
           </div>
         </div>
      </div>
    </div>
  );
}