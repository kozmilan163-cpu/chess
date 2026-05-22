import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { UserProfile } from './Profile';
import { 
  Trophy, 
  Clock, 
  Users, 
  Sword, 
  ChevronLeft, 
  Flame, 
  TrendingUp, 
  Zap, 
  Coins, 
  CheckCircle, 
  Award,
  CirclePlay,
  Play
} from 'lucide-react';
import { THEMES } from './Shop';
import { KnockoutBracket, MatchNode } from './KnockoutBracket';

interface TournamentArenaProps {
  tournamentId: string;
  tournaments: any[];
  profile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
  onLeave: () => void;
}

interface Participant {
  id: string;
  name: string;
  title: string;
  rating: number;
  score: number;
  played: number;
  streak: number;
  isUser: boolean;
  country: string;
  status: 'idle' | 'playing' | 'seeking';
}

const BOT_NAMES = [
  { name: 'Magnus_C', title: 'GM', rating: 2855, country: '🇳🇴' },
  { name: 'Hikaru_N', title: 'GM', rating: 2824, country: '🇺🇸' },
  { name: 'Danya_N', title: 'GM', rating: 2680, country: '🇺🇸' },
  { name: 'Levy_G', title: 'IM', rating: 2420, country: '🇺🇸' },
  { name: 'Alexandra_B', title: 'WFM', rating: 2210, country: '🇨🇦' },
  { name: 'Andrea_B', title: 'WCM', rating: 1980, country: '🇨🇦' },
  { name: 'Mittens', title: 'BOT', rating: 1600, country: '🐱' },
  { name: 'Martin_B', title: 'BOT', rating: 800, country: '🥚' },
  { name: 'Chessbro_Boss', title: 'GM', rating: 2710, country: '👑' },
  { name: 'Deep_Sardine', title: 'COMP', rating: 3100, country: '🐟' },
];

export function TournamentArena({ tournamentId, tournaments, profile, onUpdateProfile, onLeave }: TournamentArenaProps) {
  const isKnockout = tournaments.find(t => t.id === tournamentId)?.format.includes('KNOCKOUT') || false;
  const currentTourney = tournaments.find(t => t.id === tournamentId) || {
    id: tournamentId,
    name: 'Arena Championship Tournament',
    format: '3 | 0 Blitz',
    maxPlayers: 16,
    minRating: 0,
    maxRating: 3000
  };

  // Convert time format e.g. "3 | 0 Blitz" to seconds
  const initialTimeSeconds = useMemo(() => {
    const raw = currentTourney.format.split(' ')[0];
    const mins = parseInt(raw) || 3;
    return mins * 60;
  }, [currentTourney.format]);

  // Set up list of participants
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tickerFeed, setTickerFeed] = useState<string[]>([]);
  const [arenaTimeLeft, setArenaTimeLeft] = useState(240); // 4 minutes remaining for fast, action-packed gameplay!
  const [tournamentState, setTournamentState] = useState<'lobby' | 'playing' | 'queuing' | 'finished'>('lobby');
  const [claimedReward, setClaimedReward] = useState(false);
  const [bracketRounds, setBracketRounds] = useState<MatchNode[][]>([]);

  // Active game play inside tournament
  const [activeOpponent, setActiveOpponent] = useState<Participant | null>(null);
  const [claimTitle, setClaimTitle] = useState<string | null>(null);
  const [game, setGame] = useState(new Chess());
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [userColor, setUserColor] = useState<'w' | 'b'>('w');
  const [engineEvaluating, setEngineEvaluating] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);

  // Game timers
  const [userTime, setUserTime] = useState(initialTimeSeconds);
  const [opponentTime, setOpponentTime] = useState(initialTimeSeconds);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Custom styling resolution from Profile
  const activeCustomTheme = profile?.customThemes?.find(t => t.id === profile?.activeBoardTheme);
  const activeTheme = activeCustomTheme || THEMES.find(t => t.id === profile?.activeBoardTheme) || THEMES[0];

  const customPieces = useMemo(() => {
    const themeWithPieces = activeCustomTheme || (activeTheme && (activeTheme as any).pieces ? activeTheme : null);
    if (themeWithPieces && (themeWithPieces as any).pieces) {
      const pieces: Record<string, any> = {};
      const pieceKeys = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
      pieceKeys.forEach((key) => {
        const pieceAsset = (themeWithPieces as any).pieces[key];
        if (pieceAsset) {
          pieces[key] = ({ squareWidth }: { squareWidth: number }) => {
            const isWhite = key.startsWith('w');
            if (pieceAsset.shapeUrl && (pieceAsset.textureUrl || pieceAsset.color)) {
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
                      backgroundImage: pieceAsset.textureUrl ? `url(${pieceAsset.textureUrl})` : 'none',
                      backgroundColor: pieceAsset.color || 'transparent',
                      backgroundSize: 'cover',
                      maskImage: `url(${pieceAsset.shapeUrl})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskImage: `url(${pieceAsset.shapeUrl})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      filter: pieceAsset.textureUrl && !isWhite ? 'brightness(50%) contrast(120%)' : 'none',
                    }} />

                    {/* Keep outlines for solid custom pieces */}
                    {!pieceAsset.textureUrl && pieceAsset.color && (
                      <img 
                        src={pieceAsset.shapeUrl} 
                        alt={pieceAsset.name} 
                        title={pieceAsset.name}
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
            if (pieceAsset.url) {
              return (
                <div 
                  style={{
                    width: squareWidth,
                    height: squareWidth,
                    position: 'relative',
                    backgroundImage: `url(${pieceAsset.url})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: `drop-shadow(0px 2px 3px rgba(0,0,0,0.5)) drop-shadow(0px 0px 1px black) ${!isWhite ? 'brightness(50%) contrast(120%)' : ''}`
                  }}
                >
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
              );
            }
            return null;
          };
        }
      });
      return pieces;
    }
    return undefined;
  }, [activeCustomTheme, activeTheme]);

  // Initialize participants once
  useEffect(() => {
    const initialList: Participant[] = [
      {
        id: 'user_player',
        name: profile?.username || 'You',
        title: (profile?.localRating || 1200) > 2200 ? 'GM' : 'EXP',
        rating: profile?.localRating || 1200,
        score: 0,
        played: 0,
        streak: 0,
        isUser: true,
        country: '🇺🇸',
        status: 'idle'
      }
    ];

    // Seed bots
    BOT_NAMES.forEach((bot, idx) => {
      initialList.push({
        id: `bot_${idx}`,
        name: bot.name,
        title: bot.title,
        rating: bot.rating,
        score: 0,
        played: 0,
        streak: 0,
        isUser: false,
        country: bot.country,
        status: 'idle'
      });
    });

    setParticipants(initialList.sort((a, b) => b.score - a.score || b.rating - a.rating));

    if (tournaments.find(t => t.id === tournamentId)?.format.includes('KNOCKOUT')) {
      const qfMatches = [];
      for(let i = 0; i < 4; i++) {
        qfMatches.push({
          id: `qf_${i}`,
          player1: { name: initialList[i*2].title + ' ' + initialList[i*2].name, score: null, isUser: initialList[i*2].isUser },
          player2: { name: initialList[i*2+1].title + ' ' + initialList[i*2+1].name, score: null, isUser: initialList[i*2+1].isUser }
        });
      }
      setBracketRounds([
        qfMatches,
        [ { id: 'sf_0', player1: null, player2: null }, { id: 'sf_1', player1: null, player2: null } ],
        [ { id: 'f_0', player1: null, player2: null } ]
      ]);
    }


    // Seed initial live tickers
    setTickerFeed([
      '🏆 Welcome to the Arena! Join or start matches to climb the leaderboard instantly.',
      '🔥 Double Points on offer for consecutive win streaks!',
      '⚔️ Arena countdown commenced. Top 3 claim huge coin prizes.'
    ]);
  }, [profile, currentTourney]);

  // Tournament countdown ticks & Simulated bot matches
  useEffect(() => {
    if (arenaTimeLeft <= 0) {
      setTournamentState('finished');
      return;
    }

    const interval = setInterval(() => {
      // Tick remaining tournament clock
      setArenaTimeLeft(prev => {
        if (prev <= 1) {
          setTournamentState('finished');
          return 0;
        }
        return prev - 1;
      });

      // Simulate other player games and standings updates randomly
      if (Math.random() < 0.4 && tournamentState !== 'finished') {
        setParticipants(prevPart => {
          const list = [...prevPart];
          // Get 2 random bots to play
          const bots = list.filter(p => !p.isUser);
          if (bots.length >= 2) {
            const idx1 = Math.floor(Math.random() * bots.length);
            let idx2 = Math.floor(Math.random() * bots.length);
            while (idx1 === idx2) {
              idx2 = Math.floor(Math.random() * bots.length);
            }
            const bot1 = bots[idx1];
            const bot2 = bots[idx2];

            // Decide outcome based on rating difference
            const roll = Math.random();
            let winner: Participant;
            let loser: Participant;
            let isDraw = false;

            const ratingDiff = bot1.rating - bot2.rating;
            const b1WinChance = 0.5 + (ratingDiff / 800);

            if (roll < 0.15) {
              isDraw = true;
            } else if (roll < 0.15 + (1 - 0.15) * b1WinChance) {
              winner = bot1;
              loser = bot2;
            } else {
              winner = bot2;
              loser = bot1;
            }

            if (isDraw) {
              bot1.score += 1;
              bot2.score += 1;
              bot1.played += 1;
              bot2.played += 1;
              bot1.streak = 0;
              bot2.streak = 0;
              setTickerFeed(prevFeed => [
                `🤝 GM ${bot1.name} drew with ${bot2.title} ${bot2.name} in an intense endgame!`,
                ...prevFeed.slice(0, 15)
              ]);
            } else {
              // Streak bonuses! Consecutive wins give double points (Win = 2 -> 4)
              winner!.streak += 1;
              const addedPoints = winner!.streak >= 2 ? 4 : 2;
              winner!.score += addedPoints;
              winner!.played += 1;

              loser!.streak = 0;
              loser!.played += 1;

              const isStreakText = winner!.streak >= 2 ? ` 🔥 Streaking! (+4)` : '';
              setTickerFeed(prevFeed => [
                `⚔️ ${winner.title} ${winner.name} defeated ${loser.title} ${loser.name}!${isStreakText}`,
                ...prevFeed.slice(0, 15)
              ]);
            }
          }
          // Resort ranks
          return list.sort((a, b) => b.score - a.score || b.rating - a.rating);
        });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [arenaTimeLeft, tournamentState]);

  // Setup match game timers
  useEffect(() => {
    if (tournamentState === 'playing' && !gameResult) {
      timerIntervalRef.current = setInterval(() => {
        if (userColor === (game.turn())) {
          setUserTime(prev => {
            if (prev <= 1) {
              handleGameOver('timeout_loss');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setOpponentTime(prev => {
            if (prev <= 1) {
              handleGameOver('timeout_win');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [tournamentState, game, userColor, gameResult]);

  // Clean exit for timers
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Computer AI Response
  useEffect(() => {
    const isBotTurn = (game.turn() === 'w' && userColor === 'b') || (game.turn() === 'b' && userColor === 'w');
    if (tournamentState === 'playing' && isBotTurn && !gameResult && !engineEvaluating) {
      setEngineEvaluating(true);
      
      const reactionDelay = activeOpponent ? Math.max(800, 3000 - (activeOpponent.rating / 1.5)) : 1500;

      setTimeout(() => {
        const moves = game.moves();
        if (moves.length === 0) {
          if (game.inCheck()) {
            handleGameOver('mate_loss');
          } else {
            handleGameOver('draw_stalemate');
          }
          setEngineEvaluating(false);
          return;
        }

        if (game.isDraw()) {
          handleGameOver('draw_rule');
          setEngineEvaluating(false);
          return;
        }

        // Run smart calculated botanical search
        const selectedMove = getSmartAIMove(game, activeOpponent?.rating || 1500);
        
        try {
          const newGame = new Chess(game.fen());
          newGame.move(selectedMove);
          setGame(newGame);
          setGameHistory(newGame.history());
        } catch (e) {
          // Fallback matching
          const fallback = moves[Math.floor(Math.random() * moves.length)];
          const fallbackGame = new Chess(game.fen());
          fallbackGame.move(fallback);
          setGame(fallbackGame);
          setGameHistory(fallbackGame.history());
        }
        
        setEngineEvaluating(false);
      }, reactionDelay);
    }
  }, [tournamentState, game, userColor, engineEvaluating, activeOpponent, gameResult]);

  // AI Move Engine (Heuristic min-max evaluation weights + check prevention)
  const getSmartAIMove = (currentChess: Chess, botDifficultyRating: number): string => {
    const allMoves = currentChess.moves({ verbose: true });
    
    // Egg-grade Bot: plays 90% random moves
    if (botDifficultyRating <= 1000) {
      if (Math.random() < 0.8) {
        return allMoves[Math.floor(Math.random() * allMoves.length)].san;
      }
    }

    // Moderate Cat-grade Bot: captures free pieces immediately
    if (botDifficultyRating <= 1600 && Math.random() < 0.3) {
      const captures = allMoves.filter(m => m.captured);
      if (captures.length > 0) {
        return captures[Math.floor(Math.random() * captures.length)].san;
      }
    }

    // High Level Grandmaster valuation loop (Evaluate values of target coordinates)
    let bestMove = allMoves[0];
    let bestScore = -Infinity;

    // Shuffle moves to avoid repetitive games
    const randomizedMoves = [...allMoves].sort(() => Math.random() - 0.5);

    for (const move of randomizedMoves) {
      const tempGame = new Chess(currentChess.fen());
      tempGame.move(move.san);

      // Evaluate resulting board state
      let tempScore = 0;

      // Heavy mate priorities
      if (tempGame.isGameOver()) {
        if (tempGame.inCheck()) {
          tempScore += 100000; // Instantly mate!
        }
      }

      // Check priorities
      if (tempGame.inCheck()) tempScore += 15;

      // Captured piece calculations
      if (move.captured) {
        const valueMap: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90 };
        tempScore += (valueMap[move.captured] || 10) * 10;
      }

      // Control Center squares values (e4, d4, e5, d5 bonus points)
      const centerSquares = ['e4', 'd4', 'e5', 'd5', 'c4', 'f4', 'c5', 'f5'];
      if (centerSquares.includes(move.to)) {
        tempScore += 3;
      }

      // Avoid hanging highly valued pieces (evaluate if piece is attacked after move)
      // Standard easy depth-1 safety coefficient
      if (botDifficultyRating > 1800) {
        const nextMoves = tempGame.moves({ verbose: true });
        const highestDangerAttack = nextMoves.reduce((max, nm) => {
          if (nm.to === move.to) {
            const valMap: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 9000 };
            return Math.max(max, valMap[move.piece] || 10);
          }
          return max;
        }, 0);
        tempScore -= highestDangerAttack * 5;
      }

      if (tempScore > bestScore) {
        bestScore = tempScore;
        bestMove = move;
      }
    }

    return bestMove ? bestMove.san : allMoves[0].san;
  };

  // Launch Queue Pairing Simulator
  const handleQueueNextRound = () => {
    if (tournamentState === 'finished') return;
    setTournamentState('queuing');
    
    setTimeout(() => {
      // Find a bot with similar rank/rating that is idle
      const eligibleOpponents = participants.filter(p => !p.isUser);
      const chosen = eligibleOpponents[Math.floor(Math.random() * eligibleOpponents.length)] || eligibleOpponents[0];

      setActiveOpponent(chosen);
      setGame(new Chess());
      setGameHistory([]);
      setUserColor(Math.random() < 0.5 ? 'w' : 'b');
      setGameResult(null);
      setUserTime(initialTimeSeconds);
      setOpponentTime(initialTimeSeconds);
      setTournamentState('playing');

      setTickerFeed(prev => [
        `🥊 MATCH UP: Ready! Playing against Master ${chosen.name} (${chosen.rating})!`,
        ...prev
      ]);
    }, 1800);
  };

  // Human player makes a drag-drop move on the board
  const makeMove = (sourceSquare: string, targetSquare: string) => {
    if (tournamentState !== 'playing' || gameResult) return false;

    // Check turning order
    const currentTurn = game.turn();
    if (currentTurn !== userColor) return false;

    try {
      const moveResult = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Auto-promote to Queen for easy touch interfaces
      });

      if (moveResult) {
        setGame(new Chess(game.fen()));
        setGameHistory(game.history());

        // Check if game is over after user move
        if (game.isGameOver()) {
          if (game.inCheck()) {
            handleGameOver('mate_win');
          } else {
            handleGameOver('draw_stalemate');
          }
        } else if (game.isDraw()) {
          handleGameOver('draw_rule');
        }
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  // Finish game state, evaluate bonuses, increment user stats
  const handleGameOver = (outcome: 'mate_win' | 'mate_loss' | 'timeout_win' | 'timeout_loss' | 'draw_stalemate' | 'draw_rule' | 'resign_loss' | 'resign_win') => {
    if (gameResult) return; // Prevent double trigger

    let titleResult = '';
    let gainedPoints = 0;
    let pointsAddedMsg = '';
    let userStreakModifier = 0;

    // Identify user in list
    const listCopy = [...participants];
    const userItem = listCopy.find(p => p.isUser);

    if (outcome === 'mate_win' || outcome === 'timeout_win' || outcome === 'resign_win') {
      titleResult = outcome === 'timeout_win' ? 'WIN on Time!' : 'Victory by Checkmate!';
      userStreakModifier = (userItem?.streak || 0) + 1;
      gainedPoints = userStreakModifier >= 2 ? 4 : 2;
      pointsAddedMsg = ` +${gainedPoints} Arena Points!${userStreakModifier >= 2 ? ' 🔥 Fire Streak Bonus Double!' : ''}`;
    } else if (outcome === 'mate_loss' || outcome === 'timeout_loss' || outcome === 'resign_loss') {
      titleResult = outcome === 'timeout_loss' ? 'Loss on time.' : 'Defeated.';
      userStreakModifier = 0;
      gainedPoints = 0;
      pointsAddedMsg = ' +0 Points.';
    } else {
      titleResult = 'Draw game!';
      userStreakModifier = 0;
      gainedPoints = 1;
      pointsAddedMsg = ' +1 Point.';
    }

    setGameResult(titleResult + pointsAddedMsg);

    // Apply scoreboard increments
    setParticipants(prev => {
      const nextList = prev.map(p => {
        if (p.isUser) {
          return {
            ...p,
            score: p.score + gainedPoints,
            played: p.played + 1,
            streak: userStreakModifier,
            status: 'idle' as const
          };
        }
        // Increment playing bot values too
        if (p.id === activeOpponent?.id) {
          const opponentWin = gainedPoints === 0;
          return {
            ...p,
            score: p.score + (gainedPoints === 1 ? 1 : opponentWin ? 2 : 0),
            played: p.played + 1,
            streak: opponentWin ? p.streak + 1 : 0,
            status: 'idle' as const
          };
        }
        return p;
      });
      return nextList.sort((a, b) => b.score - a.score || b.rating - a.rating);
    });

    // Provide high-fidelity feedback audio trigger or feed ticker
    setTickerFeed(prev => [
      `🏁 Finished: ${profile?.username || 'You'} scored ${gainedPoints} points against ${activeOpponent?.name}!`,
      ...prev
    ]);
  };

  const [resignConfirm, setResignConfirm] = useState(false);

  // Trigger resign
  const handleResign = () => {
    if (resignConfirm) {
      handleGameOver('resign_loss');
      setResignConfirm(false);
    } else {
      setResignConfirm(true);
      setTimeout(() => setResignConfirm(false), 3000);
    }
  };

  // Quit match screen back to Arena scoreboard
  const handleReturnToLobby = () => {
    setTournamentState('lobby');
    setActiveOpponent(null);
    setGameResult(null);
    setGame(new Chess());
  };

  // Formulate prize claim calculation on completion
  const handleClaimPrizes = () => {
    if (claimedReward || !profile) return;
    
    // Check rank
    const index = participants.findIndex(p => p.isUser);
    const place = index + 1;

    let prizeCoins = 100; // Base participation reward
    let text = 'Thank you for competing in the Championship Arena!';

    if (place === 1) {
      prizeCoins = 5000;
      text = '🎉 CHAMPION OF THE SEAS! First place podium finish!';
    } else if (place === 2) {
      prizeCoins = 2500;
      text = '🥈 Outstanding runner-up on the tournament scoreboard!';
    } else if (place === 3) {
      prizeCoins = 1000;
      text = '🥉 Elite third place bronze medal claim!';
    } else if (place <= 5) {
      prizeCoins = 500;
      text = '🎖️ Top-Tier Masterclass finish inside the elite bracket!';
    }

    const updatedProfile = {
      ...profile,
      coins: profile.coins + prizeCoins,
      localRating: Math.max(100, profile.localRating + (place <= 3 ? 50 : place <= 6 ? 10 : -20))
    };

    onUpdateProfile(updatedProfile);
    setClaimedReward(true);
    setClaimTitle(`${text}\n\nYou have been awarded 💰 ${prizeCoins} Coins added instantly to your wallet!`);
  };

  // Find user placement
  const userRankPosition = useMemo(() => {
    const idx = participants.findIndex(p => p.isUser);
    return idx + 1;
  }, [participants]);

  const userRecord = useMemo(() => {
    return participants.find(p => p.isUser) || { score: 0, streak: 0, played: 0 };
  }, [participants]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans animate-in fade-in duration-300">
      
      {/* Tournament Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={onLeave}
            className="p-2 hover:bg-slate-100 rounded-lg text-zinc-400 hover:text-slate-900 transition-colors"
            title="Leave Tournament"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-red-500 text-slate-900 px-2 py-0.5 rounded-full font-black animate-pulse uppercase tracking-widest flex items-center gap-1">
                <Zap size={10} /> Active Arena
              </span>
              <span className="text-zinc-500 font-mono text-xs">ID: {tournamentId}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="text-yellow-600" size={18} /> {currentTourney.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-200 flex items-center gap-3">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={13} /> Time Left:
            </span>
            <span className="font-mono text-sm font-black text-rose-400">
              {Math.floor(arenaTimeLeft / 60)}:{(arenaTimeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Coins className="text-yellow-600" size={16} />
            <span className="font-mono text-xs font-bold text-yellow-600">{profile?.coins || 0} Coins</span>
          </div>
        </div>
      </header>

      {/* Main Grid: Chessboard Match Vs Leaderboard Scroll */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(110vh-90px)]">
        
        
        {/* Left Column (Standings & Rolling live-updating feed) */}
        <div className="lg:col-span-4 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
          
          <div className="p-4 border-b border-slate-200 bg-white">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between mb-3">
              <span>{isKnockout ? 'Knockout Stages' : 'Arena Standings Table'}</span>
              <span className="text-blue-600 flex items-center gap-1"><Users size={12}/> {participants.length} {isKnockout ? 'Contenders' : 'Masters'}</span>
            </h3>
            
            {/* Quick stats mini ribbon */}
            <div className="grid grid-cols-3 gap-2 py-1.5 px-2 bg-slate-100 rounded-lg">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">My Rank</span>
                <span className="text-sm font-black text-slate-900">#{userRankPosition}</span>
              </div>
              <div className="text-center border-x border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase">Points</span>
                <span className="text-sm font-black text-yellow-600">{userRecord.score}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Streak</span>
                <span className="text-sm font-black text-rose-500 flex items-center justify-center gap-1">
                  {userRecord.streak} {userRecord.streak >= 2 && <Flame size={12} className="text-yellow-600 animate-bounce" />}
                </span>
              </div>
            </div>
          </div>

          {/* Standings List Container */}
          
          {isKnockout ? (
            <div className="flex-1 overflow-x-auto bg-slate-50 scrollbar-thin">
              <KnockoutBracket rounds={bracketRounds} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">

            {participants.map((p, idx) => {
              const place = idx + 1;
              const isUser = p.isUser;
              
              return (
                <div 
                  key={p.id} 
                  className={`p-3 flex items-center justify-between transition-colors ${
                    isUser ? 'bg-blue-600/15 border-l-4 border-blue-600' : 'hover:bg-white/2'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-6 text-center">
                      {place === 1 ? (
                        <span className="text-yellow-600 drop-shadow">🥇</span>
                      ) : place === 2 ? (
                        <span className="text-zinc-300 drop-shadow">🥈</span>
                      ) : place === 3 ? (
                        <span className="text-amber-600 drop-shadow">🥉</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">{place}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-200 text-rose-300 px-1 rounded font-black font-mono">
                          {p.title}
                        </span>
                        <span className={`text-xs font-bold truncate ${isUser ? 'text-slate-900' : 'text-slate-600'}`}>
                          {p.name} {p.country}
                        </span>
                        {p.streak >= 2 && (
                          <span className="bg-yellow-500/10 text-yellow-600 text-[10px] px-1 py-0.5 rounded font-black flex items-center gap-0.5">
                            <Flame size={10} /> {p.streak}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>Rating: {p.rating}</span>
                        <span>•</span>
                        <span>Played: {p.played}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-slate-900 tracking-tight">
                      {p.score} <span className="text-[10px] text-zinc-500 font-normal">pts</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>)} {/* Live scrolling game match ticker */}
          <div className="h-44 bg-slate-100 border-t border-slate-200 p-4 flex flex-col justify-end">
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1 mb-2">
              🛰️ Live Match Feed (Live Server)
            </h4>
            <div className="flex-1 overflow-y-auto space-y-2 text-xs text-zinc-400 font-mono scrollbar-none">
              {tickerFeed.length === 0 ? (
                <p className="text-zinc-600 italic">Listening for pairing feeds...</p>
              ) : (
                tickerFeed.map((feed, fIdx) => (
                  <div key={fIdx} className="border-l-2 border-zinc-700 pl-2 leading-relaxed animate-in fade-in duration-300">
                    {feed}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Playground, active chess, queuing, lobby) */}
        <div className="lg:col-span-8 bg-white flex flex-col items-center justify-center p-6 relative">
          
          {tournamentState === 'lobby' && (
            <div className="max-w-md w-full text-center space-y-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-xl">
              <div className="w-16 h-16 bg-blue-600/15 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Award size={36} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome to the Battlefield</h2>
                <p className="text-slate-600 text-sm mt-2">
                  Competing against simulated GMs. Double points awarded for win streaks. Invite codes are disabled—pure matchmaking and live leaderboard competition.
                </p>
              </div>

              <button 
                onClick={handleQueueNextRound}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 px-6 rounded-2xl text-md transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[1px]"
              >
                <CirclePlay size={20} /> Join Queue / Find Match
              </button>

              <div className="text-left bg-slate-100 p-4 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-1.5">
                <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-widest">💰 Rank Rewards payout schedule</span>
                <p>🥇 1st Place: 5,000 Coins + Rating Boost</p>
                <p>🥈 2nd Place: 2,500 Coins</p>
                <p>🥉 3rd Place: 1,000 Coins</p>
                <p>🏅 Top 5: 500 Coins</p>
              </div>
            </div>
          )}

          {tournamentState === 'queuing' && (
            <div className="max-w-xs w-full text-center space-y-5 p-8 rounded-2xl bg-white border border-slate-200 shadow-xl">
              <div className="w-12 h-12 bg-yellow-500/15 text-yellow-600 rounded-full flex items-center justify-center mx-auto tracking-widest animate-spin">
                <Sword size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pairing Up Opponent...</h3>
                <p className="text-xs text-slate-500 mt-1.5">Calculating rating distances, tournament score weights, and board asset bindings...</p>
              </div>
            </div>
          )}

          {tournamentState === 'playing' && activeOpponent && (
            <div className="w-full max-w-[580px] flex flex-col gap-3">
              
              {/* Opponent Card Info */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-rose-300">
                    {activeOpponent.title}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{activeOpponent.name}</span>
                      <span>{activeOpponent.country}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block -mt-0.5">Opponent Rating: {activeOpponent.rating}</span>
                  </div>
                </div>

                {/* Opponent Timer */}
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-md font-black text-red-600">
                  {Math.floor(opponentTime / 60)}:{(opponentTime % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Main Arena Gameplay Board */}
              <div 
                className="w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-xl relative"
                style={activeCustomTheme?.customBoardImage ? {
                  backgroundImage: `url(${activeCustomTheme.customBoardImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : {}}
              >
                <Chessboard 
                  showBoardNotation={false}
                  position={game.fen()}
                  boardWidth={580}
                  onPieceDrop={makeMove}
                  boardOrientation={userColor === 'w' ? 'white' : 'black'}
                  customPieces={customPieces}
                  customDarkSquareStyle={{ 
                    backgroundColor: (profile?.activeBoardTheme === 'custom_upload' || activeCustomTheme?.customBoardImage) ? 'rgba(0,0,0,0.38)' : activeTheme.dark, 
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)' 
                  }}
                  customLightSquareStyle={{ 
                    backgroundColor: (profile?.activeBoardTheme === 'custom_upload' || activeCustomTheme?.customBoardImage) ? 'rgba(255,255,255,0.38)' : activeTheme.light, 
                    boxShadow: 'inset 0 0 5px rgba(255,255,255,0.05)'
                  }}
                  animationDuration={1}
                />
              </div>

              {/* Player Card Info */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-600/20 flex items-center justify-center font-bold text-blue-600">
                    ME
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{profile?.username || 'You'} (White)</h4>
                    <span className="text-[10px] text-zinc-400 block -mt-0.5">Rating: {profile?.localRating || 1200}</span>
                  </div>
                </div>

                {/* User Active Timer */}
                <div className={`px-3 py-1.5 rounded-lg border font-mono text-md font-black transition-colors ${
                  game.turn() === userColor 
                    ? 'bg-yellow-500/10 border-amber-500/40 text-yellow-600' 
                    : 'bg-slate-100 border-slate-200 text-zinc-400'
                }`}>
                  {Math.floor(userTime / 60)}:{(userTime % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Action Ribbon inside live game play */}
              <div className="flex gap-2.5 mt-1">
                {gameResult ? (
                  <div className="flex-1 bg-slate-200 border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-3 animate-in slide-in-from-bottom duration-300">
                    <span className="text-sm font-black text-yellow-600">{gameResult}</span>
                    <button 
                      onClick={handleReturnToLobby}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-2 px-5 rounded-lg transition-colors uppercase tracking-wider"
                    >
                      Return to Arena Scoreboard
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={handleResign}
                      className="flex-1 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/30 text-rose-400 text-xs font-bold rounded-lg transition-all"
                    >
                      Resign Game
                    </button>
                    <button 
                      onClick={() => handleGameOver(game.turn() === 'w' ? 'draw_rule' : 'draw_rule')}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-slate-200 text-xs font-bold rounded-lg transition-all"
                    >
                      Claim Draw
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {tournamentState === 'finished' && (
            <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-white border-2 border-amber-500/30 shadow-xl animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-amber-500/20">
                <Award size={48} className="animate-bounce" />
              </div>
              
              <div>
                <span className="text-xs bg-yellow-500/10 text-yellow-600 font-extrabold tracking-widest uppercase py-1 px-3 rounded-full">
                  ARENA LOCKED
                </span>
                <h2 className="text-3xl font-black text-slate-900 mt-4 tracking-tight">Tournament Complete!</h2>
                <span className="text-zinc-400 text-sm block mt-1">Final placement evaluations computed. Claim your podium bounty coins.</span>
              </div>

              {/* Podium display */}
              <div className="bg-slate-200 p-4 rounded-2xl space-y-3.5 text-left border border-slate-200">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Official Final Podiums</span>
                {participants.slice(0, 3).map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                      <span className="bg-slate-100 text-zinc-400 font-mono text-[9px] px-1 rounded">{p.title}</span>
                      <span className={`font-bold ${p.isUser ? 'text-blue-600' : 'text-slate-900'}`}>{p.name}</span>
                    </div>
                    <span className="font-black text-yellow-600 font-mono">{p.score} pts</span>
                  </div>
                ))}
              </div>

              <div className="py-2.5">
                <div className="text-sm font-bold text-zinc-300">
                  You placed <span className="text-blue-600 text-lg font-black">#{userRankPosition}</span> of {participants.length} competitors!
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleClaimPrizes}
                  disabled={claimedReward}
                  className={`flex-1 py-3 px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    claimedReward 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-slate-200' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  }`}
                >
                  <Coins size={14} /> {claimedReward ? 'Reward Claimed' : 'Claim Rank Bounty / Coins'}
                </button>
                <button 
                  onClick={onLeave}
                  className="py-3 px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-black rounded-2xl border border-slate-200 uppercase tracking-wider"
                >
                  Exit Arena
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
