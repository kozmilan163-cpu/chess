import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { multiplayer, GameRoom } from '../utils/multiplayerRealtime';
import { Share2, LogOut } from 'lucide-react';

export interface MultiplayerGameViewProps {
  room: GameRoom;
  playerName: string;
  onGameOver: (result: string) => void;
  onLeave: () => void;
}

export default function MultiplayerGameView({
  room: initialRoom,
  playerName,
  onGameOver,
  onLeave,
}: MultiplayerGameViewProps) {
  const [room, setRoom] = useState(initialRoom);
  const [game, setGame] = useState(new Chess(room.fen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Determine player color based on creation
  useEffect(() => {
    const isCreator = room.creator === playerName;
    setPlayerColor(isCreator ? 'white' : 'black');
  }, [room, playerName]);

  // Subscribe to room updates
  useEffect(() => {
    const unsub = multiplayer.subscribe(room.roomCode, (updatedRoom) => {
      setRoom(updatedRoom);

      if (updatedRoom.fen !== game.fen()) {
        const newGame = new Chess(updatedRoom.fen);
        setGame(newGame);

        if (newGame.isGameOver()) {
          let result = 'draw';
          if (newGame.isCheckmate()) {
            result = newGame.turn() === 'w' ? 'Black wins!' : 'White wins!';
          }
          onGameOver(result);
        }
      }
    });

    setUnsubscribe(() => unsub);
    return () => unsub();
  }, [room.roomCode, game, onGameOver]);

  const handleSquareClick = (square: string) => {
    // Get piece at clicked square
    const piece = game.get(square);

    if (selectedSquare === null) {
      // First click — select piece
      if (!piece) return;

      const pieceTurn = piece.color === 'w' ? 'white' : 'black';
      if (pieceTurn !== playerColor) return; // Wrong color

      const moves = game.moves({ square, verbose: true });
      setSelectedSquare(square);
      setLegalMoves(moves.map((m) => m.to));
    } else {
      // Second click — make move
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      if (!legalMoves.includes(square)) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Make move
      const newGame = new Chess(game.fen());
      const move = newGame.move({ from: selectedSquare, to: square, promotion: 'q' });

      if (move) {
        setGame(newGame);
        multiplayer.updateGameState(room.roomCode, {
          currentFen: newGame.fen(),
          lastMoveTime: Date.now(),
          result: newGame.isGameOver()
            ? newGame.isCheckmate()
              ? newGame.turn() === 'w'
                ? 'black'
                : 'white'
              : 'draw'
            : null,
        });
      }

      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const isMyTurn = game.turn() === (playerColor === 'white' ? 'w' : 'b');
  const opponent = room.creator === playerName ? room.opponent : room.creator;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Room: {room.roomCode}</h2>
            <p className="text-slate-400 text-sm">
              {isMyTurn ? 'Your turn' : `${opponent}'s turn`}
            </p>
          </div>
          <button
            onClick={onLeave}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <LogOut size={16} /> Leave
          </button>
        </div>

        {/* Players */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`bg-slate-800 p-4 rounded-lg ${playerColor === 'white' ? 'border-2 border-amber-400' : ''}`}>
            <p className="text-xs text-slate-400">WHITE</p>
            <p className="font-bold text-lg">{room.creator}</p>
            <p className="text-sm text-slate-400">{room.whiteTimer}s</p>
          </div>
          <div className={`bg-slate-800 p-4 rounded-lg ${playerColor === 'black' ? 'border-2 border-amber-400' : ''}`}>
            <p className="text-xs text-slate-400">BLACK</p>
            <p className="font-bold text-lg">{room.opponent || 'Waiting...'}</p>
            <p className="text-sm text-slate-400">{room.blackTimer}s</p>
          </div>
        </div>

        {/* Board */}
        <div className="bg-slate-900 p-4 rounded-lg mb-6 border border-slate-700">
          <Chessboard
            position={game.fen()}
            onSquareClick={handleSquareClick}
            boardOrientation={playerColor === 'white' ? 'white' : 'black'}
            customSquareStyles={{
              ...legalMoves.reduce(
                (acc, sq) => ({
                  ...acc,
                  [sq]: { background: 'rgba(255, 193, 7, 0.3)', borderRadius: '50%' },
                }),
                {}
              ),
              [selectedSquare || '']: { background: 'rgba(255, 193, 7, 0.5)' },
            }}
          />
        </div>

        {/* Share Button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
          <Share2 size={18} /> Share Game to Feed
        </button>
      </div>
    </div>
  );
}
