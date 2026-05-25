import React, { useState } from 'react';
import { Users, Share2, RotateCcw, UserPlus, MessageSquare, Trophy, X } from 'lucide-react';
import { UserProfile } from './Profile';

interface GameOverSocialProps {
  opponentProfile?: { username: string; rating: number; id: string };
  result: 'win' | 'loss' | 'draw';
  gamePgn: string;
  onRematch: () => void;
  onShareToFeed: (pgn: string, comment: string) => void;
  onAddFriend: (userId: string) => void;
  onBack: () => void;
  profile: UserProfile | null;
}

export function GameOverSocial({
  opponentProfile,
  result,
  gamePgn,
  onRematch,
  onShareToFeed,
  onAddFriend,
  onBack,
  profile,
}: GameOverSocialProps) {
  const [shareComment, setShareComment] = useState('');
  const [showShareForm, setShowShareForm] = useState(false);
  const [friendRequested, setFriendRequested] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const resultConfig = {
    win: { emoji: '🏆', title: 'Victory!', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
    loss: { emoji: '💪', title: 'Good Game', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800' },
    draw: { emoji: '🤝', title: 'Draw', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  };

  const config = resultConfig[result];

  const handleFriendRequest = () => {
    if (opponentProfile) {
      onAddFriend(opponentProfile.id);
      setFriendRequested(true);
    }
  };

  return (
    <div>
      {shareSuccess && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold animate-in fade-in slide-in-from-top">
          <span>✅</span> Game shared to feed!
        </div>
      )}
      <div className={`rounded-2xl border ${config.border} ${config.bg} p-6 space-y-4`}>
      {/* Result Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">{config.emoji}</div>
        <h3 className={`text-2xl font-bold ${config.color}`}>{config.title}</h3>
        {opponentProfile && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            vs {opponentProfile.username} ({opponentProfile.rating} Elo)
          </p>
        )}
      </div>

      {/* Opponent Actions */}
      {opponentProfile && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleFriendRequest}
            disabled={friendRequested}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              friendRequested
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
            }`}
          >
            <UserPlus size={16} />
            {friendRequested ? 'Request Sent' : 'Add Friend'}
          </button>
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw size={16} />
            Rematch
          </button>
        </div>
      )}

      {/* Share to Feed */}
      <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
        {!showShareForm ? (
          <button
            onClick={() => setShowShareForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Share2 size={16} />
            Share to Feed
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                <Share2 size={14} /> Share Game
              </h4>
              <button onClick={() => setShowShareForm(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <textarea
              value={shareComment}
              onChange={e => setShareComment(e.target.value)}
              placeholder="What made this game special? (optional)"
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { onShareToFeed(gamePgn, shareComment); setShowShareForm(false); setShareComment(''); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Share2 size={14} />
                Share
              </button>
              <button
                onClick={() => setShowShareForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Back */}
      <button
        onClick={onBack}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
      >
        Back to Menu
      </button>
      </div>
    </div>
  );
}

