// Game history and replay utilities

export interface SavedGame {
  id: string;
  pgn: string;
  whiteName: string;
  blackName: string;
  whiteRating: number;
  blackRating: number;
  result: '1-0' | '0-1' | '1/2-1/2';
  timestamp: number;
  timeControl: string;
  moves: number;
}

export function saveGame(
  pgn: string,
  whiteName: string,
  blackName: string,
  whiteRating: number,
  blackRating: number,
  result: '1-0' | '0-1' | '1/2-1/2',
  timeControl: string
): SavedGame {
  const game: SavedGame = {
    id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    pgn,
    whiteName,
    blackName,
    whiteRating,
    blackRating,
    result,
    timestamp: Date.now(),
    timeControl,
    moves: pgn.split(' ').filter(m => m && !m.match(/^[0-9]+\.$/)).length,
  };

  const games = getGameHistory();
  games.unshift(game);
  localStorage.setItem('chess_game_history', JSON.stringify(games.slice(0, 100))); // Keep last 100
  
  return game;
}

export function getGameHistory(): SavedGame[] {
  const saved = localStorage.getItem('chess_game_history');
  return saved ? JSON.parse(saved) : [];
}

export function getGameById(id: string): SavedGame | null {
  const games = getGameHistory();
  return games.find(g => g.id === id) || null;
}

export function deleteGame(id: string): void {
  const games = getGameHistory();
  const filtered = games.filter(g => g.id !== id);
  localStorage.setItem('chess_game_history', JSON.stringify(filtered));
}

export function getPlayerStats(playerName: string) {
  const games = getGameHistory();
  const playerGames = games.filter(g => g.whiteName === playerName || g.blackName === playerName);
  
  let wins = 0, losses = 0, draws = 0;
  let totalRating = 0;

  playerGames.forEach(g => {
    const isWhite = g.whiteName === playerName;
    if (g.result === '1/2-1/2') {
      draws++;
    } else if ((isWhite && g.result === '1-0') || (!isWhite && g.result === '0-1')) {
      wins++;
    } else {
      losses++;
    }
    totalRating += isWhite ? g.whiteRating : g.blackRating;
  });

  return {
    games: playerGames.length,
    wins,
    losses,
    draws,
    winRate: playerGames.length > 0 ? (wins / playerGames.length) * 100 : 0,
    avgRating: playerGames.length > 0 ? Math.round(totalRating / playerGames.length) : 0,
  };
}
