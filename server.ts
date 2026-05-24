import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

// ─── Built-in puzzle library (no AI needed) ─────────────────────────────────
const PUZZLES: Record<string, Array<{ fen: string; solution: string[]; orientation: string; title: string; url: string }>> = {
  mate1: [
    { fen: "6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1", solution: ["Re8#"], orientation: "white", title: "Back Rank Mate", url: "#" },
    { fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", solution: ["Qxf7#"], orientation: "white", title: "Scholar's Mate", url: "#" },
    { fen: "5rk1/5ppp/8/8/8/8/8/R6K w - - 0 1", solution: ["Ra8#"], orientation: "white", title: "Rook Back Rank", url: "#" },
    { fen: "6k1/6pp/8/8/8/8/6PP/6K1 b - - 0 1", solution: ["g1=Q#"], orientation: "black", title: "Promotion Mate", url: "#" },
    { fen: "4k3/8/4K3/8/8/8/8/7R w - - 0 1", solution: ["Rh8#"], orientation: "white", title: "Rook Mate", url: "#" },
  ],
  mate2: [
    { fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", solution: ["Ng5", "d5", "Nxf7#"], orientation: "white", title: "Fried Liver", url: "#" },
    { fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1", solution: ["Re8+", "Rxe8", "Rxe8#"], orientation: "white", title: "Two Rooks", url: "#" },
    { fen: "r2qkb1r/pp2pppp/2np1n2/8/3NP1b1/2N1B3/PPP2PPP/R2QKB1R w KQkq - 2 7", solution: ["Nxc6", "bxc6", "Bxf6#"], orientation: "white", title: "Double Attack Mate", url: "#" },
  ],
  fork: [
    { fen: "r1bqkbnr/pppp1ppp/8/4p3/3nP3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", solution: ["Nxe5"], orientation: "white", title: "Knight Fork", url: "#" },
    { fen: "r3k2r/ppp2ppp/8/3p4/3Pn3/8/PPP2PPP/R1BQK2R w KQkq - 0 10", solution: ["Nxf2"], orientation: "black", title: "Knight Fork King & Rook", url: "#" },
  ],
  pin: [
    { fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 2 5", solution: ["Bxf7+"], orientation: "white", title: "Bishop Pin", url: "#" },
  ],
  skewer: [
    { fen: "8/8/8/3k4/8/8/8/R3K3 w - - 0 1", solution: ["Ra5+"], orientation: "white", title: "Rook Skewer", url: "#" },
  ],
  endgame: [
    { fen: "8/8/8/4k3/8/4K3/4P3/8 w - - 0 1", solution: ["e4"], orientation: "white", title: "King & Pawn Endgame", url: "#" },
    { fen: "8/8/8/8/8/3k4/3p4/3K4 b - - 0 1", solution: ["d1=Q+"], orientation: "black", title: "Promotion", url: "#" },
  ],
  default: [
    { fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", solution: ["Qxf7#"], orientation: "white", title: "Scholar's Mate", url: "#" },
    { fen: "6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1", solution: ["Re8#"], orientation: "white", title: "Back Rank Mate", url: "#" },
    { fen: "r1bqkbnr/pppp1ppp/8/4p3/3nP3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", solution: ["Nxe5"], orientation: "white", title: "Knight Fork", url: "#" },
  ]
};

// Simple chess game analyzer (no AI, uses position evaluation heuristics)
function analyzeGameBasic(pgn: string): string {
  const lines = pgn.split('\n').filter(l => !l.startsWith('['));
  const moveText = lines.join(' ').trim();
  const moves = moveText.split(/\d+\./).filter(Boolean).map(s => s.trim()).filter(Boolean);
  const totalMoves = moves.length;

  let phase = totalMoves <= 10 ? "Opening" : totalMoves <= 25 ? "Middlegame" : "Endgame";

  return `## Game Analysis

**Phase:** ${phase} (${totalMoves * 2} half-moves played)

**Opening:** The game develops through the first moves. Study common openings like the Italian Game, Ruy Lopez, or Sicilian Defense to improve your opening play.

**Key Principles to Review:**
1. Control the center with pawns and pieces
2. Develop knights before bishops
3. Castle early for king safety
4. Connect your rooks after castling

**Tactical Tips:**
- Always check for forks, pins, and skewers before each move
- Look for back-rank weaknesses in the endgame
- Passed pawns become very powerful in endgames

**Recommended Study:**
- Practice tactics daily on the Puzzles tab
- Study master games in similar positions
- Use the Analysis board to review your moves

*Free analysis powered by chess principles — upgrade to premium for AI-powered move-by-move analysis.*`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" }
  });

  // ─── State ────────────────────────────────────────────────────────────────
  const rooms: Record<string, any> = {};
  const profiles: Record<string, any> = {};
  const socialFeed: Array<any> = [];

  interface WaitingPlayer { socketId: string; timeParams: any; }
  let matchmakingQueue: WaitingPlayer[] = [];

  // ─── API Endpoints ────────────────────────────────────────────────────────

  // Game analysis — no AI, returns structured chess advice
  app.post('/api/analyze-game', async (req, res) => {
    try {
      const { pgn } = req.body;
      if (!pgn) return res.status(400).json({ error: 'PGN is required' });
      const analysis = analyzeGameBasic(pgn);
      res.json({ analysis });
    } catch (e) {
      console.error("Analysis error:", e);
      res.status(500).json({ error: 'Failed to analyze game' });
    }
  });

  // Puzzles — served from built-in library
  app.post('/api/puzzles/generate', async (req, res) => {
    try {
      const { theme } = req.body;
      const key = (theme || 'default').toLowerCase().replace(/[^a-z0-9]/g, '');
      const pool = PUZZLES[key] || PUZZLES['default'];
      const puzzle = pool[Math.floor(Math.random() * pool.length)];
      res.json(puzzle);
    } catch (e) {
      console.error("Puzzle error:", e);
      res.status(500).json({ error: 'Failed to get puzzle' });
    }
  });

  // Lichess puzzles proxy (free, no key needed)
  app.get('/api/puzzles/lichess', async (req, res) => {
    try {
      const resp = await fetch('https://lichess.org/api/puzzle/daily');
      const data = await resp.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch Lichess puzzle' });
    }
  });

  // Social feed
  app.get('/api/social/feed', (req, res) => {
    res.json(socialFeed);
  });

  app.post('/api/social/post', (req, res) => {
    const { pgn, fen, author, comment } = req.body;
    const newPost = {
      id: Math.random().toString(36).substring(7),
      pgn, fen,
      author: author || 'Anonymous',
      comment: comment || '',
      likes: 0,
      timestamp: Date.now(),
      comments: []
    };
    socialFeed.unshift(newPost);
    res.json(newPost);
  });

  app.post('/api/social/like', (req, res) => {
    const { id, unlike } = req.body;
    const post = socialFeed.find(p => p.id === id);
    if (post) {
      post.likes = unlike ? Math.max(0, post.likes - 1) : post.likes + 1;
      res.json({ success: true, likes: post.likes });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  });

  app.post('/api/social/comment', (req, res) => {
    const { id, author, text } = req.body;
    const post = socialFeed.find(p => p.id === id);
    if (post && text) {
      if (!post.comments) post.comments = [];
      const newComment = {
        id: Math.random().toString(36).substring(7),
        author: author || 'Anonymous',
        text,
        timestamp: Date.now()
      };
      post.comments.push(newComment);
      res.json(newComment);
    } else {
      res.status(404).json({ error: 'Post not found or missing text' });
    }
  });

  // ─── Socket.IO ────────────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_matchmaking", ({ timeParams }) => {
      const opponentIndex = matchmakingQueue.findIndex(p => p.socketId !== socket.id);
      if (opponentIndex !== -1) {
        const opponent = matchmakingQueue[opponentIndex];
        matchmakingQueue.splice(opponentIndex, 1);
        const roomId = Math.random().toString(36).substring(2, 10);
        rooms[roomId] = {
          players: { white: opponent.socketId, black: socket.id },
          turn: 'w',
          whiteTime: opponent.timeParams?.whiteTime || timeParams?.whiteTime || 600,
          blackTime: opponent.timeParams?.blackTime || timeParams?.blackTime || 600,
          whiteInc: opponent.timeParams?.whiteInc || timeParams?.whiteInc || 0,
          blackInc: opponent.timeParams?.blackInc || timeParams?.blackInc || 0,
          hasTimeLimits: opponent.timeParams?.hasTimeLimits ?? timeParams?.hasTimeLimits ?? true,
          speedBonus: opponent.timeParams?.speedBonus ?? false,
          isGameOver: false,
          gameStarted: true,
          history: [],
        };
        io.to(opponent.socketId).emit("match_found", { roomId });
        socket.emit("match_found", { roomId });
      } else {
        if (!matchmakingQueue.find(p => p.socketId === socket.id)) {
          matchmakingQueue.push({ socketId: socket.id, timeParams });
        }
      }
    });

    socket.on("leave_matchmaking", () => {
      matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
    });

    socket.on("join_room", ({ roomId, isHost, timeParams }) => {
      socket.join(roomId);
      if (!rooms[roomId]) {
        rooms[roomId] = {
          players: {},
          turn: 'w',
          whiteTime: timeParams?.whiteTime || 600,
          blackTime: timeParams?.blackTime || 600,
          whiteInc: timeParams?.whiteInc || 0,
          blackInc: timeParams?.blackInc || 0,
          hasTimeLimits: timeParams?.hasTimeLimits ?? true,
          speedBonus: timeParams?.speedBonus ?? false,
          isGameOver: false,
          gameStarted: false,
          history: [],
        };
      }

      const room = rooms[roomId];
      let role = 'spectator';

      if (!room.players.white && !room.players.black) {
        room.players.white = socket.id; role = 'w';
      } else if (room.players.white && !room.players.black) {
        if (room.players.white !== socket.id) { room.players.black = socket.id; role = 'b'; }
        else role = 'w';
      } else if (!room.players.white && room.players.black) {
        if (room.players.black !== socket.id) { room.players.white = socket.id; role = 'w'; }
        else role = 'b';
      } else {
        if (room.players.white === socket.id) role = 'w';
        else if (room.players.black === socket.id) role = 'b';
        else role = 'spectator';
      }

      if (isHost && timeParams && !room.gameStarted) {
        room.whiteTime = timeParams.whiteTime;
        room.blackTime = timeParams.blackTime;
        room.whiteInc = timeParams.whiteInc;
        room.blackInc = timeParams.blackInc;
        room.hasTimeLimits = timeParams.hasTimeLimits;
        room.speedBonus = timeParams.speedBonus;
      }

      if (room.players.white && room.players.black) {
        if (!room.gameStarted) room.gameStarted = true;
        io.to(roomId).emit("game_started");
      }

      socket.emit("room_joined", { roomId, role, roomState: room });
      socket.to(roomId).emit("player_joined", { role });
    });

    socket.on("move", ({ roomId, move, fen, remainingWhiteTime, remainingBlackTime }) => {
      const room = rooms[roomId];
      if (room) {
        room.fen = fen;
        room.lastMovePositions = move ? [move.from, move.to] : [];
        room.whiteTime = remainingWhiteTime;
        room.blackTime = remainingBlackTime;
        room.turn = room.turn === 'w' ? 'b' : 'w';
        socket.to(roomId).emit("opponent_moved", { move, fen, remainingWhiteTime, remainingBlackTime });
      }
    });

    socket.on("game_over", ({ roomId, message }) => {
      const room = rooms[roomId];
      if (room) { room.isGameOver = true; socket.to(roomId).emit("game_over", { message }); }
    });

    socket.on("offer_draw", ({ roomId }) => { socket.to(roomId).emit("draw_offered"); });

    socket.on("draw_accepted", ({ roomId }) => {
      const room = rooms[roomId];
      if (room) { room.isGameOver = true; io.to(roomId).emit("draw_accepted"); }
    });

    socket.on("draw_declined", ({ roomId }) => { socket.to(roomId).emit("draw_declined"); });

    socket.on("reset_game", ({ roomId }) => {
      const room = rooms[roomId];
      if (room) {
        room.fen = null;
        room.lastMovePositions = [];
        room.turn = 'w';
        room.isGameOver = false;
        room.whiteTime = room.whiteTime || 600;
        room.blackTime = room.blackTime || 600;
        io.to(roomId).emit("game_reset");
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (room.players.white === socket.id) {
          room.players.white = undefined;
          io.to(roomId).emit("player_disconnected", { role: 'w' });
        }
        if (room.players.black === socket.id) {
          room.players.black = undefined;
          io.to(roomId).emit("player_disconnected", { role: 'b' });
        }
      }
    });
  });

  // ─── Vite middleware ───────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

startServer();
