import React, { useState, useMemo } from 'react';
import { Trophy, Users, Clock, ArrowRight, Plus, Zap } from 'lucide-react';
import { UserProfile } from './Profile';
import { TournamentLiveManager } from './TournamentLiveManager';
import { seedSingleElimination, createTournament, advanceMatch } from '../utils/tournamentSeeding';

interface Participant {
  id: string;
  name: string;
  rating: number;
  title: string;
  isUser?: boolean;
  wins: number;
  losses: number;
  draws: number;
  streak?: number;
}

interface Match {
  id: string;
  roundIndex: number;
  matchIndex: number;
  player1: Participant | null;
  player2: Participant | null;
  result?: 'player1' | 'player2' | 'draw' | 'pending';
}

interface TournamentManagerV2Props {
  profile: UserProfile | null;
  onClose: () => void;
}

const BOT_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Magnus_C', title: 'GM', rating: 2855, wins: 0, losses: 0, draws: 0 },
  { id: '2', name: 'Hikaru_N', title: 'GM', rating: 2824, wins: 0, losses: 0, draws: 0 },
  { id: '3', name: 'Danya_N', title: 'GM', rating: 2680, wins: 0, losses: 0, draws: 0 },
  { id: '4', name: 'Levy_G', title: 'IM', rating: 2420, wins: 0, losses: 0, draws: 0 },
  { id: '5', name: 'Alexandra_B', title: 'WFM', rating: 2210, wins: 0, losses: 0, draws: 0 },
  { id: '6', name: 'Andrea_B', title: 'WCM', rating: 1980, wins: 0, losses: 0, draws: 0 },
  { id: '7', name: 'Mittens', title: 'BOT', rating: 1600, wins: 0, losses: 0, draws: 0 },
  { id: '8', name: 'Martin_B', title: 'BOT', rating: 800, wins: 0, losses: 0, draws: 0 },
];

export function TournamentManagerV2({ profile, onClose }: TournamentManagerV2Props) {
  const [view, setView] = useState<'lobby' | 'register' | 'active'>('lobby');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rounds, setRounds] = useState<Match[][]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<'3|0' | '5|3' | '10|0'>('3|0');

  const userParticipant: Participant = useMemo(() => ({
    id: profile?.id || 'user_123',
    name: profile?.username || 'You',
    rating: profile?.eloRating || 1800,
    title: profile?.title || 'Player',
    isUser: true,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
  }), [profile]);

  const handleStartTournament = () => {
    if (participants.length < 2) {
      alert('Need at least 2 players');
      return;
    }

    // Create bracket
    const seedRounds = seedSingleElimination(participants);
    const matchRounds: Match[][] = seedRounds.map((round, roundIndex) =>
      round.map((match, matchIndex) => ({
        id: `match_${roundIndex}_${matchIndex}`,
        roundIndex,
        matchIndex,
        player1: match.player1,
        player2: match.player2,
        result: 'pending' as const,
      }))
    );

    setRounds(matchRounds);
    setCurrentRoundIndex(0);
    setView('active');
  };

  const handleCompleteMatch = (roundIndex: number, matchIndex: number, result: 'player1' | 'player2' | 'draw') => {
    const newRounds = rounds.map(r => [...r]);
    const match = newRounds[roundIndex][matchIndex];

    // Update match result
    match.result = result;

    // Update participant records
    const updatedParticipants = participants.map(p => {
      if (result === 'player1' && p.id === match.player1?.id) {
        return { ...p, wins: p.wins + 1, streak: (p.streak || 0) + 1 };
      }
      if (result === 'player2' && p.id === match.player2?.id) {
        return { ...p, wins: p.wins + 1, streak: (p.streak || 0) + 1 };
      }
      if (result === 'draw') {
        if (p.id === match.player1?.id || p.id === match.player2?.id) {
          return { ...p, draws: p.draws + 1, streak: 0 };
        }
      }
      if ((result === 'player1' && p.id === match.player2?.id) || (result === 'player2' && p.id === match.player1?.id)) {
        return { ...p, losses: p.losses + 1, streak: (p.streak || 0) - 1 };
      }
      return p;
    });

    // Advance winner to next round
    const nextRound = roundIndex + 1;
    if (nextRound < newRounds.length) {
      const nextMatch = newRounds[nextRound];
      const nextMatchIndex = Math.floor(matchIndex / 2);

      if (nextMatchIndex < nextMatch.length) {
        const winner = result === 'player1' ? match.player1 : result === 'player2' ? match.player2 : null;

        if (winner) {
          if (matchIndex % 2 === 0) {
            nextMatch[nextMatchIndex].player1 = winner;
          } else {
            nextMatch[nextMatchIndex].player2 = winner;
          }
        }
      }
    }

    setRounds(newRounds);
    setParticipants(updatedParticipants);

    // Check if round is complete
    if (newRounds[roundIndex].every(m => m.result !== 'pending')) {
      setCurrentRoundIndex(Math.min(nextRound || roundIndex + 1, newRounds.length - 1));
    }
  };

  if (view === 'lobby') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-8 max-w-md w-full border border-slate-700">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2 text-white">
            <Trophy className="text-yellow-400" size={32} />
            Tournament
          </h2>
          <p className="text-slate-300 mb-8">Enter the arena and prove your skill.</p>

          <div className="space-y-4">
            <button
              onClick={() => setView('register')}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Zap size={20} />
              Create Tournament
            </button>
            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-8 max-w-2xl w-full border border-slate-700 my-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Create Tournament</h2>

          {/* Time Control Selection */}
          <div className="mb-8">
            <p className="text-sm text-slate-400 mb-3 uppercase">Time Control</p>
            <div className="grid grid-cols-3 gap-3">
              {(['3|0', '5|3', '10|0'] as const).map(format => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format as any)}
                  className={`p-3 rounded-lg font-bold transition ${
                    selectedFormat === format
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {format} Blitz
                </button>
              ))}
            </div>
          </div>

          {/* Participant Selection */}
          <div className="mb-8">
            <p className="text-sm text-slate-400 mb-3 uppercase">Players ({participants.length})</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* User */}
              <div className="bg-cyan-600/20 border border-cyan-600 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{userParticipant.name}</p>
                  <p className="text-xs text-cyan-200">{userParticipant.title} • {userParticipant.rating}</p>
                </div>
                <span className="text-xs bg-cyan-600 text-white px-2 py-1 rounded">You</span>
              </div>

              {/* Bots */}
              {BOT_PARTICIPANTS.map(bot => {
                const isSelected = participants.some(p => p.id === bot.id);
                return (
                  <button
                    key={bot.id}
                    onClick={() => {
                      if (isSelected) {
                        setParticipants(participants.filter(p => p.id !== bot.id));
                      } else {
                        setParticipants([...participants, bot]);
                      }
                    }}
                    className={`w-full p-3 rounded-lg text-left transition border-2 flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-700 border-cyan-500'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-white">{bot.name}</p>
                      <p className="text-xs text-slate-400">{bot.title} • {bot.rating}</p>
                    </div>
                    {isSelected && <span className="text-cyan-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleStartTournament}
              disabled={participants.length < 2}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Zap size={20} /> Start Tournament
            </button>
            <button
              onClick={() => setView('lobby')}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active tournament view
  return (
    <TournamentLiveManager
      tournamentName="Arena Championship"
      timeControl={selectedFormat}
      rounds={rounds}
      participants={[userParticipant, ...participants]}
      profile={profile}
      currentRoundIndex={currentRoundIndex}
      onCompleteMatch={handleCompleteMatch}
      onExitTournament={onClose}
    />
  );
}
