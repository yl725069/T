import { BOARD_HEIGHT, BOARD_WIDTH } from './constants';
import { BoardShape, CellValue, Player } from './types';

// Create an empty board
export const createStage = (): BoardShape =>
  Array.from(Array(BOARD_HEIGHT), () =>
    new Array(BOARD_WIDTH).fill({ type: 0, color: '0, 0, 0', locked: false })
  );

export const checkCollision = (
  player: Player,
  stage: BoardShape,
  { x: moveX, y: moveY }: { x: number; y: number }
): boolean => {
  for (let y = 0; y < player.tetromino.length; y += 1) {
    for (let x = 0; x < player.tetromino[y].length; x += 1) {
      // 1. Check that we're on an actual Tetromino cell
      if (player.tetromino[y][x] !== 0) {
        if (
          // 2. Check that our move is inside the game areas height (y)
          // We shouldn't go through the bottom of the play area
          !stage[y + player.pos.y + moveY] ||
          // 3. Check that our move is inside the game areas width (x)
          !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
          // 4. Check that the cell we're moving to isn't set to clear
          stage[y + player.pos.y + moveY][x + player.pos.x + moveX].locked
        ) {
          return true;
        }
      }
    }
  }
  return false;
};