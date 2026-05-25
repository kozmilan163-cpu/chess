import React, { useState, useMemo } from 'react';
import { Copy, Check, QrCode, X, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { createRoom, joinRoom, getRoom } from '../utils/multiplayer';
import { UserProfile } from './Profile';

export interface FriendInviteProps {
  profile: UserProfile | null;
  whiteTime: number;
  whiteIncrement: number;
  blackTime: number;
  blackIncrement: number;
  onGameStart: (roomId: string, isHost: boolean) => void;
  onCancel: () => void;
}

export function FriendInvite({
  profile,
  whiteTime,
  whiteIncrement,
  blackTime,
  blackIncrement,
  onGameStart,
  onCancel,
}: FriendInviteProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState<string>('');
  const [showQR, setShowQR] = useState(false);

  const currentUserId = useMemo(
    () => profile?.username || `Player_${Math.random().toString(36).substring(7)}`,
    [profile]
  );

  const handleCreateRoom = () => {
    const newRoom = createRoom(
      currentUserId,
      profile?.username || 'Player',
      whiteTime,
      whiteIncrement,
      blackTime,
      blackIncrement
    );
    setRoomCode(newRoom.code);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }

    const room = joinRoom(joinCode.toUpperCase(), currentUserId, profile?.username || 'Player');
    if (!room) {
      setJoinError('Room not found or already full');
      return;
    }

    onGameStart(room.code, false);
  };

  const shareUrl = useMemo(() => {
    if (!roomCode) return '';
    const params = new URLSearchParams({
      mode: 'joinFriend',
      code: roomCode,
    });
    return `${window.location.origin}?${params.toString()}`;
  }, [roomCode]);

  if (roomCode) {
    // Room created — show invitation
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={24} /> Game Created
            </h2>
            <button onClick={onCancel} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-center space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">Your room code:</p>
            <p className="text-4xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
              {roomCode}
            </p>
          </div>

          {showQR ? (
            <div className="bg-white dark:bg-slate-700 p-4 rounded-xl flex justify-center">
              <QRCodeSVG value={shareUrl} size={200} level="H" includeMargin={true} />
            </div>
          ) : null}

          <div className="space-y-2">
            <button
              onClick={handleCopyCode}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-semibold transition-colors"
            >
              <QrCode size={18} /> {showQR ? 'Hide' : 'Show'} QR Code
            </button>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            Share the code or QR code with your friend. They'll join as Black.
          </p>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Time Controls:</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <span className="font-semibold">White:</span> {whiteTime / 60}m + {whiteIncrement}s
              </div>
              <div>
                <span className="font-semibold">Black:</span> {blackTime / 60}m + {blackIncrement}s
              </div>
            </div>
          </div>

          <button
            onClick={() => onGameStart(roomCode, true)}
            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
          >
            ✅ Start Playing
          </button>
        </div>
      </div>
    );
  }

  // Room creation / joining UI
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Play with Friend</h2>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Mode selection */}
        <div className="flex gap-3">
          <button
            onClick={() => { setMode('create'); setJoinError(''); }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'create'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => { setMode('join'); setJoinError(''); }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'join'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Join Room
          </button>
        </div>

        {mode === 'create' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Create a new room and share the code with a friend. You'll play as White.
            </p>
            <button
              onClick={handleCreateRoom}
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
            >
              Create New Room
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Enter Friend's Room Code
              </label>
              <input
                type="text"
                placeholder="E.g., ABC123"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError('');
                }}
                maxLength={6}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {joinError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{joinError}</p>}
            </div>
            <button
              onClick={handleJoinRoom}
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
            >
              Join Room
            </button>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
