export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface ITetromino {
  shape: (TetrominoType | 0)[][];
  color: string;
}

export type CellValue = {
    type: TetrominoType | 0;
    color: string;
    locked: boolean;
};

export type BoardShape = CellValue[][];

export interface Player {
  pos: { x: number; y: number };
  tetromino: (TetrominoType | 0)[][];
  collided: boolean;
  type: TetrominoType;
  color: string;
}

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER',
}