export interface Tile {
  id: number;
  type: number;
  x: number;
  y: number;
  isSelected: boolean;
  isMatched: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Path {
  start: Position;
  end: Position;
  corners: Position[];
}

export interface Level {
  id: number;
  width: number;
  height: number;
  timeLimit: number;
  baseScore: number;
  tileTypes: number;
  name: string;
}

export interface GameState {
  currentLevel: number;
  score: number;
  highScores: Record<number, number>;
  timeLeft: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export interface User {
  username: string;
  password: string;
  maxLevel: number;
  highScores: Record<number, number>;
}

export interface UserState {
  currentUser: User | null;
  isLoggedIn: boolean;
} 