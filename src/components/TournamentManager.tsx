import React from 'react';
import { TournamentArena } from './TournamentArena';
import { UserProfile } from './Profile';

interface TournamentManagerProps {
  tournamentId: string;
  tournament: {
    id: string;
    name: string;
    format: string;
    maxPlayers: number;
    minRating: number;
    maxRating: number;
    isPrivate: boolean;
    host: string;
  };
  profile: UserProfile | null;
  onLeave: () => void;
}

export function TournamentManager({ tournamentId, tournament, profile, onLeave }: TournamentManagerProps) {
  return (
    <TournamentArena
      tournamentId={tournamentId}
      tournaments={[tournament]}
      profile={profile}
      onUpdateProfile={() => {}}
      onLeave={onLeave}
    />
  );
}
