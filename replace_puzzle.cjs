const fs = require('fs');

let content = fs.readFileSync('src/components/Puzzles.tsx', 'utf8');

const targetStr = `  return (
    <div className="min-h-full flex flex-col md:flex-row bg-slate-50 p-4 md:p-8 gap-6">`;

const replaceStr = `  return (
    <div className="min-h-full flex flex-col md:flex-row bg-slate-50 p-4 md:p-8 gap-6">
      
      <div className="w-full md:w-2/3 max-w-[600px] flex flex-col mx-auto md:ml-auto md:mx-0">
        <div className="bg-white p-4 rounded-t-xl flex justify-between items-center shadow-lg border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Target className="text-yellow-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Daily Puzzles</h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                 {currentPuzzle ? \`Find the best move for \${currentPuzzle.orientation === 'white' ? 'White' : 'Black'}\` : 'Loading puzzle...'}
              </p>
            </div>
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
             <span className="text-xs uppercase text-slate-500 font-bold block">Puzzle Rating</span>
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
              position={game.fen()} 
              onPieceDrop={onDrop}
              boardOrientation={currentPuzzle?.orientation || 'white'}
              customDarkSquareStyle={{ backgroundColor: profile?.customThemes?.[0]?.dark || '#739552' }}
              customLightSquareStyle={{ backgroundColor: profile?.customThemes?.[0]?.light || '#ebecd0' }}
              customPieces={profile?.customThemes?.[0]?.pieces || undefined}
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
                   <span className="text-yellow-600 font-bold text-sm bg-yellow-500/10 px-2 py-0.5 rounded truncate max-w-[150px]" title={currentPuzzle.title}>{currentPuzzle.title}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs uppercase font-bold text-slate-500">Source</span>
                   <a href={currentPuzzle.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold text-sm hover:underline">Chess.com</a>
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
}`;

let startIdx = content.indexOf(targetStr);
if (startIdx !== -1) {
    content = content.slice(0, startIdx) + replaceStr + '\n}\n';
    fs.writeFileSync('src/components/Puzzles.tsx', content);
    console.log('Replaced puzzle UI');
} else {
    console.log('Target string not found');
}
