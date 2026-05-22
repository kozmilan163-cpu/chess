import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = null; // Storing instance lazily instead
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" }
  });

  // State object to hold game rooms
  const rooms: Record<string, any> = {};
  
  // State for social and profiles
  const profiles: Record<string, { username: string; chessComUsername?: string; chessComRating?: number; localRating: number }> = {};
  const socialFeed: Array<{ id: string; pgn: string; author: string; comment: string; likes: number; timestamp: number; comments?: Array<{ id: string; author: string; text: string; timestamp: number }> }> = [];

  // Matchmaking Queue
  interface WaitingPlayer {
    socketId: string;
    timeParams: any;
  }
  let matchmakingQueue: WaitingPlayer[] = [];

  // API Endpoints
  
  app.post('/api/analyze-game', async (req, res) => {
    try {
      const { pgn } = req.body;
      if (!pgn) {
        return res.status(400).json({ error: 'PGN is required for analysis' });
      }
      
      const prompt = `You are an expert chess coach. Analyze this chess game provided in PGN format:\n\n${pgn}\n\nProvide a short, structured analysis including: \n1. Summary of the game phase\n2. Key turning point or blunder\n3. One piece of strategic advice for the players.`;
      
      const client = getGeminiClient();
      const result = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });
      
      res.json({ analysis: result.text });
    } catch (e) {
      console.error("AI Analysis error:", e);
      res.status(500).json({ error: 'Failed to analyze game' });
    }
  });

  app.post('/api/puzzles/generate', async (req, res) => {
    try {
      const { theme, difficulty } = req.body;
      const themeVal = theme || 'mate1';
      const diffVal = difficulty || 'beginner';

      const prompt = `You are a professional chess grandmaster and elite tactician. 
Generate a valid, fully legal, highly accurate chess puzzle with the following criteria:
- Theme category: ${themeVal}
- Target Rating Difficulty: ${diffVal}

Please construct a position containing a clear tactical resource or checkmate matching the requested criteria. 
Output exactly one high-quality, valid, and fully playable chess puzzle in JSON format.
Make sure that:
1. The FEN is a standard, fully legal, valid chess position (containing exactly one King per side, legal pawn placements, etc.).
2. The player to move in the FEN matches the 'orientation' parameter (e.g. if turn is 'w', orientation is white).
3. The 'solution' matches standard algebraic notation (SAN, e.g., ["Qxf7#"] or ["Nf7+", "Kg8", "Nxd6"]). The move sequence must represent force-moves or the clear best tactical solution.
4. If the theme is "mate1", the solution MUST consist of exactly one legal make-mate move.
5. If the theme is "mate2", the solution MUST consist of exactly three moves (attack, defense, mate, e.g. ["Qxh7+", "Kxh7", "Rh3#"]).

Output structure:
{
  "fen": "string",
  "solution": ["string"],
  "orientation": "white" | "black",
  "title": "string",
  "url": "#"
}`;

      const client = getGeminiClient();
      const result = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fen: { type: Type.STRING },
              solution: { type: Type.ARRAY, items: { type: Type.STRING } },
              orientation: { type: Type.STRING },
              title: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ['fen', 'solution', 'orientation', 'title', 'url']
          }
        }
      });

      if (result && result.text) {
        const puzzle = JSON.parse(result.text.trim());
        return res.json(puzzle);
      }
      throw new Error("Empty AI result");
    } catch (e) {
      console.error("AI Chess Puzzle generation error:", e);
      res.status(500).json({ error: 'AI generation failed' });
    }
  });

  app.get('/api/social/feed', (req, res) => {
    res.json(socialFeed);
  });

  app.post('/api/social/post', (req, res) => {
    const { pgn, fen, author, comment } = req.body;
    const newPost = {
      id: Math.random().toString(36).substring(7),
      pgn,
      fen,
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
      if (unlike) {
        post.likes = Math.max(0, post.likes - 1);
      } else {
        post.likes += 1;
      }
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

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_matchmaking", ({ timeParams }) => {
      // Find a suitable opponent or create a new room
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
        
        // Notify both players to join the created room
        io.to(opponent.socketId).emit("match_found", { roomId });
        socket.emit("match_found", { roomId });
        
      } else {
        // Add to queue
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

      // Assign role (Host is usually white if first)
      let role = 'spectator';
      
      if (!room.players.white && !room.players.black) {
        room.players.white = socket.id;
        role = 'w';
      } else if (room.players.white && !room.players.black) {
        if (room.players.white !== socket.id) {
          room.players.black = socket.id;
          role = 'b';
        } else {
          role = 'w';
        }
      } else if (!room.players.white && room.players.black) {
        if (room.players.black !== socket.id) {
          room.players.white = socket.id;
          role = 'w';
        } else {
          role = 'b';
        }
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
        if (!room.gameStarted) {
          room.gameStarted = true;
        }
        io.to(roomId).emit("game_started"); // Emit to catch any reconnect edge cases
      }

      socket.emit("room_joined", { 
        roomId, 
        role,
        roomState: room
      });

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
      if (room) {
        room.isGameOver = true;
        socket.to(roomId).emit("game_over", { message });
      }
    });
    
    socket.on("offer_draw", ({ roomId }) => {
      socket.to(roomId).emit("draw_offered");
    });
    
    socket.on("draw_accepted", ({ roomId }) => {
      const room = rooms[roomId];
      if (room) {
        room.isGameOver = true;
        io.to(roomId).emit("draw_accepted");
      }
    });

    socket.on("draw_declined", ({ roomId }) => {
      socket.to(roomId).emit("draw_declined");
    });

    socket.on("reset_game", ({ roomId }) => {
      const room = rooms[roomId];
      if (room) {
        room.fen = null;
        room.lastMovePositions = [];
        room.turn = 'w';
        room.isGameOver = false;
        
        // Reset times to initial params
        room.whiteTime = room.whiteTime || 600; // Need better tracking of initial params
        room.blackTime = room.blackTime || 600;
        
        io.to(roomId).emit("game_reset");
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
      // Clean up rooms (simplified)
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

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
