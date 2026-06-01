import React, { useState, useEffect } from 'react';
import { Copy, Play, LogOut } from 'lucide-react';
import { multiplayer, GameRoom } from '../utils/multiplayerRealtime';

export interface MultiplayerLobbyProps {
  playerName: string;
  onJoinGame: (room: GameRoom) => void;
  onBack: () => void;
}

export default function MultiplayerLobby({ playerName, onJoinGame, onBack }: MultiplayerLobbyProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);

  useEffect(() => {
    // Load active rooms
    const rooms = multiplayer.getActiveRooms();
    setActiveRooms(rooms.filter(r => r.status === 'waiting'));
  }, []);

  const handleCreateRoom = () => {
    const room = multiplayer.createRoom(playerName);
    setCurrentRoom(room);
    setMode('create');

    // Subscribe to updates
    multiplayer.subscribe(room.roomCode, (updatedRoom) => {
      if (updatedRoom.opponent) {
        // Someone joined!
        onJoinGame(updatedRoom);
      }
      setCurrentRoom(updatedRoom);
    });
  };

  const handleJoinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    const room = multiplayer.joinRoom(code, playerName);

    if (room) {
      setCurrentRoom(room);
      multiplayer.subscribe(room.roomCode, (updated) => setCurrentRoom(updated));
      setError('');
      onJoinGame(room);
    } else {
      setError('Room not found or already full');
    }
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleLeaveRoom = () => {
    if (currentRoom) {
      multiplayer.closeRoom(currentRoom.roomCode);
    }
    setCurrentRoom(null);
    setMode('menu');
    setError('');
  };

  // Menu
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6">
        <div className="max-w-md mx-auto mt-12">
          <h1 className="text-4xl font-bold mb-2 text-center">Multiplayer Chess</h1>
          <p className="text-slate-400 text-center mb-8">Play with friends in real-time</p>

          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
            >
              Create Room
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Join Room
            </button>

            {activeRooms.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Available Rooms</h3>
                <div className="space-y-2">
                  {activeRooms.map((room) => (
                    <div
                      key={room.roomCode}
                      className="bg-slate-800 p-3 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-sm">{room.roomCode}</p>
                        <p className="text-xs text-slate-400">By {room.creator}</p>
                      </div>
                      <button
                        onClick={() => {
                          setJoinCode(room.roomCode);
                          setMode('join');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-bold"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onBack}
              className="w-full text-slate-400 hover:text-slate-300 py-2"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create Room — waiting for opponent
  if (mode === 'create' && currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6">
        <div className="max-w-md mx-auto mt-12 text-center">
          <h2 className="text-2xl font-bold mb-6">Room Created</h2>

          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <p className="text-sm text-slate-400 mb-2">Room Code</p>
            <p className="text-5xl font-mono font-bold text-amber-400 mb-4">{currentRoom.roomCode}</p>
            <button
              onClick={() => copyRoomCode(currentRoom.roomCode)}
              className="flex items-center justify-center gap-2 mx-auto bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm"
            >
              <Copy size={16} /> Copy Code
            </button>
          </div>

          <div className="mb-6">
            <p className="text-slate-400 mb-4">Share this code with your friend to play</p>
            <div className="flex justify-center items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <p className="text-slate-400">You</p>
            </div>

            {currentRoom.opponent ? (
              <>
                <div className="my-4 text-slate-500">—</div>
                <div className="flex justify-center items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <p className="text-slate-400">{currentRoom.opponent}</p>
                </div>
                <button
                  onClick={() => onJoinGame(currentRoom)}
                  className="mt-6 w-full bg-green-600 hover:bg-green-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <Play size={18} /> Start Game
                </button>
              </>
            ) : (
              <p className="text-slate-400 mt-6 animate-pulse">Waiting for opponent...</p>
            )}
          </div>

          <button
            onClick={handleLeaveRoom}
            className="w-full text-red-400 hover:text-red-300 py-2 flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Leave Room
          </button>
        </div>
      </div>
    );
  }

  // Join Room
  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6">
        <div className="max-w-md mx-auto mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Join Room</h2>

          <input
            type="text"
            placeholder="Enter room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest mb-4 focus:outline-none focus:border-amber-500"
          />

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            onClick={handleJoinRoom}
            className="w-full bg-green-600 hover:bg-green-700 font-bold py-3 rounded-lg mb-3 transition"
          >
            Join Game
          </button>

          <button
            onClick={() => {
              setMode('menu');
              setError('');
              setJoinCode('');
            }}
            className="w-full text-slate-400 hover:text-slate-300 py-2"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
