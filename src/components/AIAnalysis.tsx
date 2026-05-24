import React, { useState } from 'react';
import { Sparkles, Loader2, Zap } from 'lucide-react';
import Markdown from 'react-markdown';

interface AIAnalysisProps {
  pgn: string;
  fen: string;
}

export function AIAnalysis({ pgn, fen }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [stockfishEval, setStockfishEval] = useState<{ eval: number, move: string, winChance: number, text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [stockfishLoading, setStockfishLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      // Local analysis — no server needed
      const moves = pgn.split(/\d+\./).filter(Boolean);
      const totalMoves = moves.length;
      const phase = totalMoves <= 8 ? 'Opening' : totalMoves <= 22 ? 'Middlegame' : 'Endgame';
      const tips = [
        '♟ Control the center with pawns and pieces early.',
        '🏰 Castle early to protect your king.',
        '🔗 Connect your rooks after castling.',
        '🎯 Always look for forks, pins, and skewers before moving.',
        '📖 Study the opening you played to understand key ideas.',
      ];
      const analysis = `## Game Analysis\n\n**Phase:** ${phase} (${totalMoves * 2} half-moves)\n\n**Key Principles:**\n${tips.map(t => `- ${t}`).join('\n')}\n\n*Use the Stockfish engine below for move-by-move computer analysis.*`;
      setAnalysis(analysis);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockfishEval = async () => {
    if (!fen) return;
    setStockfishLoading(true);
    setError(null);
    try {
      const res = await fetch('https://chess-api.com/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
        throw new Error("Failed to fetch Stockfish analysis.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStockfishLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 mt-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-yellow-600" />
          Game Analysis
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={fetchAnalysis}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 text-xs shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
            AI Insights
          </button>
          <button 
            onClick={fetchStockfishEval}
            disabled={stockfishLoading || !fen}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 text-xs shadow-md disabled:opacity-50"
          >
            {stockfishLoading ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14}/>}
            Stockfish API
          </button>
        </div>
      </div>

      {stockfishEval && (
        <div className="bg-slate-100 p-4 rounded-lg mb-4 border border-slate-200 text-sm">
           <div className="flex justify-between items-center mb-4">
             <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Engine Evaluation (Stockfish 16.1)</span>
             <div className="bg-white px-3 py-1 rounded text-yellow-600 font-mono font-bold text-xs border border-slate-200">
                Win Chance: {stockfishEval.winChance?.toFixed(1)}%
             </div>
           </div>
           
           <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4 border-r border-slate-200 pr-6">
                <div className="flex flex-col items-center">
                   <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Eval</span>
                   <div className={`text-3xl font-black ${Number(stockfishEval.eval) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(stockfishEval.eval) > 0 ? '+' : ''}{stockfishEval.eval}
                   </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                 <div>
                   <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Best Move</div>
                   <div className="font-mono text-lg text-slate-900 font-bold">{stockfishEval.move}</div>
                 </div>
                 
                 {stockfishEval.text && (
                   <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-800 text-sm italic">
                     "{stockfishEval.text}"
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col flex-1 items-center justify-center p-8 text-slate-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Analyzing game patterns...</p>
        </div>
      )}

      {error && (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {analysis && (
        <div className="prose  max-w-none text-slate-800 text-sm">
           <div className="markdown-body">
              <Markdown>{analysis}</Markdown>
           </div>
        </div>
      )}
    </div>
  );
}

