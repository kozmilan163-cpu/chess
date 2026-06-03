/**
 * Tournament Seeding & Management Utilities
 * Handles bracket generation, seeding algorithms, and round management
 */

export interface TournamentParticipant {
  id: string;
  name: string;
  rating: number;
  title: string;
}

export interface TournamentConfig {
  name: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  maxPlayers: number;
  minRating?: number;
  maxRating?: number;
  timeControl: string; // e.g., "3|0", "5|3", "10|0"
}

export interface Match {
  id: string;
  roundIndex: number;
  matchIndex: number;
  player1: TournamentParticipant | null;
  player2: TournamentParticipant | null;
  result?: 'draw' | 'player1' | 'player2' | 'pending';
  startedAt?: Date;
  completedAt?: Date;
}

export interface Tournament {
  id: string;
  config: TournamentConfig;
  participants: TournamentParticipant[];
  rounds: Match[][];
  currentRoundIndex: number;
  status: 'registration' | 'active' | 'completed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Swiss System Seeding
 * Pairs players based on current standings and strength
 */
export function seedSwissRound(
  participants: TournamentParticipant[],
  previousResults?: Match[]
): Match[] {
  const matches: Match[] = [];
  let processed = new Set<string>();
  
  // Sort by rating (descending) if first round
  const sorted = [...participants].sort((a, b) => b.rating - a.rating);
  
  const unpaired = sorted.filter(p => !processed.has(p.id));
  
  for (let i = 0; i < unpaired.length - 1; i += 2) {
    matches.push({
      id: `match_${Date.now()}_${i}`,
      roundIndex: 0,
      matchIndex: i / 2,
      player1: unpaired[i],
      player2: unpaired[i + 1],
      result: 'pending',
    });
    processed.add(unpaired[i].id);
    processed.add(unpaired[i + 1].id);
  }
  
  return matches;
}

/**
 * Single Elimination Bracket (Standard Knockout)
 * Pairs top seed vs lowest, 2nd vs 2nd-lowest, etc.
 */
export function seedSingleElimination(
  participants: TournamentParticipant[]
): Match[][] {
  // Validate power of 2
  const nearestPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participants.length)));
  
  if (participants.length === 0) return [];
  
  // Sort by rating (descending)
  const sorted = [...participants].sort((a, b) => b.rating - a.rating);
  
  // Pad with byes if needed
  const seeded: (TournamentParticipant | null)[] = [];
  for (let i = 0; i < nearestPowerOf2; i++) {
    if (i < sorted.length) {
      seeded.push(sorted[i]);
    } else {
      seeded.push(null); // Bye (auto-advance)
    }
  }
  
  // Seed top vs bottom: [1 vs n, 2 vs n-1, ...]
  const pairings: (TournamentParticipant | null)[] = [];
  const n = seeded.length;
  for (let i = 0; i < n / 2; i++) {
    pairings.push(seeded[i]);
    pairings.push(seeded[n - 1 - i]);
  }
  
  // Build bracket structure
  const rounds: Match[][] = [];
  let currentMatches: Match[] = [];
  
  // First round
  for (let i = 0; i < pairings.length; i += 2) {
    currentMatches.push({
      id: `match_${Date.now()}_${i}`,
      roundIndex: 0,
      matchIndex: i / 2,
      player1: pairings[i],
      player2: pairings[i + 1],
      result: 'pending',
    });
  }
  rounds.push(currentMatches);
  
  // Generate subsequent rounds
  while (currentMatches.length > 1) {
    const nextRound: Match[] = [];
    for (let i = 0; i < currentMatches.length; i += 2) {
      nextRound.push({
        id: `match_${Date.now()}_${i}`,
        roundIndex: rounds.length,
        matchIndex: i / 2,
        player1: null,
        player2: null,
        result: 'pending',
      });
    }
    rounds.push(nextRound);
    currentMatches = nextRound;
  }
  
  return rounds;
}

/**
 * Double Elimination Bracket
 * Winners bracket + losers bracket
 */
export function seedDoubleElimination(
  participants: TournamentParticipant[]
): { winnersRounds: Match[][]; losersRounds: Match[][] } {
  const winnersRounds = seedSingleElimination(participants);
  const losersRounds: Match[][] = [];
  
  // Losers bracket typically has half the matches per round
  // Simplified version: create losers bracket skeleton
  let losersSize = Math.max(2, Math.floor(participants.length / 2));
  let round = 0;
  
  while (losersSize >= 1) {
    const matches: Match[] = [];
    for (let i = 0; i < losersSize; i++) {
      matches.push({
        id: `losers_match_${Date.now()}_${i}`,
        roundIndex: round,
        matchIndex: i,
        player1: null,
        player2: null,
        result: 'pending',
      });
    }
    losersRounds.push(matches);
    losersSize = Math.max(1, Math.floor(losersSize / 2));
    round++;
  }
  
  return { winnersRounds, losersRounds };
}

/**
 * Create a new tournament
 */
export function createTournament(
  config: TournamentConfig,
  participants: TournamentParticipant[]
): Tournament {
  const rounds = seedSingleElimination(participants);
  
  return {
    id: `tournament_${Date.now()}`,
    config,
    participants,
    rounds,
    currentRoundIndex: 0,
    status: 'registration',
    createdAt: new Date(),
  };
}

/**
 * Advance winners to next round
 */
export function advanceMatch(
  tournament: Tournament,
  roundIndex: number,
  matchIndex: number,
  winner: 'player1' | 'player2'
): Tournament {
  const updated = { ...tournament };
  const match = updated.rounds[roundIndex]?.[matchIndex];
  
  if (!match) return updated;
  
  // Mark current match as complete
  match.result = winner === 'player1' ? 'player1' : 'player2';
  match.completedAt = new Date();
  
  // Auto-advance to next round
  const nextRound = updated.rounds[roundIndex + 1];
  if (nextRound && matchIndex < nextRound.length) {
    const nextMatch = nextRound[matchIndex];
    const winnerPlayer = winner === 'player1' ? match.player1 : match.player2;
    
    // Determine if this winner goes to top or bottom of next match
    if (matchIndex % 2 === 0) {
      nextMatch.player1 = winnerPlayer;
    } else {
      nextMatch.player2 = winnerPlayer;
    }
  }
  
  return updated;
}

/**
 * Get bracket statistics
 */
export function getTournamentStats(tournament: Tournament) {
  const totalMatches = tournament.rounds.reduce((sum, round) => sum + round.length, 0);
  const completedMatches = tournament.rounds.reduce((sum, round) => 
    sum + round.filter(m => m.result && m.result !== 'pending').length, 0
  );
  const completionPercent = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  
  return {
    totalMatches,
    completedMatches,
    completionPercent,
    totalRounds: tournament.rounds.length,
    currentRound: tournament.currentRoundIndex + 1,
  };
}
