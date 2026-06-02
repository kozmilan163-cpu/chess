import React, { useState, useEffect } from 'react';
import { getGameHistory, SavedGame, deleteGame } from '../utils/gameHistory';
import { GameReplay } from './GameReplay';
import { Trash2, Play, Calendar, Users, Award } from 'lucide-react';

interface GameLibraryProps {
  currentUsername: string;
}

export function GameLibrary({ currentUsername }: GameLibraryProps) {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<SavedGame | null>(null);
  const [filterResult, setFilterResult] = useState<'all' | '1-0' | '0-1' | '1/2-1/2'>('all');

  useEffect(() => {
    const allGames = getGameHistory();
    setGames(allGames);
  }, []);

  const filtered = games.filter(g => {
    if (filterResult === 'all') return true;
    return g.result === filterResult;
  });

  const handleDeleteGame = (id: string) => {
    if (confirm('Delete this game?')) {
      deleteGame(id);
      setGames(games.filter(g => g.id !== id));
    }
  };

  const getResultLabel = (game: SavedGame) => {
    const isWhite = game.whiteName === currentUsername;
    if (game.result === '1/2-1/2') return '½-½';
    if (game.result === '1-0') return isWhite ? 'Won' : 'Lost';
    return isWhite ? 'Lost' : 'Won';
  };

  const getResultColor = (game: SavedGame) => {
    const isWhite = game.whiteName === currentUsername;
    if (game.result === '1/2-1/2') return 'text-yellow-400';
    if (game.result === '1-0') return isWhite ? 'text-green-400' : 'text-red-400';
    return isWhite ? 'text-red-400' : 'text-green-400';
  };

  if (selectedGame) {
    return (
      <GameReplay
        gamePgn={selectedGame.pgn}
        whiteName={selectedGame.whiteName}
        blackName={selectedGame.blackName}
        result={selectedGame.result}
        onClose={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold mb-2">📚 Game Library</h1>
          <p className="text-gray-400">Your game history and analysis</p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-6">
          {['all', '1-0', '0-1', '1/2-1/2'].map(result => (
            <button
              key={result}
              onClick={() => setFilterResult(result as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterResult === result
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {result === 'all' ? 'All Games' : result === '1-0' ? 'Wins' : result === '0-1' ? 'Losses' : 'Draws'}
            </button>
          ))}
        </div>

        {/* Games list */}
        {filtered.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 text-center">
            <p className="text-gray-400 text-lg">No games found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(game => {
              const isWhite = game.whiteName === currentUsername;
              const opponent = isWhite ? game.blackName : game.whiteName;
              const opponentRating = isWhite ? game.blackRating : game.whiteRating;
              
              return (
                <div
                  key={game.id}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition backdrop-blur"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Game info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-white">
                            {game.whiteName} vs {game.blackName}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {game.moves} moves • {game.timeControl}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Result & stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getResultColor(game)}`}>
                          {getResultLabel(game)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          vs {opponent} ({opponentRating})
                        </p>
                      </div>

                      {/* Date */}
                      <div className="text-right text-xs text-gray-400">
                        <p>{new Date(game.timestamp).toLocaleDateString()}</p>
                        <p>{new Date(game.timestamp).toLocaleTimeString()}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedGame(game)}
                          className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 transition"
                          title="Replay"
                        >
                          <Play size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="p-2 rounded-lg bg-slate-700 hover:bg-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
