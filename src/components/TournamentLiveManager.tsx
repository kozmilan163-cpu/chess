import React, { useState, useEffect } from 'react';
import { Users, Clock, Play, Trophy, ChevronRight, User, Zap, BarChart3 } from 'lucide-react';
import { UserProfile } from './Profile';
import { TournamentBracketEnhanced } from './TournamentBracketEnhanced';

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

interface TournamentLiveManagerProps {
  tournamentName: string;
  timeControl: string;
  rounds: Match[][];
  participants: Participant[];
  profile: UserProfile | null;
  currentRoundIndex: number;
  onPlayMatch?: (roundIndex: number, matchIndex: number) => void;
  onCompleteMatch?: (roundIndex: number, matchIndex: number, result: 'player1' | 'player2' | 'draw') => void;
  onExitTournament?: () => void;
}

export function TournamentLiveManager({
  tournamentName,
  timeControl,
  rounds,
  participants,
  profile,
  currentRoundIndex,
  onPlayMatch,
  onCompleteMatch,
  onExitTournament
}: TournamentLiveManagerProps) {
  const [selectedMatch, setSelectedMatch] = useState<{ round: number; match: number } | null>(null);
  const [showStandings, setShowStandings] = useState(false);

  const userParticipant = participants.find(p => p.isUser);
  const currentMatch = selectedMatch ? rounds[selectedMatch.round]?.[selectedMatch.match] : null;

  // Calculate standings
  const standings = [...participants]
    .sort((a, b) => {
      const aScore = a.wins * 3 + a.draws;
      const bScore = b.wins * 3 + b.draws;
      return bScore - aScore;
    });

  const completionPercent = Math.round(
    (rounds.reduce((sum, r) => sum + r.filter(m => m.result && m.result !== 'pending').length, 0) /
      rounds.reduce((sum, r) => sum + r.length, 0)) *
    100
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="text-yellow-400" size={40} />
              {tournamentName}
            </h1>
            <div className="flex gap-6 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <Clock size={16} /> {timeControl} Blitz
              </span>
              <span className="flex items-center gap-2">
                <Users size={16} /> {participants.length} Players
              </span>
              <span className="flex items-center gap-2">
                <BarChart3 size={16} /> Round {currentRoundIndex + 1}/{rounds.length}
              </span>
              <span className={`flex items-center gap-2 ${completionPercent === 100 ? 'text-green-400' : ''}`}>
                <Zap size={16} /> {completionPercent}% Complete
              </span>
            </div>
          </div>
          <button
            onClick={onExitTournament}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition"
          >
            Exit Tournament
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Bracket (Left/Center) */}
          <div className="lg:col-span-3">
            <TournamentBracketEnhanced
              rounds={rounds}
              currentRoundIndex={currentRoundIndex}
              timeControl={timeControl}
              onSelectMatch={(round, match) => setSelectedMatch({ round, match })}
            />
          </div>

          {/* Sidebar: Standings & User Info */}
          <div className="space-y-6">
            {/* User Card */}
            {userParticipant && (
              <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl p-4 border border-cyan-400">
                <p className="text-xs text-cyan-100 mb-2 uppercase tracking-wider">Your Performance</p>
                <h3 className="text-lg font-bold mb-3">{userParticipant.name}</h3>
                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                  <div>
                    <p className="text-cyan-100">Wins</p>
                    <p className="text-2xl font-bold text-white">{userParticipant.wins}</p>
                  </div>
                  <div>
                    <p className="text-cyan-100">Draws</p>
                    <p className="text-2xl font-bold text-white">{userParticipant.draws}</p>
                  </div>
                  <div>
                    <p className="text-cyan-100">Loss</p>
                    <p className="text-2xl font-bold text-white">{userParticipant.losses}</p>
                  </div>
                </div>
                {userParticipant.streak && (
                  <div className="text-center text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${userParticipant.streak > 0 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                      {Math.abs(userParticipant.streak)} Game {userParticipant.streak > 0 ? 'Win' : 'Loss'} Streak
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Standings Toggle */}
            <button
              onClick={() => setShowStandings(!showStandings)}
              className="w-full bg-slate-800 hover:bg-slate-700 rounded-lg p-3 text-sm font-semibold transition flex items-center justify-between"
            >
              <span>Standings</span>
              <ChevronRight size={16} className={`transition ${showStandings ? 'rotate-90' : ''}`} />
            </button>

            {/* Standings */}
            {showStandings && (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {standings.slice(0, 10).map((player, idx) => {
                    const score = player.wins * 3 + player.draws;
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs transition ${
                          player.isUser ? 'bg-cyan-500/20 border border-cyan-500/50' : 'hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <span className="font-semibold truncate flex-1">{player.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{score} pts</p>
                          <p className="text-slate-400">
                            {player.wins}W-{player.draws}D-{player.losses}L
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {currentMatch && currentMatch.result === 'pending' && (
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4 border border-purple-400">
                <p className="text-xs text-purple-100 mb-2 uppercase tracking-wider">Next Match</p>
                <button
                  onClick={() => {
                    if (selectedMatch) {
                      onPlayMatch?.(selectedMatch.round, selectedMatch.match);
                    }
                  }}
                  className="w-full bg-white text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-50 transition flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> Play Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Match Detail Panel */}
        {currentMatch && (
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 backdrop-blur">
            <h3 className="text-lg font-bold mb-4">Match Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Player 1 */}
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Player 1</p>
                {currentMatch.player1 ? (
                  <>
                    <p className={`font-bold text-lg ${currentMatch.player1.isUser ? 'text-cyan-400' : 'text-white'}`}>
                      {currentMatch.player1.name}
                    </p>
                    <p className="text-sm text-slate-400 mb-3">{currentMatch.player1.title}</p>
                    <div className="grid grid-cols-2 text-xs gap-2">
                      <div>
                        <p className="text-slate-400">Rating</p>
                        <p className="font-bold text-yellow-400">{currentMatch.player1.rating}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Record</p>
                        <p className="font-bold">{currentMatch.player1.wins}-{currentMatch.player1.draws}-{currentMatch.player1.losses}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 italic">TBD</p>
                )}
              </div>

              {/* Player 2 */}
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Player 2</p>
                {currentMatch.player2 ? (
                  <>
                    <p className={`font-bold text-lg ${currentMatch.player2.isUser ? 'text-cyan-400' : 'text-white'}`}>
                      {currentMatch.player2.name}
                    </p>
                    <p className="text-sm text-slate-400 mb-3">{currentMatch.player2.title}</p>
                    <div className="grid grid-cols-2 text-xs gap-2">
                      <div>
                        <p className="text-slate-400">Rating</p>
                        <p className="font-bold text-yellow-400">{currentMatch.player2.rating}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Record</p>
                        <p className="font-bold">{currentMatch.player2.wins}-{currentMatch.player2.draws}-{currentMatch.player2.losses}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 italic">TBD</p>
                )}
              </div>
            </div>

            {/* Result Controls */}
            {currentMatch.result === 'pending' && currentMatch.player1 && currentMatch.player2 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    if (selectedMatch) {
                      onCompleteMatch?.(selectedMatch.round, selectedMatch.match, 'player1');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 rounded-lg py-2 text-sm font-semibold transition"
                >
                  {currentMatch.player1.name} Wins
                </button>
                <button
                  onClick={() => {
                    if (selectedMatch) {
                      onCompleteMatch?.(selectedMatch.round, selectedMatch.match, 'draw');
                    }
                  }}
                  className="bg-slate-600 hover:bg-slate-700 rounded-lg py-2 text-sm font-semibold transition"
                >
                  Draw
                </button>
                <button
                  onClick={() => {
                    if (selectedMatch) {
                      onCompleteMatch?.(selectedMatch.round, selectedMatch.match, 'player2');
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700 rounded-lg py-2 text-sm font-semibold transition"
                >
                  {currentMatch.player2.name} Wins
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
