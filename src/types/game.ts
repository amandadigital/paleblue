export type GameMode = 'daily' | 'free' | 'duel';

export interface SpaceObject {
  id: string;
  nasaId: string;
  name: string;
  aliases: string[];
  category: 'nebula' | 'galaxy' | 'planet & moon' | 'solar system' | 'deep space' | 'historic mission';
  missionOrTelescope: string;
  distance: string;
  coordinates: string;
  constellationOrTarget: string;
  dateCaptured: string;
  imageUrl: string;
  fallbackImageUrl?: string;
  story: string;
  hints: [string, string, string];
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar: string; // url, base64 data url, or preset identifier
  points: number;
  dailyLastPlayed?: string; // YYYY-MM-DD
  dailyHistory?: Record<string, number>;
  gamesPlayed: number;
  correctGuesses: number;
  duelsWon: number;
  duelsLost: number;
  duelsPlayed: number;
  isVerified?: boolean;
  seenPhotoIds?: string[];
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  points: number;
  gamesPlayed: number;
  accuracy: number;
  duelsWon?: number;
  updatedAt: string;
  isVerified?: boolean;
}

export interface BotPlayer {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  minDelaySec: number;
  maxDelaySec: number;
  accuracy: number;
  dialogueSuccess: string[];
  dialogueFail: string[];
}
