import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward, Download } from 'lucide-react';

interface GameReplayProps {
  gamePgn: string;
  whiteName: string;
  blackName: string;
  result?: string;
  onClose?: () => void;
}

export function GameReplay({ gamePgn, whiteName, blackName, result = '1/2-1/2', onClose }: GameReplayProps) {
  const [chess] = useState(new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [boardPosition, setBoardPosition] = useState(chess.fen());
  const [selectedMove, setSelectedMove] = useState<number | null>(null);

  // Parse PGN and extract moves
  useEffect(() => {
    const game = new Chess();
    try {
      game.loadPgn(gamePgn);
      const gameHistory = game.moves({ verbose: true });
      const moveList = gameHistory.map(m => m.san);
      setMoves(moveList);
    } catch (e) {
      // If PGN parsing fails, try to parse as move list
      const moveList = gamePgn.split(' ').filter(m => m && !m.match(/^[0-9]+\.$/));
      setMoves(moveList);
    }
  }, [gamePgn]);

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlay || currentMoveIndex >= moves.length - 1) {
      setIsAutoPlay(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentMoveIndex(prev => prev + 1);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isAutoPlay, currentMoveIndex, moves.length]);

  // Update board position based on move index
  useEffect(() => {
    const game = new Chess();
    for (let i = 0; i <= currentMoveIndex && i < moves.length; i++) {
      game.move(moves[i], { sloppy: true });
    }
    setBoardPosition(game.fen());
  }, [currentMoveIndex, moves]);

  const handlePreviousMove = () => {
    setCurrentMoveIndex(prev => Math.max(-1, prev - 1));
    setIsAutoPlay(false);
  };

  const handleNextMove = () => {
    setCurrentMoveIndex(prev => Math.min(moves.length - 1, prev + 1));
  };

  const handleJumpToMove = (index: number) => {
    setCurrentMoveIndex(index);
    setIsAutoPlay(false);
  };

  const handleToggleAutoPlay = () => {
    if (currentMoveIndex >= moves.length - 1) {
      setCurrentMoveIndex(0);
    }
    setIsAutoPlay(!isAutoPlay);
  };

  const downloadPgn = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(gamePgn));
    element.setAttribute('download', `${whiteName}_vs_${blackName}.pgn`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Game Replay</h1>
            <p className="text-gray-400">
              <span className="font-semibold text-white">{whiteName}</span> vs <span className="font-semibold text-white">{blackName}</span>
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
            >
              Close
            </button>
          )}
        </div>

        {/* Board */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 mb-6 backdrop-blur">
          <div className="max-w-lg mx-auto">
            <Chessboard
              position={boardPosition}
              boardOrientation={currentMoveIndex % 2 === 0 ? 'white' : 'white'}
              arePremovesAllowed={false}
              areArrowsAllowed={false}
            />
          </div>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 backdrop-blur">
            <p className="text-xs text-gray-400 mb-1">White</p>
            <p className="font-bold text-white">{whiteName}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 backdrop-blur">
            <p className="text-xs text-gray-400 mb-1">Black</p>
            <p className="font-bold text-white">{blackName}</p>
          </div>
        </div>

        {/* Move History */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-6 backdrop-blur max-h-40 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {moves.map((move, idx) => (
              <button
                key={idx}
                onClick={() => handleJumpToMove(idx)}
                className={`px-3 py-1 rounded text-sm font-mono transition ${
                  idx === currentMoveIndex
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {idx % 2 === 0 ? Math.floor(idx / 2) + 1 + '.' : ''} {move}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMoveIndex(-1)}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
              title="Start"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={handlePreviousMove}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
              title="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleToggleAutoPlay}
              className={`p-2 rounded-lg transition ${
                isAutoPlay ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title="Auto-play"
            >
              {isAutoPlay ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={handleNextMove}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
              title="Next"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setCurrentMoveIndex(moves.length - 1)}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
              title="End"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Move {currentMoveIndex + 1} of {moves.length}
            </p>
          </div>

          <button
            onClick={downloadPgn}
            className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 transition flex items-center gap-2"
          >
            <Download size={20} />
            <span className="hidden sm:inline text-sm font-semibold">Download</span>
          </button>
        </div>

        {/* Result */}
        {currentMoveIndex === moves.length - 1 && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-amber-600/30 to-amber-500/20 border border-amber-500/50 text-center">
            <p className="text-sm text-amber-200 mb-1">Game Result</p>
            <p className="text-2xl font-bold text-amber-400">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
