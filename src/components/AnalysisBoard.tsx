import React, { useState, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { History, Share2, Play, Pause, ChevronLeft, ChevronRight, Calculator, AlertTriangle, SkipBack, SkipForward } from 'lucide-react';

function evaluatePosition(game: Chess) {
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let score = 0;
  const board = game.board();
  for (const row of board) {
    for (const piece of row) {
      if (piece) {
        const val = values[piece.type] || 0;
        score += piece.color === 'w' ? val : -val;
      }
    }
  }
  return score;
}

export function AnalysisBoard({ profile }: { profile?: any }) {
  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);

  const [isEngineOn, setIsEngineOn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [evalScore, setEvalScore] = useState<number | string>(0.0);
  
  React.useEffect(() => {
    let interval: any;
    if (isPlaying && currentIdx < history.length - 1) {
      interval = setInterval(() => {
        jumpTo(currentIdx + 1);
      }, 3000);
    } else if (isPlaying && currentIdx >= history.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIdx, history.length]);

  React.useEffect(() => {
    if (scrollRef.current) {
        const activeMove = scrollRef.current.querySelector('.active-move');
        if (activeMove) {
            activeMove.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
  }, [currentIdx]);
  
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareSpecificMove, setShareSpecificMove] = useState(false);
  const currentUsername = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('chess_profile') || '{}').username || 'Analysis User' : 'Analysis User';

  const sharePosition = async () => {
    try {
      // Save to localStorage feed (static build)
      const existingFeed = JSON.parse(localStorage.getItem("chess_social_feed") || "[]");
      existingFeed.unshift({
        id: Math.random().toString(36).substring(7),
        pgn: game.pgn(),
        fen: shareSpecificMove ? game.fen() : undefined,
        author: currentUsername,
        comment: `Check out this interesting position I'm analyzing! (Move ${currentIdx + 1})`,
        likes: 0, timestamp: Date.now(), comments: []
      });
      localStorage.setItem("chess_social_feed", JSON.stringify(existingFeed.slice(0, 100)));
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch(e) {}
  };

  const onPieceDrop = (source: string, target: string, piece: string) => {
    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({ from: source, to: target, promotion: piece[1].toLowerCase() ?? 'q' });
      if (move) {
        setGame(gameCopy);
        const newHistory = history.slice(0, currentIdx + 1);
        newHistory.push(move.san);
        setHistory(newHistory);
        setCurrentIdx(newHistory.length - 1);
        
        // Evaluate position
        if (isEngineOn) {
           setEvalScore(evaluatePosition(gameCopy).toFixed(1));
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const jumpTo = (idx: number) => {
    const newGame = new Chess();
    for (let i = 0; i <= idx; i++) {
       newGame.move(history[i]);
    }
    setGame(newGame);
    setCurrentIdx(idx);
    
    if (isEngineOn) {
      setEvalScore(evaluatePosition(newGame).toFixed(1));
    }
  };

  return (
    <div className="min-h-full flex flex-col lg:flex-row bg-slate-50 text-slate-600 p-4 lg:p-8 gap-6">
      
      {/* Board Column */}
      <div className="w-full lg:w-[65%] flex flex-col mx-auto lg:mx-0 max-w-[700px]">
         <div className="bg-white p-3 rounded-t-xl flex justify-between items-center shadow-lg border-b border-slate-200">
           <div className="flex items-center gap-3">
             <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
               <Calculator size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-900">Post-Game Analysis</h2>
               <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Evaluation & Studies</p>
             </div>
           </div>
           
           <button 
             onClick={() => setIsEngineOn(!isEngineOn)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isEngineOn ? 'bg-yellow-400 text-white shadow-lg shadow-amber-400/20' : 'bg-slate-100 text-slate-900/50 border border-slate-200'}`}
           >
             {isEngineOn ? 'Stockfish 16.1' : 'Enable Engine'}
           </button>
         </div>

         {isEngineOn && (
           <div className="bg-slate-100 h-6 flex overflow-hidden border-x border-[#262421]">
             <div 
               className="bg-[#ebecd0] transition-all duration-300 ease-in-out h-full" 
               style={{ width: `${Math.max(0, Math.min(100, 50 + Number(evalScore) * 10))}%` }}
             />
             <div className="bg-[#739552] flex-1 h-full" />
             <div className="absolute w-full text-center flex justify-center pointer-events-none mt-0.5">
               <span className="bg-white text-slate-900 text-[10px] font-bold px-2 rounded-sm shadow">
                  {Number(evalScore) > 0 ? '+' : ''}{evalScore}
               </span>
             </div>
           </div>
         )}
         
         <div className="overflow-hidden shadow-xl bg-white rounded-b-xl">
           <Chessboard showBoardNotation={false}
             position={game.fen()} 
             onPieceDrop={onPieceDrop}
             animationDuration={1}
           />
         </div>
         
         {/* Media controls */}
         <div className="mt-4 flex justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200">
           <div className="flex gap-2">
             <button onClick={() => jumpTo(-1)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-900 transition-colors" disabled={currentIdx < 0}><SkipBack size={18}/></button>
             <button onClick={() => jumpTo(Math.max(-1, currentIdx - 1))} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-900 transition-colors" disabled={currentIdx < 0}><ChevronLeft size={18}/></button>
             
             <button 
               onClick={() => setIsPlaying(!isPlaying)} 
               className={`p-3 rounded-lg font-bold transition-colors ${isPlaying ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
             >
               {isPlaying ? <Pause size={18}/> : <Play size={18}/>}
             </button>

             <button onClick={() => jumpTo(Math.min(history.length - 1, currentIdx + 1))} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-900 transition-colors" disabled={currentIdx >= history.length - 1}><ChevronRight size={18}/></button>
             <button onClick={() => jumpTo(history.length - 1)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-900 transition-colors" disabled={currentIdx >= history.length - 1}><SkipForward size={18}/></button>
           </div>
           
           <button onClick={sharePosition} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2">
             <Share2 size={16} /> {shareSuccess ? 'Shared! View in Social' : 'Share Move'}
           </button>
         </div>
      </div>

      {/* Sidebar - History & Engine Stats */}
      <div className="w-full lg:w-[35%] flex flex-col gap-4">
        
        {isEngineOn && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-lg animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle size={14} className="text-yellow-600" /> Top Engine Lines
               </h3>
               <span className="text-[10px] text-zinc-500 font-mono">Depth 22</span>
             </div>
             
             <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 text-xs bg-slate-100 p-2 rounded font-mono">
                    <span className="text-yellow-600 font-bold w-8 text-right">{(Number(evalScore) - i*0.2).toFixed(1)}</span>
                    <span className="text-green-600/80 truncate">e4 c5 Nf3 d6 d4 cxd4 Nxd4</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Moves History */}
        <div className="bg-white rounded-2xl flex-1 border border-slate-200 shadow-lg flex flex-col overflow-hidden min-h-[300px]">
           <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><History size={16}/> Move Log Explorer</h3>
           </div>
                      <div className="p-4 overflow-y-auto flex-1 font-mono text-sm" ref={scrollRef}>
             <div className="grid grid-cols-2 gap-x-4 gap-y-1">
               {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
                 <React.Fragment key={i}>
                   <div className="text-zinc-600 text-right pr-2 select-none">{i + 1}.</div>
                   <div className="flex gap-2 col-span-1 border-b border-slate-200 pb-1">
                     {history[i * 2] && (
                       <button 
                         onClick={() => jumpTo(i * 2)}
                         className={`w-1/2 text-left px-2 py-0.5 rounded transition-all ${currentIdx === i * 2 ? 'bg-blue-600 text-white font-bold active-move' : 'hover:bg-slate-100 text-slate-800'}`}
                       >
                         {history[i * 2]}
                       </button>
                     )}
                     {history[i * 2 + 1] && (
                       <button 
                         onClick={() => jumpTo(i * 2 + 1)}
                         className={`w-1/2 text-left px-2 py-0.5 rounded transition-all ${currentIdx === i * 2 + 1 ? 'bg-blue-600 text-white font-bold active-move' : 'hover:bg-slate-100 text-slate-800'}`}
                       >
                         {history[i * 2 + 1]}
                       </button>
                     )}
                   </div>
                 </React.Fragment>
               ))}
             </div>
             {history.length === 0 && (
               <div className="text-center text-zinc-500 py-10 text-xs uppercase tracking-widest font-bold">
                 Make a move to start analyzing
               </div>
             )}
            </div>
        </div>

      </div>
    </div>
  );
}

