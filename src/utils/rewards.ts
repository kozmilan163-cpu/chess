// Rewards system: calculate coin earnings per game result

export interface GameReward {
  coins: number;
  reason: string;
}

export function calculateReward(result: 'win' | 'loss' | 'draw', format: string): GameReward {
  const baseCoins = {
    bullet: 10,
    blitz: 15,
    rapid: 20,
    classic: 25,
  } as Record<string, number>;

  const coins = baseCoins[format.toLowerCase()] || 10;
  const multiplier = result === 'win' ? 2 : result === 'draw' ? 1 : 0.5;
  const earned = Math.floor(coins * multiplier);

  return {
    coins: earned,
    reason: `${result === 'win' ? 'Won' : result === 'draw' ? 'Drew' : 'Lost'} ${format} game`,
  };
}

export function getStreakBonus(winStreak: number): number {
  if (winStreak < 3) return 0;
  if (winStreak < 5) return 5;
  if (winStreak < 10) return 10;
  return 25;
}
