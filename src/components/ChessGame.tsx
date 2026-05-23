import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Timer } from './Timer';
import { ArrowLeft, RotateCcw, Link2, Copy, Check, Users, Share2, Zap, Maximize, Sparkles, Volume2, VolumeX, ChevronLeft, ChevronRight, Keyboard } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile } from './Profile';
import { playChessSound } from '../audio';
import { AIAnalysis } from './AIAnalysis';
import { GameOverSocial } from './GameOverSocial';
import { useTheme } from '../hooks/useTheme';

import { THEMES } from './Shop';

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, P: 1, N: 3, B: 3, R: 5, Q: 9 };
const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛',
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕'
};

export function getCapturedPieces(fen: string) {
  const parts = fen.split(' ');
  const position = parts[0];
  
  const counts: Record<string, number> = {
    p: 0, n: 0, b: 0, r: 0, q: 0,
    P: 0, N: 0, B: 0, R: 0, Q: 0
  };
  
  for (const char of position) {
    if (counts[char] !== undefined) {
      counts[char]++;
    }
  }

  const starting = {
    P: 8, N: 2, B: 2, R: 2, Q: 1,
    p: 8, n: 2, b: 2, r: 2, q: 1
  };

  const capturedByWhite: { type: string; symbol: string; value: number }[] = [];
  const capturedByBlack: { type: string; symbol: string; value: number }[] = [];

  const blackKeys = ['p', 'n', 'b', 'r', 'q'] as const;
  for (const key of blackKeys) {
    const missing = starting[key] - counts[key];
    for (let i = 0; i < missing; i++) {
      capturedByWhite.push({ type: key, symbol: PIECE_SYMBOLS[key], value: PIECE_VALUES[key] });
    }
  }

  const whiteKeys = ['P', 'N', 'B', 'R', 'Q'] as const;
  for (const key of whiteKeys) {
    const missing = starting[key] - counts[key];
    for (let i = 0; i < missing; i++) {
      capturedByBlack.push({ type: key, symbol: PIECE_SYMBOLS[key], value: PIECE_VALUES[key] });
    }
  }

  const whiteScore = capturedByWhite.reduce((sum, p) => sum + p.value, 0);
  const blackScore = capturedByBlack.reduce((sum, p) => sum + p.value, 0);
  const diff = whiteScore - blackScore;

  return { capturedByWhite, capturedByBlack, diff };
}

interface ChessGameProps {
  whiteTime: number;
  whiteInc: number;
  blackTime: number;
  blackInc: number;
  isMultiplayer?: boolean;
  hasTimeLimits?: boolean;
  speedBonus?: boolean;
  roomId?: string | null;
  isHost?: boolean;
  onBack: () => void;
  profile?: UserProfile | null;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export function ChessGame({ whiteTime: initialWhiteTime, whiteInc, blackTime: initialBlackTime, blackInc, isMultiplayer, hasTimeLimits, speedBonus, roomId, isHost, onBack, profile, onUpdateProfile }: ChessGameProps) {
  const { resolvedTheme } = useTheme();
  const [game, setGame] = useState(new Chess());
  const [whiteTime, setWhiteTime] = useState(initialWhiteTime);
  const [blackTime, setBlackTime] = useState(initialBlackTime);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  
  // Multiplayer state
  const [role, setRole] = useState<'w'|'b'|'spectator'|null>(null);
  const [gameStarted, setGameStarted] = useState(!isMultiplayer);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [lastMovePositions, setLastMovePositions] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [coinsAwarded, setCoinsAwarded] = useState(false);
  const [drawOfferedByOpponent, setDrawOfferedByOpponent] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [viewFen, setViewFen] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef(Date.now());
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Initialize socket for multiplayer
  useEffect(() => {
    if (!isMultiplayer || !roomId) return;

    const newSocket = io();
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.emit("join_room", { roomId });

    newSocket.on("room_state", (roomState) => {
      const myRole = roomState.role;
      setRole(myRole);
      if (roomState.fen) {
        setGame(new Chess(roomState.fen));
      }
      setWhiteTime(roomState.whiteTime);
      setBlackTime(roomState.blackTime);
      
      if (roomState.gameStarted) {
        setGameStarted(true);
        setOpponentConnected(true);
      } else {
        if (myRole === 'b' && roomState.players.white) setOpponentConnected(true);
        if (myRole === 'w' && roomState.players.black) setOpponentConnected(true);
      }
    });

    newSocket.on("player_joined", ({ role: joinedRole, username }) => {
      setOpponentConnected(true);
      if (username) setOpponentName(username);
      if (joinedRole === 'w' || joinedRole === 'b') {
        setGameStarted(true);
        lastTickRef.current = Date.now();
      }
    });

    newSocket.on("game_started", () => {
      setGameStarted(true);
      setOpponentConnected(true);
      lastTickRef.current = Date.now();
    });

    newSocket.on("player_disconnected", () => {
      setOpponentConnected(false);
    });

    newSocket.on("opponent_moved", ({ move, fen, remainingWhiteTime, remainingBlackTime }) => {
      const gameCopy = new Chess(fen);
      const isCheck = gameCopy.inCheck();
      const didPieceCapture = move && move.san && (move.san.includes('x') || move.san.includes('X') || move.captured);
      playMoveSound(!!didPieceCapture, isCheck);

      setGame(gameCopy);
      if (move && move.from && move.to) {
        setLastMovePositions([move.from, move.to]);
      }
      setWhiteTime(remainingWhiteTime);
      setBlackTime(remainingBlackTime);
      lastTickRef.current = Date.now();
      
      checkGameState(gameCopy);
    });

    newSocket.on("game_over", ({ message }) => {
      setIsGameOver(true);
      setGameOverMessage(message);
    });

    newSocket.on("draw_offered", () => {
      setDrawOfferedByOpponent(true);
    });

    newSocket.on("draw_accepted", () => {
      setIsGameOver(true);
      setGameOverMessage('Draw agreed.');
    });

    newSocket.on("draw_rejected", () => {
      setDrawOfferedByOpponent(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isMultiplayer, roomId]);

  // Timer logic
  useEffect(() => {
    if (isGameOver || (!gameStarted && isMultiplayer) || !hasTimeLimits) return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setWhiteTime(prev => {
        if (game.turn() === 'w') {
          const newTime = Math.max(0, prev - elapsed);
          if (newTime <= 0) {
            setIsGameOver(true);
            setGameOverMessage('Black wins on time!');
          }
          return newTime;
        }
        return prev;
      });

      setBlackTime(prev => {
        if (game.turn() === 'b') {
          const newTime = Math.max(0, prev - elapsed);
          if (newTime <= 0) {
            setIsGameOver(true);
            setGameOverMessage('White wins on time!');
          }
          return newTime;
        }
        return prev;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game, isGameOver, gameStarted, isMultiplayer, hasTimeLimits]);

  const playMoveSound = (isCapture = false, isCheck = false) => {
    if (!soundEnabled) return;
    if (isCheck) {
      playChessSound('check');
    } else if (isCapture) {
      playChessSound('capture');
    } else {
      playChessSound('move');
    }
  };

  const checkGameState = (gameInstance: Chess) => {
    if (gameInstance.isCheckmate()) {
      const winner = gameInstance.turn() === 'w' ? 'Black' : 'White';
      setIsGameOver(true);
      setGameOverMessage(`${winner} wins by checkmate!`);
      if (soundEnabled) playChessSound('checkmate');
    } else if (gameInstance.isDraw()) {
      setIsGameOver(true);
      setGameOverMessage('Game drawn!');
    } else if (gameInstance.isStalemate()) {
      setIsGameOver(true);
      setGameOverMessage('Stalemate!');
    } else if (gameInstance.isThreefoldRepetition()) {
      setIsGameOver(true);
      setGameOverMessage('Draw by threefold repetition!');
    } else if (gameInstance.isInsufficientMaterial()) {
      setIsGameOver(true);
      setGameOverMessage('Draw by insufficient material!');
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (isGameOver || (!gameStarted && isMultiplayer)) return false;
    if (isMultiplayer && role && game.turn() !== role) return false;

    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    });

    if (!move) return false;

    const isCapture = move.captured !== undefined;
    const isCheck = gameCopy.inCheck();
    playMoveSound(isCapture, isCheck);

    setGame(gameCopy);
    setLastMovePositions([sourceSquare, targetSquare]);
    setMoveHistory(prev => [...prev, move.san]);
    setHistoryIndex(null);
    setViewFen(null);

    if (isMultiplayer && socketRef.current) {
      const newWhiteTime = gameCopy.turn() === 'b' ? whiteTime + (whiteInc || 0) : whiteTime;
      const newBlackTime = gameCopy.turn() === 'w' ? blackTime + (blackInc || 0) : blackTime;
      socketRef.current.emit("move", {
        roomId,
        move,
        fen: gameCopy.fen(),
        remainingWhiteTime: newWhiteTime,
        remainingBlackTime: newBlackTime
      });
    }

    checkGameState(gameCopy);
    return true;
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setIsGameOver(false);
    setGameOverMessage('');
    setLastMovePositions([]);
    setMoveHistory([]);
    setHistoryIndex(null);
    setViewFen(null);
    setCoinsAwarded(false);
    setDrawOfferedByOpponent(false);
    setShareSuccess(false);
    setShareComment('');
    if (hasTimeLimits) {
      setWhiteTime(initialWhiteTime);
      setBlackTime(initialBlackTime);
    }
    if (isMultiplayer && socketRef.current) {
      socketRef.current.emit("reset_game", { roomId });
    }
  };

  const shareGame = async (type: 'position' | 'game' = 'game') => {
    setIsSharing(true);
    try {
      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pgn: type === 'game' ? game.pgn() : game.fen(),
          fen: game.fen(),
          author: profile?.username || 'Anonymous',
          authorId: profile?.username || 'anonymous',
          comment: shareComment || (type === 'position' ? `What do you think of this position?` : `A nice game of chess. ${gameOverMessage}`),
          result: gameOverMessage.includes('White wins') ? 'win' : gameOverMessage.includes('Black wins') ? 'loss' : 'draw',
          tags: ['game']
        })
      });
      if (response.ok) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to share game:', e);
    }
    setIsSharing(false);
  };

  const copyPGN = () => {
    navigator.clipboard.writeText(game.pgn());
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const offerDraw = () => {
    if (isMultiplayer && socketRef.current) {
      socketRef.current.emit("offer_draw", { roomId });
    }
  };

  const acceptDraw = () => {
    if (isMultiplayer && socketRef.current) {
      socketRef.current.emit("accept_draw", { roomId });
      setDrawOfferedByOpponent(false);
    }
  };

  const resign = () => {
    if (isMultiplayer && socketRef.current) {
      socketRef.current.emit("resign", { roomId });
      setIsGameOver(true);
      setGameOverMessage(role === 'w' ? 'Black wins by resignation!' : 'White wins by resignation!');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateHistory(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateHistory(1);
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'a') {
        e.preventDefault();
        setShowAnalysis(prev => !prev);
      } else if (e.key === 'm') {
        e.preventDefault();
        setSoundEnabled(prev => !prev);
      } else if (e.key === 'r') {
        e.preventDefault();
        if (isGameOver) resetGame();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, moveHistory.length]);

  const navigateHistory = (direction: number) => {
    if (moveHistory.length === 0) return;
    
    let newIndex: number;
    if (historyIndex === null) {
      newIndex = direction < 0 ? moveHistory.length - 1 : moveHistory.length;
    } else {
      newIndex = historyIndex + direction;
    }
    
    newIndex = Math.max(0, Math.min(newIndex, moveHistory.length));
    
    if (newIndex === moveHistory.length) {
      setHistoryIndex(null);
      setViewFen(null);
      return;
    }
    
    const tempGame = new Chess();
    for (let i = 0; i <= newIndex; i++) {
      tempGame.move(moveHistory[i]);
    }
    
    setHistoryIndex(newIndex);
    setViewFen(tempGame.fen());
  };

  const { capturedByWhite, capturedByBlack, diff } = getCapturedPieces(viewFen || game.fen());
  const isPlayerWhite = role === 'w' || role === null || role === 'spectator';
  const playerCaptured = isPlayerWhite ? capturedByWhite : capturedByBlack;
  const playerAdvantage = isPlayerWhite ? diff : -diff;
  const opponentCaptured = isPlayerWhite ? capturedByBlack : capturedByWhite;
  const opponentAdvantage = isPlayerWhite ? -diff : diff;

  const renderCapturedList = (pieces: typeof capturedByWhite, advantage: number) => (
    <div className="flex items-center gap-1">
      {pieces.map((p, i) => (
        <span key={i} className="text-lg">{p.symbol}</span>
      ))}
      {advantage !== 0 && (
        <span className={`text-xs font-bold ml-1 ${advantage > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {advantage > 0 ? '+' : ''}{advantage}
        </span>
      )}
    </div>
  );

  const currentFen = viewFen || game.fen();
  const isViewingHistory = historyIndex !== null;

  // Determine result for GameOverSocial
  const getResult = (): 'win' | 'loss' | 'draw' => {
    if (gameOverMessage.includes('wins') && !gameOverMessage.includes('resignation')) {
      const winner = gameOverMessage.includes('White wins') ? 'w' : 'b';
      if (role) return winner === role ? 'win' : 'loss';
      return 'win';
    }
    return 'draw';
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: profile?.username || 'anonymous', toId: userId })
      });
    } catch (e) {
      console.error('Failed to send friend request:', e);
    }
  };

  return (
    <div ref={gameContainerRef} className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-50'} transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors ${soundEnabled ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              title={soundEnabled ? 'Sound on (M to toggle)' : 'Sound off (M to toggle)'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            {/* Analysis Toggle */}
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={`p-2 rounded-xl transition-colors ${showAnalysis ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
              title="Analysis (A)"
            >
              <Sparkles size={18} />
            </button>
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Fullscreen (F)"
            >
              <Maximize size={18} />
            </button>
            
            {/* Keyboard Shortcuts */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Shortcuts (?)"
            >
              <Keyboard size={18} />
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShortcuts(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">← / →</span><span className="text-slate-900 dark:text-white font-medium">Navigate move history</span></div>
                <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">F</span><span className="text-slate-900 dark:text-white font-medium">Toggle fullscreen</span></div>
                <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">A</span><span className="text-slate-900 dark:text-white font-medium">Toggle analysis</span></div>
                <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">M</span><span className="text-slate-900 dark:text-white font-medium">Toggle sound</span></div>
                <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">R</span><span className="text-slate-900 dark:text-white font-medium">Rematch (after game)</span></div>
                <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">?</span><span className="text-slate-900 dark:text-white font-medium">Show shortcuts</span></div>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Opponent Header (Top) */}
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold">
              {opponentName[0]?.toUpperCase() || '?'}
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">{opponentName}</span>
            {opponentCaptured.length > 0 || opponentAdvantage > 0 ? renderCapturedList(opponentCaptured, opponentAdvantage) : <span className="text-xs font-medium text-slate-500">?</span>}
          </div>
          {hasTimeLimits && <Timer timeInSeconds={role === 'b' ? whiteTime : blackTime} isActive={!isGameOver && game.turn() === (role === 'b' ? 'w' : 'b')} isWhite={role === 'b'} />}
        </div>

        {/* Move History Navigator */}
        {moveHistory.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <button
              onClick={() => navigateHistory(-1)}
              disabled={historyIndex !== null && historyIndex <= 0}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {historyIndex !== null ? `${historyIndex + 1} / ${moveHistory.length}` : `${moveHistory.length} moves`}
            </span>
            <button
              onClick={() => navigateHistory(1)}
              disabled={historyIndex === null}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            {isViewingHistory && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Viewing history</span>
            )}
          </div>
        )}

        {/* Chess Board */}
        <div className={`relative ${isViewingHistory ? 'opacity-80' : ''}`}>
          <Chessboard
            position={currentFen}
            onPieceDrop={isViewingHistory ? undefined : onDrop}
            boardOrientation={isPlayerWhite ? 'white' : 'black'}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: resolvedTheme === 'dark' 
                ? '0 4px 20px rgba(0,0,0,0.5)' 
                : '0 4px 20px rgba(0,0,0,0.1)'
            }}
            customDarkSquareStyle={{ backgroundColor: '#769656' }}
            customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
            customArrowColor="rgb(255, 170, 0)"
            areArrowsAllowed={true}
          />
          {isViewingHistory && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                Viewing move {historyIndex! + 1}
              </div>
            </div>
          )}
        </div>

        {/* Player Header (Bottom) */}
        <div className="flex items-center justify-between mt-2 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {profile?.username?.[0]?.toUpperCase() || 'Y'}
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">{profile?.username || 'You'}</span>
            {playerCaptured.length > 0 || playerAdvantage > 0 ? renderCapturedList(playerCaptured, playerAdvantage) : <span className="text-xs font-medium text-slate-500">?</span>}
          </div>
          {hasTimeLimits && <Timer timeInSeconds={role === 'b' ? blackTime : whiteTime} isActive={!isGameOver && game.turn() === (role === 'b' ? 'b' : 'w')} isWhite={role !== 'b'} />}
        </div>

        {/* Game Controls */}
        <div className="mt-4 flex flex-wrap gap-2">
          {!isMultiplayer && (
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <RotateCcw size={16} />
              New Game
            </button>
          )}
          
          <button
            onClick={copyPGN}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            {showCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {showCopied ? 'Copied!' : 'Copy PGN'}
          </button>

          {isMultiplayer && (
            <>
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                <Link2 size={16} />
                {showQR ? 'Hide QR' : 'Share Link'}
              </button>
              
              <button
                onClick={offerDraw}
                disabled={isGameOver || !gameStarted}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                <Users size={16} />
                Offer Draw
              </button>
              
              <button
                onClick={resign}
                disabled={isGameOver || !gameStarted}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                <Zap size={16} />
                Resign
              </button>
            </>
          )}
        </div>

        {/* QR Code */}
        {showQR && roomId && (
          <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
            <QRCodeSVG value={`${window.location.origin}/join/${roomId}`} size={128} />
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Scan to join game</p>
          </div>
        )}

        {/* Draw Offer */}
        {drawOfferedByOpponent && !isGameOver && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Opponent requests a draw</span>
              <div className="flex gap-2">
                <button onClick={acceptDraw} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  Accept
                </button>
                <button onClick={() => setDrawOfferedByOpponent(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Panel */}
        {showAnalysis && (
          <div className="mt-4">
            <AIAnalysis game={game} onClose={() => setShowAnalysis(false)} />
          </div>
        )}
      </div>

      {/* Game Over Modal - Using GameOverSocial */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GameOverSocial
            opponentProfile={isMultiplayer ? { username: opponentName, rating: 1200, id: opponentName } : undefined}
            result={getResult()}
            gamePgn={game.pgn()}
            onRematch={resetGame}
            onShareToFeed={(pgn, comment) => {
              setShareComment(comment);
              shareGame('game');
            }}
            onAddFriend={handleAddFriend}
            onBack={onBack}
            profile={profile || null}
          />
        </div>
      )}
    </div>
  );
}
