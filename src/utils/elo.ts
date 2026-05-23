// Elo rating calculation system

export interface RatingResult {
  newRating: number;
  ratingChange: number;
  text: string;
}

const K_FACTOR = 32; // Standard K-factor for chess

export function calculateEloChange(playerRating: number, opponentRating: number, result: 'win' | 'loss' | 'draw'): RatingResult {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

  let actualScore: number;
  switch (result) {
    case 'win':
      actualScore = 1;
      break;
    case 'loss':
      actualScore = 0;
      break;
    case 'draw':
      actualScore = 0.5;
      break;
  }

  const ratingChange = Math.round(K_FACTOR * (actualScore - expectedScore));
  const newRating = Math.max(100, playerRating + ratingChange);

  let text: string;
  if (ratingChange > 0) {
    text = `+${ratingChange} (${result.charAt(0).toUpperCase() + result.slice(1)})`;
  } else if (ratingChange < 0) {
    text = `${ratingChange} (${result.charAt(0).toUpperCase() + result.slice(1)})`;
  } else {
    text = `${ratingChange} (${result.charAt(0).toUpperCase() + result.slice(1)})`;
  }

  return { newRating, ratingChange, text };
}

export function getRatingBracket(rating: number): string {
  if (rating < 1000) return 'Beginner';
  if (rating < 1200) return 'Novice';
  if (rating < 1400) return 'Intermediate';
  if (rating < 1600) return 'Advanced';
  if (rating < 1800) return 'Expert';
  if (rating < 2000) return 'Master';
  if (rating < 2400) return 'Grandmaster';
  return 'Super Grandmaster';
}

export function getMatchmakingRange(playerRating: number): { min: number; max: number } {
  // ±200 rating points
  return {
    min: Math.max(100, playerRating - 200),
    max: playerRating + 200,
  };
}

// Format rating changes for display
export function formatRatingDelta(delta: number): string {
  if (delta === 0) return '±0';
  return delta > 0 ? `+${delta}` : `${delta}`;
}
