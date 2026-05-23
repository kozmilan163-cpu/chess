import React from 'react';
import { TrendingUp, TrendingDown, Minus, Trophy, Frown, Handshake, BarChart3 } from 'lucide-react';
import { calculateEloChange, getRatingBracket, formatRatingDelta } from '../utils/elo';

interface GameOverEloProps {
  playerRating: number;
  opponentRating: number;
  result: 'win' | 'loss' | 'draw';
  onContinue: () => void;
}

export function GameOverElo({ playerRating, opponentRating, result, onContinue }: GameOverEloProps) {
  const ratingData = calculateEloChange(playerRating, opponentRating, result);
  const bracket = getRatingBracket(ratingData.newRating);

  const resultDisplay = {
    win: { icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Victory!' },
    loss: { icon: Frown, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Defeat' },
    draw: { icon: Handshake, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Draw' },
  }[result];

  const ResultIcon = resultDisplay.icon;
  const ratingTrendIcon = ratingData.ratingChange > 0 ? TrendingUp : ratingData.ratingChange < 0 ? TrendingDown : Minus;
  const RatingTrendIcon = ratingTrendIcon;

  return (
    <div className={`${resultDisplay.bg} rounded-2xl p-8 text-center space-y-6 border-2 ${resultDisplay.color}`}>
      {/* Result */}
      <div className="space-y-2">
        <ResultIcon size={48} className={`mx-auto ${resultDisplay.color}`} />
        <h2 className="text-3xl font-extrabold text-slate-900">{resultDisplay.label}</h2>
      </div>

      {/* Opponent info */}
      <div className="text-sm text-slate-600">
        Opponent Rating: <span className="font-bold text-slate-900">{opponentRating}</span>
      </div>

      {/* Rating change */}
      <div className="bg-white rounded-xl p-4 space-y-3 border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Current Rating</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-blue-600">{playerRating}</span>
            <RatingTrendIcon size={24} className={ratingData.ratingChange > 0 ? 'text-emerald-600' : ratingData.ratingChange < 0 ? 'text-rose-600' : 'text-slate-400'} />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <div className="text-sm text-slate-600 mb-2">New Rating</div>
          <div className="text-3xl font-extrabold text-slate-900">
            {ratingData.newRating}
            <span className={`ml-3 text-lg font-bold ${ratingData.ratingChange > 0 ? 'text-emerald-600' : ratingData.ratingChange < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              ({formatRatingDelta(ratingData.ratingChange)})
            </span>
          </div>
        </div>
      </div>

      {/* Rank bracket */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="text-sm text-slate-600 mb-2">Current Bracket</div>
        <div className="text-xl font-bold text-slate-900">{bracket}</div>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95"
      >
        Back to Main Menu
      </button>
    </div>
  );
}
