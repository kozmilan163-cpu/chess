import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Timer } from './Timer';
import { ArrowLeft, RotateCcw, Link2, Copy, Check, Users, Share2, Zap, Maximize, Sparkles } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile } from './Profile';
import { playChessSound } from '../audio';
import { AIAnalysis } from './AIAnalysis';

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
  initialWhiteTime: number;
  whiteIncrement: number;
  initialBlackTime: number;
  blackIncrement: number;
  isMultiplayer?: boolean;
  hasTimeLimits?: boolean;
  speedBonus?: boolean;
  roomId?: string | null;
  isHost?: boolean;
  onBack: () => void;
  profile?: UserProfile | null;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export function ChessGame({ initialWhiteTime, whiteIncrement, initialBlackTime, blackIncrement, isMultiplayer, hasTimeLimits, speedBonus, roomId, isHost, onBack, profile, onUpdateProfile }: ChessGameProps) {
  const [game, setGame] = useState(new Chess());
  const [whiteTime, setWhiteTime] = useState(initialWhiteTime);
  const [blackTime, setBlackTime] = useState(initialBlackTime);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  
  // Multiplayer state
  const [role, setRole] = useState<'w'|'b'|'spectator'|null>(null);
  const [gameStarted, setGameStarted] = useState(!isMultiplayer);
  const [copiedLink, setCopiedLink] = useState(false);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [lastMovePositions, setLastMovePositions] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const [moveFrom, setMoveFrom] = useState<string>('');
  const [moveTo, setMoveTo] = useState<string | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  const [boardWidth, setBoardWidth] = useState(600);
  const [dottedIndicators, setDottedIndicators] = useState(false);
  const [highlightColor, setHighlightColor] = useState<'green'|'blue'|'amber'|'pink'|'purple'>('green');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [coinsAwarded, setCoinsAwarded] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [drawOfferPending, setDrawOfferPending] = useState(false);
  const [drawOfferedByOpponent, setDrawOfferedByOpponent] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'moves' | 'analyzer'>('moves');

  const activeCustomTheme = profile?.customThemes?.find(t => t.id === profile?.activeBoardTheme);
  const activeTheme = activeCustomTheme || THEMES.find(t => t.id === profile?.activeBoardTheme) || THEMES[0];

  const customPieces = React.useMemo(() => {
    // Pieces can come from activeCustomTheme (AI generated) or a standard theme with piece definitions
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
               <div style={{ width: squareWidth, height: squareWidth, padding: '5%', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

                   {/* Keep authentic features/lines on solid colors */}
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
            <div style={{ width: squareWidth, height: squareWidth, padding: '5%', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  onError={(e) => { 
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${pieceData.name}&backgroundColor=transparent`; 
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

  const timerRef = useRef<number | null>(null);

  const [shareComment, setShareComment] = useState('');

  const shareGame = async (type: 'position' | 'game' = 'game') => {
    setIsSharing(true);
    try {
      const payload = {
        pgn: game.pgn(),
        fen: type === 'position' ? game.fen() : undefined,
        author: profile?.username || 'Anonymous',
        comment: shareComment || (type === 'position' ? `What do you think of this position?` : `A nice game of chess. ${gameOverMessage}`)
      };
      
      await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setShareSuccess(true);
      setShareComment('');
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  };
  const lastTickRef = useRef<number>(Date.now());
  const socketRef = useRef<Socket | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const checkGameState = useCallback((currentGame: Chess) => {
    let resultMessage = '';
    let over = false;
    if (currentGame.isCheckmate()) {
      resultMessage = `Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins.`;
      over = true;
    } else if (currentGame.isDraw()) {
      resultMessage = 'Draw!';
      over = true;
    } else if (currentGame.isStalemate()) {
      resultMessage = 'Stalemate!';
      over = true;
    } else if (currentGame.isThreefoldRepetition()) {
      resultMessage = 'Draw by threefold repetition!';
      over = true;
    }

    if (over) {
      setIsGameOver(true);
      if (isMultiplayer && hasTimeLimits) {
        if (speedBonus) {
          if (currentGame.turn() === 'b' && whiteTime > initialWhiteTime * 0.8) {
              resultMessage += ' (Speed Bonus: White played very fast!)';
          } else if (currentGame.turn() === 'w' && blackTime > initialBlackTime * 0.8) {
              resultMessage += ' (Speed Bonus: Black played very fast!)';
          }
        }
        const whiteTotal = initialWhiteTime + whiteIncrement * 40;
        const blackTotal = initialBlackTime + blackIncrement * 40;
        if (whiteTotal > 0 && blackTotal > 0 && whiteTotal !== blackTotal) {
           const diffRatio = Math.max(whiteTotal, blackTotal) / Math.min(whiteTotal, blackTotal);
           if (diffRatio > 1.05 && !currentGame.isDraw() && !currentGame.isStalemate() && !currentGame.isThreefoldRepetition()) {
              if (currentGame.turn() === 'b' && whiteTotal < blackTotal) {
                 const bonus = (diffRatio - 1) * 100;
                 resultMessage += ` (Odds Bonus: White rating gains +${bonus.toFixed(0)}%!)`;
              } else if (currentGame.turn() === 'w' && blackTotal < whiteTotal) {
                 const bonus = (diffRatio - 1) * 100;
                 resultMessage += ` (Odds Bonus: Black rating gains +${bonus.toFixed(0)}%!)`;
              }
           }
        }
      }
      setGameOverMessage(resultMessage);
      stopTimer();
      if (isMultiplayer && socketRef.current) socketRef.current.emit("game_over", { roomId, message: resultMessage });
      return true;
    }
    return false;
  }, [stopTimer, isMultiplayer, roomId]);

  useEffect(() => {
    if (!isMultiplayer || !roomId) return;

    // Connect to same origin
    const socket = io();
    socketRef.current = socket;

    socket.emit("join_room", {
      roomId,
      isHost,
      timeParams: { whiteTime: initialWhiteTime, whiteInc: whiteIncrement, blackTime: initialBlackTime, blackInc: blackIncrement }
    });

    socket.on("room_joined", ({ role: myRole, roomState }) => {
      setRole(myRole);
      
      // Update UI matching roomState if game is active or we joined late
      if (roomState.fen) {
        setGame(new Chess(roomState.fen));
      }
      if (roomState.lastMovePositions) {
        setLastMovePositions(roomState.lastMovePositions);
      }
      
      // The host passes hasTimeLimits and speedBonus, synchronize them
      // In a real app we'd also lift these states up or use ref, but 
      // since they are passed as props from parent, ideally parent fetches them.
      // We will just use the props for now.

      setWhiteTime(roomState.whiteTime);
      setBlackTime(roomState.blackTime);
      
      if (roomState.gameStarted) {
        setGameStarted(true);
        setOpponentConnected(true);
      } else {
        // If we are joining as black and host is white, opponent is connected
        if (myRole === 'b' && roomState.players.white) setOpponentConnected(true);
        if (myRole === 'w' && roomState.players.black) setOpponentConnected(true);
      }
    });

    socket.on("player_joined", ({ role: joinedRole }) => {
      setOpponentConnected(true);
      if (joinedRole === 'w' || joinedRole === 'b') {
        setGameStarted(true);
        lastTickRef.current = Date.now();
      }
    });

    socket.on("game_started", () => {
      setGameStarted(true);
      setOpponentConnected(true);
      lastTickRef.current = Date.now();
    });

    socket.on("player_disconnected", () => {
      setOpponentConnected(false);
    });

    socket.on("opponent_moved", ({ move, fen, remainingWhiteTime, remainingBlackTime }) => {
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

    socket.on("game_over", ({ message }) => {
      setIsGameOver(true);
      setGameOverMessage(message);
      stopTimer();
    });

    socket.on("game_reset", () => {
      setGame(new Chess());
      setWhiteTime(initialWhiteTime);
      setBlackTime(initialBlackTime);
      setIsGameOver(false);
      setGameOverMessage('');
      setLastMovePositions([]);
      setCoinsAwarded(false);
      setDrawOfferPending(false);
      setDrawOfferedByOpponent(false);
      lastTickRef.current = Date.now();
    });

    socket.on("draw_offered", () => {
      setDrawOfferedByOpponent(true);
    });

    socket.on("draw_accepted", () => {
      setGameOverMessage('Draw agreed.');
      setIsGameOver(true);
      setDrawOfferPending(false);
      setDrawOfferedByOpponent(false);
    });

    socket.on("draw_declined", () => {
      setDrawOfferPending(false);
      setDrawOfferedByOpponent(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [isMultiplayer, roomId, initialWhiteTime, whiteIncrement, initialBlackTime, blackIncrement, isHost]);

  useEffect(() => {
    if (isGameOver && !coinsAwarded && profile && onUpdateProfile) {
        let earned = 10; // Default 10 coins for draw
        let isDraw = game.isDraw() || game.isStalemate() || game.isThreefoldRepetition();
        if (!isDraw) {
            let winnerRole: 'w' | 'b' | null = null;
            if (gameOverMessage.includes('White wins') || gameOverMessage.includes('Black surrendered')) {
               winnerRole = 'w';
            } else if (gameOverMessage.includes('Black wins') || gameOverMessage.includes('White surrendered')) {
               winnerRole = 'b';
            }
            
            // Check if player is the winner
            const isWinner = (winnerRole && role === winnerRole) || (winnerRole === 'w' && !isMultiplayer && (gameOverMessage.includes('Checkmate') || gameOverMessage.includes('wins') || gameOverMessage.includes('resigned')));
            if (isWinner) {
               earned = 20; // Win yields 20 coins
            } else {
               earned = 5; // Loss yields 5 coins
            }
        }
        
        if (earned > 0) { // Save history even if didn't earn coins
            const newHistory = [
              {
                id: Math.random().toString(36).substring(7),
                pgn: game.pgn(),
                fen: game.fen(),
                movesCount: game.history().length,
                result: gameOverMessage,
                opponent: isMultiplayer ? 'Online Opponent' : 'Stockfish (Local)',
                date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              },
              ...(profile.history || [])
            ].slice(0, 50); // Keep last 50 games

            onUpdateProfile({ 
              ...profile, 
              coins: (profile.coins || 0) + earned,
              history: newHistory
            });
            if (earned > 0) setGameOverMessage(prev => prev + ` (+${earned} Coins!)`);
        }
        setCoinsAwarded(true);
    }
  }, [isGameOver, coinsAwarded, profile, onUpdateProfile, game, gameOverMessage, role, isMultiplayer]);

  useEffect(() => {
    if (isGameOver || (!gameStarted && isMultiplayer) || !hasTimeLimits) return;

    if (whiteTime <= 0) {
      setIsGameOver(true);
      let msg = 'Black wins on time!';
      const whiteTotal = initialWhiteTime + whiteIncrement * 40;
      const blackTotal = initialBlackTime + blackIncrement * 40;
      if (whiteTotal > 0 && blackTotal > 0 && whiteTotal !== blackTotal) {
         const diffRatio = Math.max(whiteTotal, blackTotal) / Math.min(whiteTotal, blackTotal);
         if (diffRatio > 1.05 && blackTotal < whiteTotal) {
            const bonus = (diffRatio - 1) * 100;
            msg += ` (Odds Bonus: Black rating gains +${bonus.toFixed(0)}%!)`;
         }
      }
      setGameOverMessage(msg);
      stopTimer();
      if (isMultiplayer && socketRef.current) socketRef.current.emit("game_over", { roomId, message: msg });
      return;
    }

    if (blackTime <= 0) {
      setIsGameOver(true);
      let msg = 'White wins on time!';
      const whiteTotal = initialWhiteTime + whiteIncrement * 40;
      const blackTotal = initialBlackTime + blackIncrement * 40;
      if (whiteTotal > 0 && blackTotal > 0 && whiteTotal !== blackTotal) {
         const diffRatio = Math.max(whiteTotal, blackTotal) / Math.min(whiteTotal, blackTotal);
         if (diffRatio > 1.05 && whiteTotal < blackTotal) {
            const bonus = (diffRatio - 1) * 100;
            msg += ` (Odds Bonus: White rating gains +${bonus.toFixed(0)}%!)`;
         }
      }
      setGameOverMessage(msg);
      stopTimer();
      if (isMultiplayer && socketRef.current) socketRef.current.emit("game_over", { roomId, message: msg });
      return;
    }

    stopTimer();
    lastTickRef.current = Date.now();

    timerRef.current = window.setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      if (game.turn() === 'w') {
        setWhiteTime((prev) => Math.max(0, prev - delta));
      } else {
        setBlackTime((prev) => Math.max(0, prev - delta));
      }
    }, 100);

    return () => stopTimer();
  }, [game, isGameOver, whiteTime, blackTime, stopTimer, gameStarted, isMultiplayer, hasTimeLimits]);


  const playMoveSound = (isCapture = false, isCheck = false) => {
    if (isCheck) {
      playChessSound('check');
    } else if (isCapture) {
      playChessSound('capture');
    } else {
      playChessSound('move');
    }
  };

  function makeAMove(moveText: string | { from: string; to: string; promotion?: string }) {
    if (isGameOver || (!gameStarted && isMultiplayer)) return false;

    // Check permissions
    if (isMultiplayer) {
      if (role !== game.turn()) return false;
    }

    try {
      const gameCopy = new Chess();
      gameCopy.loadPgn(game.pgn());
      const moveResult = gameCopy.move(moveText);
      
      const isCapture = moveResult.captured !== undefined;
      const isCheck = gameCopy.inCheck();
      playMoveSound(isCapture, isCheck);
      
      const turnBefore = game.turn();
      
      setGame(gameCopy);
      setLastMovePositions([moveResult.from, moveResult.to]);
      
      let newWhiteTime = whiteTime;
      let newBlackTime = blackTime;

      if (!checkGameState(gameCopy)) {
        if (turnBefore === 'w') {
          newWhiteTime = whiteTime + whiteIncrement;
          setWhiteTime(newWhiteTime);
        } else {
          newBlackTime = blackTime + blackIncrement;
          setBlackTime(newBlackTime);
        }
      }

      if (isMultiplayer && socketRef.current) {
         socketRef.current.emit("move", { roomId, move: moveResult, fen: gameCopy.fen(), remainingWhiteTime: newWhiteTime, remainingBlackTime: newBlackTime });
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square: square as import('chess.js').Square,
      verbose: true,
    }) as any[];
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const highlightColors: Record<string, { radial: string, solid: string }> = {
      green: { radial: 'rgba(129, 182, 76, 0.65)', solid: 'rgba(129, 182, 76, 0.3)' },
      blue: { radial: 'rgba(56, 189, 248, 0.65)', solid: 'rgba(56, 189, 248, 0.3)' },
      amber: { radial: 'rgba(245, 158, 11, 0.65)', solid: 'rgba(245, 158, 11, 0.3)' },
      pink: { radial: 'rgba(236, 72, 153, 0.65)', solid: 'rgba(236, 72, 153, 0.3)' },
      purple: { radial: 'rgba(168, 85, 247, 0.65)', solid: 'rgba(168, 85, 247, 0.3)' }
    };

    const colors = highlightColors[highlightColor] || highlightColors.green;

    const newSquares: Record<string, React.CSSProperties> = {};
    moves.map((move) => {
      const isCapture = game.get(move.to as any) && game.get(move.to as any).color !== game.get(square as any).color;
      if (dottedIndicators) {
        newSquares[move.to] = {
          border: isCapture ? `4px dotted ${colors.radial}` : `3px dotted ${colors.radial}`,
          borderRadius: '50%',
          backgroundColor: isCapture ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.08)'
        };
      } else {
        newSquares[move.to] = {
          background: isCapture 
            ? `radial-gradient(circle at center, transparent 55%, ${colors.radial} 55%, ${colors.radial} 70%, transparent 70%)`
            : `radial-gradient(circle at center, ${colors.radial} 25%, transparent 25%)`,
          borderRadius: '50%'
        };
      }
      return move;
    });
    newSquares[square] = {
      backgroundColor: colors.solid,
      border: dottedIndicators ? `4px dotted ${colors.radial}` : undefined
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    if (isGameOver || (!gameStarted && isMultiplayer)) return;
    if (isMultiplayer && role !== game.turn()) return;

    // from square
    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    // to square
    if (!moveTo) {
      // check if valid move before showing dialog
      const moves = game.moves({
        verbose: true,
      }) as any[];
      const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);
      // not a valid move
      if (!foundMove) {
        // check if click on another piece
        const hasMoveOptions = getMoveOptions(square);
        // if click on another piece, set moveFrom to this piece
        // otherwise reset moveFrom back to empty
        setMoveFrom(hasMoveOptions ? square : '');
        return;
      }

      // valid move
      setMoveTo(square);

      // if promotion move
      if (
        (foundMove.color === 'w' && foundMove.piece === 'p' && square[1] === '8') ||
        (foundMove.color === 'b' && foundMove.piece === 'p' && square[1] === '1')
      ) {
        setShowPromotionDialog(true);
        return;
      }

      // is normal move
      const move = makeAMove({
        from: moveFrom,
        to: square,
        promotion: 'q',
      });

      // if invalid, setMoveFrom and getMoveOptions
      if (!move) {
        const hasMoveOptions = getMoveOptions(square);
        if (hasMoveOptions) setMoveFrom(square);
        return;
      }

      setMoveFrom('');
      setMoveTo(null);
      setOptionSquares({});
      return;
    }
  }

  function onSquareRightClick(square: string) {
    setMoveFrom('');
    setOptionSquares({});
  }

  function onPromotionPieceSelect(piece: string | undefined): boolean {
    if (piece && moveTo) {
      makeAMove({
        from: moveFrom,
        to: moveTo,
        promotion: piece[1].toLowerCase(),
      });
    }

    setMoveFrom('');
    setMoveTo(null);
    setShowPromotionDialog(false);
    setOptionSquares({});
    return true;
  }

  function onPieceDragBegin(piece: string, sourceSquare: string) {
    getMoveOptions(sourceSquare);
  }

  function onPieceDragEnd(piece: string, sourceSquare: string) {
    setOptionSquares({});
  }

  function onDrop(sourceSquare: string, targetSquare: string, piece: string) {
    if (isGameOver || (!gameStarted && isMultiplayer)) return false;
    if (isMultiplayer && role !== game.turn()) return false;

    setOptionSquares({});
    const moves = game.moves({ verbose: true }) as any[];
    const foundMove = moves.find((m) => m.from === sourceSquare && m.to === targetSquare);
    if (!foundMove) return false;

    // if promotion
    if (
      (foundMove.color === 'w' && foundMove.piece === 'p' && targetSquare[1] === '8') ||
      (foundMove.color === 'b' && foundMove.piece === 'p' && targetSquare[1] === '1')
    ) {
      setMoveFrom(sourceSquare);
      setMoveTo(targetSquare);
      setShowPromotionDialog(true);
      return false; // piece will snap back, but promotion dialog will show at the position, making it look fine if promotionToSquare is set
    }

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move) {
      setMoveFrom('');
      setMoveTo(null);
      setOptionSquares({});
      return true;
    }
    return false;
  }

  function resetGame() {
    setGame(new Chess());
    setWhiteTime(initialWhiteTime);
    setBlackTime(initialBlackTime);
    setIsGameOver(false);
    setGameOverMessage('');
    setLastMovePositions([]);
    setCoinsAwarded(false);
    lastTickRef.current = Date.now();
    if (isMultiplayer && socketRef.current) {
        socketRef.current.emit("reset_game", { roomId });
    }
  }

  const joinUrl = `${window.location.origin}/join/${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isMultiplayer && !gameStarted && role !== 'spectator') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-slate-50 text-slate-600 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6 border border-slate-200">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Invite a Friend</h2>
          <p className="text-slate-500 mb-6 font-medium">Scan the QR code or share the link below to play.</p>
          
          <div className="flex justify-center bg-white p-4 rounded-2xl shadow-inner">
             <QRCodeSVG value={joinUrl} size={200} />
          </div>

          <div className="flex items-center gap-2 mt-6">
             <div className="bg-white text-slate-600 px-3 py-3 rounded-lg flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap text-left border border-slate-200 font-mono">
                {joinUrl}
             </div>
             <button 
               onClick={copyLink}
               className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors flex-shrink-0 cursor-pointer flex items-center justify-center shadow"
               title="Copy Link"
             >
               {copiedLink ? <Check size={20} /> : <Copy size={20} />}
             </button>
          </div>

          <div className="pt-6 border-t border-slate-200 mt-6 flex justify-center">
             <div className="flex items-center gap-2 text-slate-500 font-medium">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
               </span>
               Waiting for friend to join...
             </div>
          </div>
          
          <button 
             onClick={onBack}
             className="w-full mt-4 bg-slate-50 hover:bg-slate-50 text-slate-600 hover:text-slate-900 py-3 rounded-2xl cursor-pointer transition-colors font-bold border border-slate-200"
          >
             Cancel
          </button>
        </div>
      </div>
    );
  }

  const handleSurrender = () => {
    const msg = `${role === 'w' ? 'White' : 'Black'} surrendered. ${role === 'w' ? 'Black' : 'White'} wins!`;
    if (isMultiplayer && socketRef.current) {
      socketRef.current.emit("game_over", { roomId, message: msg });
    } else {
      setGameOverMessage(msg);
      setIsGameOver(true);
    }
  };

  const handleDrawClick = () => {
    if (isMultiplayer && socketRef.current) {
      setDrawOfferPending(true);
      socketRef.current.emit("offer_draw", { roomId });
    } else {
      setGameOverMessage('Draw agreed.');
      setIsGameOver(true);
    }
  };

  const acceptDraw = () => {
    if (socketRef.current) socketRef.current.emit("draw_accepted", { roomId });
  };
  const declineDraw = () => {
    setDrawOfferedByOpponent(false);
    if (socketRef.current) socketRef.current.emit("draw_declined", { roomId });
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  lastMovePositions.forEach(pos => {
      customSquareStyles[pos] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
  });

  const { capturedByWhite, capturedByBlack, diff } = getCapturedPieces(game.fen());
  const isPlayerWhite = role !== 'b';
  const playerCaptured = isPlayerWhite ? capturedByWhite : capturedByBlack;
  const opponentCaptured = isPlayerWhite ? capturedByBlack : capturedByWhite;
  
  const playerAdvantage = isPlayerWhite ? diff : -diff;
  const opponentAdvantage = isPlayerWhite ? -diff : diff;

  const renderCapturedList = (captured: { type: string, symbol: string }[], advantage: number) => {
    if (captured.length === 0 && advantage <= 0) return null;
    return (
      <div className="flex items-center gap-1 mt-1 shrink-0 overflow-visible select-none h-4">
        <div className="flex items-center">
          {captured.map((p, idx) => (
            <span 
              key={idx} 
              className={`text-sm font-sans tracking-tight leading-none ${p.type === p.type.toLowerCase() ? 'text-slate-800' : 'text-slate-400'}`}
              style={{ marginRight: '-0.15rem' }}
            >
              {p.symbol}
            </span>
          ))}
        </div>
        {advantage > 0 && (
          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1 py-0.5 rounded leading-none ml-1">
            +{advantage}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-h-full bg-slate-50 text-slate-600 p-2 sm:p-4 md:p-8">
      <div className="w-full max-w-5xl flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-bold"
        >
          <ArrowLeft size={20} />
          <span>Exit Game</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFocusMode(!focusMode)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-bold px-3 py-1.5 rounded-lg hover:bg-slate-50"
            title={focusMode ? "Show Panels" : "Focus on Board"}
          >
            <Maximize size={18} />
            <span className="hidden sm:inline">{focusMode ? "Exit Focus" : "Focus"}</span>
          </button>
          
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-bold px-3 py-1.5 rounded-lg hover:bg-slate-50"
            title="Reset Game"
          >
            <RotateCcw size={18} />
            <span className="hidden sm:inline">Rematch</span>
          </button>
        </div>
      </div>

      <div className="w-full flex items-start gap-4 self-center" style={{ maxWidth: focusMode ? 'min(100%, 800px)' : `${boardWidth + 100}px` }}>
        <div className="flex flex-col gap-3 flex-grow">
          {/* Opponent Header (Top) */}
          <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl shadow-md flex items-center justify-center font-extrabold text-lg ${role === 'b' ? 'bg-[#f8f8f8] text-[#121211] border border-black/10' : 'bg-[#121211] text-slate-900 border border-slate-200'}`}>
                {'O'}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-slate-900 tracking-tight">Opponent</span>
                {opponentCaptured.length > 0 || opponentAdvantage > 0 ? renderCapturedList(opponentCaptured, opponentAdvantage) : <span className="text-xs font-medium text-slate-500">?</span>}
              </div>
            </div>
            {hasTimeLimits && <Timer timeInSeconds={role === 'b' ? whiteTime : blackTime} isActive={!isGameOver && game.turn() === (role === 'b' ? 'w' : 'b')} isWhite={role === 'b'} />}
          </div>

          {/* Chessboard container */}
          <div className="w-full aspect-square bg-white rounded-2xl overflow-hidden self-center shadow-xl relative"
               style={(profile?.activeBoardTheme === 'custom_upload' && profile?.customBoardImage) ? {
                  backgroundImage: `url(${profile.customBoardImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
               } : (activeCustomTheme?.customBoardImage) ? {
                  backgroundImage: `url(${activeCustomTheme.customBoardImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
               } : {}}
          >
            <Chessboard 
              showBoardNotation={false}
              position={game.fen()}
              boardOrientation={role === 'b' ? 'black' : 'white'}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
              onPieceDragBegin={onPieceDragBegin}
              onPieceDragEnd={onPieceDragEnd}
              promotionToSquare={moveTo as any}
              showPromotionDialog={showPromotionDialog}
              onPromotionPieceSelect={onPromotionPieceSelect}
              customPieces={customPieces}
              customDarkSquareStyle={{ 
                 backgroundColor: (profile?.activeBoardTheme === 'custom_upload' || activeCustomTheme?.customBoardImage) ? 'rgba(0,0,0,0.35)' : activeTheme.dark, 
                 boxShadow: activeTheme.border ? `inset 0 0 10px ${activeTheme.border}` : 'none' 
              }}
              customLightSquareStyle={{ 
                 backgroundColor: (profile?.activeBoardTheme === 'custom_upload' || activeCustomTheme?.customBoardImage) ? 'rgba(255,255,255,0.35)' : activeTheme.light, 
                 boxShadow: activeTheme.border ? `inset 0 0 10px ${activeTheme.border}` : 'none' 
              }}
              customSquareStyles={{...customSquareStyles, ...optionSquares}}
              animationDuration={animationSpeed}
              customArrowColor={
                highlightColor === 'blue' ? 'rgba(56, 189, 248, 0.85)' :
                highlightColor === 'amber' ? 'rgba(245, 158, 11, 0.85)' :
                highlightColor === 'pink' ? 'rgba(236, 72, 153, 0.85)' :
                highlightColor === 'purple' ? 'rgba(168, 85, 247, 0.85)' :
                'rgba(129, 182, 76, 0.85)'
              }
              snapToCursor={true}
            />
          </div>

          {/* Player Header (Bottom) */}
          <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl shadow-md flex items-center justify-center font-extrabold text-lg ${role === 'b' ? 'bg-[#121211] text-slate-900 border border-slate-200' : 'bg-[#f8f8f8] text-[#121211] border border-black/10'}`}>
                {profile?.username?.[0]?.toUpperCase() || 'Y'}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-slate-900 tracking-tight">{profile?.username || 'You'}</span>
                {playerCaptured.length > 0 || playerAdvantage > 0 ? renderCapturedList(playerCaptured, playerAdvantage) : <span className="text-xs font-medium text-slate-500">{profile?.localRating || 1200}</span>}
              </div>
            </div>
            {hasTimeLimits && <Timer timeInSeconds={role === 'b' ? blackTime : whiteTime} isActive={!isGameOver && game.turn() === (role === 'b' ? 'b' : 'w')} isWhite={role !== 'b'} />}
          </div>
          
          {drawOfferedByOpponent && !isGameOver && (
            <div className="bg-blue-600/20 border border-blue-600 p-3 rounded-lg flex justify-between items-center shadow-lg">
               <span className="font-bold text-slate-900 text-sm">Opponent requests a draw</span>
               <div className="flex gap-2">
                  <button onClick={acceptDraw} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold text-xs shadow">Accept</button>
                  <button onClick={declineDraw} className="bg-red-500/80 hover:bg-red-500 text-slate-900 px-3 py-1.5 rounded font-bold text-xs shadow">Decline</button>
               </div>
            </div>
          )}
        </div>
        
        {/* Buttons Sidebar */}
        {gameStarted && !isGameOver && (
          <div className="flex flex-col gap-2 pt-12">
            <button 
              onClick={handleSurrender}
              className="text-slate-500 hover:text-red-600 font-bold px-3 py-2 transition-colors text-xs uppercase cursor-pointer bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow"
            >
               Resign
            </button>
            <button 
              onClick={handleDrawClick}
              disabled={drawOfferPending}
              className={`text-slate-500 hover:text-slate-900 font-bold px-3 py-2 transition-colors text-xs uppercase cursor-pointer bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow ${drawOfferPending ? 'opacity-50' : ''}`}
            >
              {drawOfferPending ? 'Sent...' : 'Draw'}
            </button>
          </div>
        )}
      </div>
      </div>
  );
}

      {isGameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
            {/* Game Over Header */}
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                {gameOverMessage.includes("Checkmate") ? "♔ Checkmate!" : gameOverMessage.includes("wins") ? "🏆 Winner!" : "🤝 Game Over"}
              </h2>
              <p className="text-slate-600 font-medium">{gameOverMessage}</p>
            </div>

            {/* Share Section */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="block">
                <p className="text-sm font-semibold text-slate-900 mb-2">Share to Feed</p>
                <textarea
                  value={shareComment}
                  onChange={(e) => setShareComment(e.target.value)}
                  placeholder="Add a caption... (optional)"
                  maxLength={200}
                  className="w-full bg-slate-100 border-0 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  rows={3}
                />
                <p className="text-xs text-slate-500 mt-1">{shareComment.length}/200</p>
              </label>
              <button
                onClick={() => {
                  shareGame("game");
                  setTimeout(() => {
                    setShareComment("");
                  }, 500);
                }}
                disabled={isSharing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                {isSharing ? "Sharing..." : "Share Game"}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={resetGame}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Rematch
              </button>
              <button
                onClick={onBack}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
            </div>

            {shareSuccess && (
              <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm font-medium text-center">
                ✓ Game shared to feed!
              </div>
            )}
          </div>
        </div>
      )}
