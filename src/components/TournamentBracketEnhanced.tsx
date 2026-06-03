import React, { useMemo } from 'react';
import { Trophy, Zap, Clock, Users, ChevronRight, User } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  rating: number;
  title?: string;
  isUser?: boolean;
}

interface Match {
  id: string;
  roundIndex: number;
  matchIndex: number;
  player1: Participant | null;
  player2: Participant | null;
  result?: 'player1' | 'player2' | 'draw' | 'pending';
}

interface TournamentBracketEnhancedProps {
  rounds: Match[][];
  currentRoundIndex: number;
  timeControl?: string;
  onSelectMatch?: (roundIndex: number, matchIndex: number) => void;
}

export function TournamentBracketEnhanced({
  rounds,
  currentRoundIndex,
  timeControl = '3|0',
  onSelectMatch
}: TournamentBracketEnhancedProps) {
  if (!rounds || rounds.length === 0) return null;

  const getRoundLabel = (index: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - 1 - index;
    if (roundsFromEnd === 0) return 'Finals';
    if (roundsFromEnd === 1) return 'Semifinals';
    if (roundsFromEnd === 2) return 'Quarterfinals';
    return `Round ${index + 1}`;
  };

  const isRoundActive = (index: number) => index === currentRoundIndex;
  const isRoundComplete = (index: number) => index < currentRoundIndex;

  const getRatingColor = (rating: number) => {
    if (rating >= 2400) return 'from-yellow-600 to-orange-500';
    if (rating >= 2200) return 'from-orange-500 to-red-500';
    if (rating >= 1800) return 'from-red-500 to-pink-500';
    if (rating >= 1400) return 'from-green-500 to-emerald-500';
    return 'from-blue-500 to-cyan-500';
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-8 border border-slate-700 overflow-x-auto">
      {/* Tournament Header */}
      <div className="mb-8 pb-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
              <Trophy size={28} className="text-yellow-400" />
              Tournament Bracket
            </h2>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Clock size={14} /> Time Control: {timeControl} Blitz
              <span className="text-yellow-400 ml-2">
                Round {currentRoundIndex + 1} of {rounds.length}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Players</p>
            <p className="text-2xl font-bold text-cyan-400">{rounds[0].length * 2}</p>
          </div>
        </div>
      </div>

      {/* Bracket Visualization */}
      <div className="flex gap-12 overflow-x-auto pb-4">
        {rounds.map((round, roundIndex) => (
          <div
            key={roundIndex}
            className={`flex-shrink-0 transition-all duration-300 ${
              isRoundActive(roundIndex) ? 'scale-105' : ''
            }`}
          >
            {/* Round Label */}
            <div className="text-center mb-4">
              <h3 className="text-sm font-bold text-white">
                {getRoundLabel(roundIndex, rounds.length)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRoundComplete(roundIndex) && '✓ Complete'}
                {isRoundActive(roundIndex) && '● Active'}
                {!isRoundComplete(roundIndex) && !isRoundActive(roundIndex) && 'Upcoming'}
              </p>
            </div>

            {/* Matches */}
            <div className="flex flex-col gap-8 min-w-[260px]">
              {round.map((match, matchIndex) => {
                const isActive = isRoundActive(roundIndex);
                const isComplete =
                  match.result && match.result !== 'pending';

                return (
                  <div
                    key={match.id}
                    onClick={() => isActive && onSelectMatch?.(roundIndex, matchIndex)}
                    className={`relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                      isActive
                        ? 'border-cyan-500 hover:border-cyan-400 cursor-pointer hover:shadow-lg hover:shadow-cyan-500/30'
                        : isComplete
                        ? 'border-green-500/50'
                        : 'border-slate-700'
                    }`}
                  >
                    {/* Player 1 */}
                    <PlayerCard
                      player={match.player1}
                      isWinner={match.result === 'player1'}
                      isLowered={false}
                      position="top"
                    />

                    {/* VS Divider */}
                    <div className="h-px bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 flex items-center justify-center">
                      <span className="text-xs text-slate-400 bg-slate-900 px-2">VS</span>
                    </div>

                    {/* Player 2 */}
                    <PlayerCard
                      player={match.player2}
                      isWinner={match.result === 'player2'}
                      isLowered={true}
                      position="bottom"
                    />

                    {/* Winner Badge */}
                    {isComplete && (
                      <div className="absolute top-1 right-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <Trophy size={12} /> Winner
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Match Status Footer */}
      <div className="mt-8 pt-6 border-t border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
          <div>
            <p className="text-slate-400 mb-1">Completed</p>
            <p className="text-lg font-bold text-green-400">
              {rounds.reduce((sum, r) => sum + r.filter(m => m.result === 'player1' || m.result === 'player2').length, 0)}/{rounds.reduce((sum, r) => sum + r.length, 0)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Win Rate</p>
            <p className="text-lg font-bold text-blue-400">
              {currentRoundIndex > 0 ? `${currentRoundIndex} wins` : 'Starting'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Format</p>
            <p className="text-lg font-bold text-cyan-400">Single Elim</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Rounds Left</p>
            <p className="text-lg font-bold text-yellow-400">
              {Math.max(0, rounds.length - currentRoundIndex - 1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlayerCardProps {
  player: Participant | null;
  isWinner: boolean;
  isLowered: boolean;
  position: 'top' | 'bottom';
}

function PlayerCard({ player, isWinner, isLowered, position }: PlayerCardProps) {
  if (!player) {
    return (
      <div className="p-3 bg-slate-950/50 text-slate-500 text-xs">
        <div className="font-bold">BYE</div>
        <div className="text-slate-600">Next round winner</div>
      </div>
    );
  }

  const ratingColor = getRatingGradient(player.rating);

  return (
    <div
      className={`p-3 transition-all ${
        isWinner ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-l-2 border-green-500' : 'bg-slate-950/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${ratingColor} flex items-center justify-center`}>
              <span className="text-xs font-bold text-white">{player.title?.[0] || 'P'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${player.isUser ? 'text-cyan-400' : 'text-white'}`}>
                {player.name}
              </p>
              <p className="text-xs text-slate-400">{player.title || 'Player'}</p>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-400 mb-0.5">Rating</p>
          <p className={`text-sm font-bold ${ratingColor.replace('bg-', 'text-')}`}>{player.rating}</p>
        </div>
      </div>
      {isWinner && (
        <div className="mt-2 text-xs font-semibold text-green-400 flex items-center gap-1">
          <Trophy size={12} /> Advanced
        </div>
      )}
    </div>
  );
}

function getRatingGradient(rating: number) {
  if (rating >= 2400) return 'from-yellow-600 to-orange-500';
  if (rating >= 2200) return 'from-orange-500 to-red-500';
  if (rating >= 1800) return 'from-red-500 to-pink-500';
  if (rating >= 1400) return 'from-green-500 to-emerald-500';
  return 'from-blue-500 to-cyan-500';
}
