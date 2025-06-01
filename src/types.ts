import { GameMode } from './config/levels';

export interface Tile {
  id: number;
  type: number;
  x: number;
  y: number;
  isSelected: boolean;
  isMatched: boolean;
  isFrozen?: boolean;
  isMoving?: boolean;
  isFading?: boolean;
  rotation?: number;
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

export type BoardShape = boolean[][] | ((width: number, height: number) => boolean[][]);

export interface Level {
  id: number;
  name: string;
  width: number;
  height: number;
  timeLimit: number;
  baseScore: number;
  tileTypes: number;
  shape?: BoardShape;
  mode: GameMode;
  specialRules: SpecialRule[];
}

export interface GameState {
  currentLevel: number;
  score: number;
  highScores: { [key: number]: number };
  timeLeft: number;
  isGameOver: boolean;
  isPaused: boolean;
  boardRotation?: number;
}

export interface User {
  username: string;
  maxLevel: number;
  highScores: { [key: number]: number };
  achievements?: Achievement[];
  stats?: UserStats;
}

export interface UserState {
  currentUser: User | null;
  isLoggedIn: boolean;
}

export type SpecialRule = 
  | 'timerDecrease'  // 时间逐渐减少
  | 'movingTiles'    // 方块会移动
  | 'rotatingBoard'  // 游戏板会旋转
  | 'fadingTiles'    // 方块会渐隐
  | 'frozenTiles';   // 部分方块被冰冻

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number;
}

export interface UserStats {
  totalScore: number;
  gamesPlayed: number;
  totalPlayTime: number;
  perfectLevels: number;
  fastestLevel: {
    levelId: number;
    time: number;
  };
  highestCombo: number;
} 