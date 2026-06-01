// Multiplayer game room management with Firebase Realtime DB or localStorage fallback
import { useLocalStorageFallback } from './firebase';

export interface GameRoom {
  id: string;
  roomCode: string;
  creator: string;
  opponent: string | null;
  createdAt: number;
  status: 'waiting' | 'active' | 'finished';
  fen: string;
  whiteTimer: number;
  blackTimer: number;
  lastMoveTime: number;
  winner: string | null;
}

export interface RoomState {
  currentFen: string;
  whiteTime: number;
  blackTime: number;
  lastMoveBy: 'white' | 'black';
  lastMoveTime: number;
  isCheck: boolean;
  gameOver: boolean;
  result: 'white' | 'black' | 'draw' | null;
}

// Generate a simple 4-char room code
export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

class MultiplayerManager {
  private rooms: Map<string, GameRoom> = new Map();
  private listeners: Map<string, Set<(room: GameRoom) => void>> = new Map();
  private useLocalStorage: boolean = useLocalStorageFallback;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (this.useLocalStorage) {
      const stored = localStorage.getItem('chess_rooms');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.rooms = new Map(Object.entries(parsed));
        } catch (e) {
          console.error('Failed to load rooms from storage', e);
        }
      }
    }
  }

  private saveToStorage() {
    if (this.useLocalStorage) {
      const data = Object.fromEntries(this.rooms);
      localStorage.setItem('chess_rooms', JSON.stringify(data));
    }
  }

  private notifyListeners(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (room) {
      this.listeners.get(roomCode)?.forEach(cb => cb(room));
    }
  }

  // Create a new multiplayer room
  createRoom(playerName: string): GameRoom {
    const roomCode = generateRoomCode();
    const room: GameRoom = {
      id: Date.now().toString(),
      roomCode,
      creator: playerName,
      opponent: null,
      createdAt: Date.now(),
      status: 'waiting',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      whiteTimer: 600, // 10 min in seconds
      blackTimer: 600,
      lastMoveTime: Date.now(),
      winner: null,
    };

    this.rooms.set(roomCode, room);
    this.listeners.set(roomCode, new Set());
    this.saveToStorage();
    return room;
  }

  // Join an existing room
  joinRoom(roomCode: string, playerName: string): GameRoom | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    if (room.opponent) return null; // Room full

    room.opponent = playerName;
    room.status = 'active';
    this.saveToStorage();
    this.notifyListeners(roomCode);
    return room;
  }

  // Update game state
  updateGameState(roomCode: string, updates: Partial<RoomState>) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    if (updates.currentFen) room.fen = updates.currentFen;
    if (updates.whiteTime !== undefined) room.whiteTimer = updates.whiteTime;
    if (updates.blackTime !== undefined) room.blackTimer = updates.blackTime;
    if (updates.lastMoveTime) room.lastMoveTime = updates.lastMoveTime;
    if (updates.result) {
      room.status = 'finished';
      room.winner = updates.result === 'draw' ? 'draw' : updates.result;
    }

    this.saveToStorage();
    this.notifyListeners(roomCode);
  }

  // Get room by code
  getRoom(roomCode: string): GameRoom | null {
    return this.rooms.get(roomCode) || null;
  }

  // List all active rooms
  getActiveRooms(): GameRoom[] {
    return Array.from(this.rooms.values()).filter(r => r.status !== 'finished');
  }

  // Subscribe to room updates
  subscribe(roomCode: string, callback: (room: GameRoom) => void): () => void {
    if (!this.listeners.has(roomCode)) {
      this.listeners.set(roomCode, new Set());
    }
    this.listeners.get(roomCode)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(roomCode)?.delete(callback);
    };
  }

  // Cleanup
  closeRoom(roomCode: string) {
    this.rooms.delete(roomCode);
    this.listeners.delete(roomCode);
    this.saveToStorage();
  }
}

export const multiplayer = new MultiplayerManager();
