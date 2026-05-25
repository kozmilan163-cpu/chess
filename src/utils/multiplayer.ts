// Multiplayer room management — friend-to-friend game invites via room codes

export interface MultiplayerRoom {
  code: string;
  hostId: string;
  hostName: string;
  hostTime: number;
  hostIncrement: number;
  guestId: string | null;
  guestName: string | null;
  guestTime: number;
  guestIncrement: number;
  moves: string[];
  result: string | null;
  startedAt: number | null;
  createdAt: number;
  expiresAt: number;
}

const ROOMS_KEY = 'chess_multiplayer_rooms';
const ROOM_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createRoom(
  hostId: string,
  hostName: string,
  whiteTime: number,
  whiteIncrement: number,
  blackTime: number,
  blackIncrement: number
): MultiplayerRoom {
  const code = generateRoomCode();
  const now = Date.now();

  const room: MultiplayerRoom = {
    code,
    hostId,
    hostName,
    hostTime: whiteTime,
    hostIncrement: whiteIncrement,
    guestId: null,
    guestName: null,
    guestTime: blackTime,
    guestIncrement: blackIncrement,
    moves: [],
    result: null,
    startedAt: null,
    createdAt: now,
    expiresAt: now + ROOM_EXPIRY_MS,
  };

  const rooms = getAllRooms();
  rooms[code] = room;
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));

  return room;
}

export function getRoom(code: string): MultiplayerRoom | null {
  const rooms = getAllRooms();
  const room = rooms[code.toUpperCase()];

  if (!room) return null;

  // Check expiry
  if (Date.now() > room.expiresAt) {
    deleteRoom(code);
    return null;
  }

  return room;
}

export function getAllRooms(): Record<string, MultiplayerRoom> {
  const stored = localStorage.getItem(ROOMS_KEY);
  return stored ? JSON.parse(stored) : {};
}

export function joinRoom(code: string, guestId: string, guestName: string): MultiplayerRoom | null {
  const room = getRoom(code);
  if (!room) return null;
  if (room.guestId !== null) return null; // Already full

  room.guestId = guestId;
  room.guestName = guestName;
  room.startedAt = Date.now();

  const rooms = getAllRooms();
  rooms[code.toUpperCase()] = room;
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));

  return room;
}

export function addMoveToRoom(code: string, move: string): boolean {
  const room = getRoom(code);
  if (!room) return false;

  room.moves.push(move);
  const rooms = getAllRooms();
  rooms[code.toUpperCase()] = room;
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));

  return true;
}

export function setRoomResult(code: string, result: string): boolean {
  const room = getRoom(code);
  if (!room) return false;

  room.result = result;
  const rooms = getAllRooms();
  rooms[code.toUpperCase()] = room;
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));

  return true;
}

export function deleteRoom(code: string): void {
  const rooms = getAllRooms();
  delete rooms[code.toUpperCase()];
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function cleanupExpiredRooms(): void {
  const rooms = getAllRooms();
  const now = Date.now();
  let changed = false;

  for (const [code, room] of Object.entries(rooms)) {
    if (now > room.expiresAt) {
      delete rooms[code];
      changed = true;
    }
  }

  if (changed) {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  }
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}
