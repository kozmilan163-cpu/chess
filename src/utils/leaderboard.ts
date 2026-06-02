// Global leaderboard system with ranking and ELO tracking

export interface LeaderboardEntry {
  id: string;
  username: string;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  lastUpdated: Date;
  rank?: number;
  ratingDelta?: number;
}

export interface RankBadge {
  tier: string;
  label: string;
  icon: string;
  color: string;
  minRating: number;
}

const RANK_TIERS: RankBadge[] = [
  { tier: 'beginner', label: 'Beginner', icon: '♙', color: 'gray', minRating: 0 },
  { tier: 'novice', label: 'Novice', icon: '♘', color: 'blue', minRating: 1000 },
  { tier: 'intermediate', label: 'Intermediate', icon: '♗', color: 'purple', minRating: 1200 },
  { tier: 'advanced', label: 'Advanced', icon: '♖', color: 'cyan', minRating: 1400 },
  { tier: 'expert', label: 'Expert', icon: '♕', color: 'green', minRating: 1600 },
  { tier: 'master', label: 'Master', icon: '♔', color: 'yellow', minRating: 1800 },
  { tier: 'grandmaster', label: 'Grandmaster', icon: '👑', color: 'orange', minRating: 2000 },
  { tier: 'super_gm', label: 'Super Grandmaster', icon: '⭐', color: 'red', minRating: 2400 },
];

export function getRankBadge(rating: number): RankBadge {
  let badge = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (rating >= tier.minRating) {
      badge = tier;
    }
  }
  return badge;
}

export function buildGlobalLeaderboard(players: LeaderboardEntry[]): LeaderboardEntry[] {
  return players
    .sort((a, b) => b.rating - a.rating)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
}

export function getPlayerRank(players: LeaderboardEntry[], playerId: string): number {
  const sorted = buildGlobalLeaderboard(players);
  return sorted.findIndex(p => p.id === playerId) + 1;
}

export function calculateWinRate(entry: LeaderboardEntry): number {
  const totalGames = entry.games;
  if (totalGames === 0) return 0;
  return Math.round((entry.wins / totalGames) * 100 * 10) / 10;
}

export function formatRatingDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return '0';
}

export function isTopTen(rank: number): boolean {
  return rank <= 10;
}

export function isTopHundred(rank: number): boolean {
  return rank <= 100;
}

// Mock leaderboard data (will be replaced with real data from backend)
export function generateMockLeaderboard(): LeaderboardEntry[] {
  const names = [
    'MagnusBot', 'AlphaChess', 'NarrowMind', 'SilentKnight', 'LightningStrike',
    'BlitzKing', 'BlitzMaster', 'FastThinking', 'RapidGenius', 'CarefulPlayer',
    'ClassicMaster', 'DeepThinking', 'FlashMaster', 'RapidFox', 'KnightMover',
    'BishopSlayer', 'RookHunter', 'QueenDancer', 'KingSlayer', 'PawnPusher'
  ];

  return names.map((name, i) => ({
    id: `player_${i}`,
    username: name,
    rating: 2850 - i * 80,
    games: 200 + i * 50,
    wins: 120 + i * 30,
    losses: 70 - i * 5,
    draws: 10 + i * 2,
    winRate: 60 + Math.random() * 15,
    lastUpdated: new Date(),
    ratingDelta: Math.round((Math.random() - 0.5) * 100),
  }));
}
