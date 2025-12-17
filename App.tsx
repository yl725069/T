import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createStage, checkCollision } from './utils';
import Cell from './components/Cell';
import Display from './components/Display';
import Controls from './components/Controls';
import { useInterval } from './hooks/useInterval';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  RANDOM_TETROMINO,
  LEVEL_DURATION,
  TETROMINOS,
} from './constants';
import { BoardShape, Player, GameStatus, TetrominoType, CellValue } from './types';

const App: React.FC = () => {
  const [stage, setStage] = useState<BoardShape>(createStage());
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);

  // Stats
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(LEVEL_DURATION);

  const [player, setPlayer] = useState<Player>({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOS[0].shape,
    collided: false,
    type: 0 as unknown as TetrominoType,
    color: '0,0,0',
  });

  const [nextPiece, setNextPiece] = useState(RANDOM_TETROMINO());

  // Refs for access inside closures if needed, though state is mostly handled via functional updates
  const stageRef = useRef(stage);
  const playerRef = useRef(player);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  const startGame = () => {
    // Reset everything
    setStage(createStage());
    setDropTime(1000);
    resetPlayer();
    setScore(0);
    setLevel(1);
    setRows(0);
    setTimeLeft(LEVEL_DURATION);
    setGameOver(false);
    setStatus(GameStatus.PLAYING);
  };

  const startNextLevel = () => {
    setStage(createStage()); // Clear board for next level
    // Increase speed: 1000ms -> 800ms -> 600ms etc.
    const newSpeed = Math.max(100, 1000 - (level * 100));
    setDropTime(newSpeed);
    resetPlayer();
    setTimeLeft(LEVEL_DURATION);
    setLevel((prev) => prev + 1);
    setStatus(GameStatus.PLAYING);
  };

  const resetPlayer = () => {
    // Current piece becomes the next piece
    const newPiece = nextPiece;
    // Generate a new next piece
    setNextPiece(RANDOM_TETROMINO());

    setPlayer({
      pos: { x: BOARD_WIDTH / 2 - 2, y: 0 },
      tetromino: newPiece.tetromino.shape,
      collided: false,
      type: newPiece.type,
      color: newPiece.tetromino.color,
    });
  };

  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    setPlayer((prev) => ({
      ...prev,
      pos: { x: (prev.pos.x += x), y: (prev.pos.y += y) },
      collided,
    }));
  };

  const rotate = (matrix: any[][], dir: number) => {
    // Transpose
    const rotated = matrix.map((_, index) => matrix.map((col) => col[index]));
    // Reverse each row to get a rotated matrix
    if (dir > 0) return rotated.map((row) => row.reverse());
    return rotated.reverse();
  };

  const playerRotate = (stage: BoardShape, dir: number) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    // Wall kick basic implementation
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -dir);
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    setPlayer(clonedPlayer);
  };

  const sweepRows = (newStage: BoardShape) => {
    let sweptRows = 0;
    const sweptStage = newStage.reduce((ack, row) => {
      if (row.findIndex((cell) => cell.type === 0) === -1) {
        setRows((prev) => prev + 1);
        sweptRows++;
        // Add new empty row at top
        ack.unshift(new Array(BOARD_WIDTH).fill({ type: 0, color: '0, 0, 0', locked: false } as CellValue));
        return ack;
      }
      ack.push(row);
      return ack;
    }, [] as BoardShape);
    
    if (sweptRows > 0) {
      // Classic Tetris scoring
      const linePoints = [40, 100, 300, 1200];
      setScore((prev) => prev + linePoints[sweptRows - 1] * level);
    }
    
    return sweptStage;
  };

  const drop = () => {
    // Increase drop speed slightly when pressing down
    if (rows > (level + 1) * 10) {
      setLevel((prev) => prev + 1);
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      // Game Over
      if (player.pos.y < 1) {
        setGameOver(true);
        setStatus(GameStatus.GAME_OVER);
        setDropTime(null);
      }
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };

  const keyUp = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver && status === GameStatus.PLAYING) {
      if (keyCode === 40) {
        // Restore speed after soft drop
        const baseSpeed = Math.max(100, 1000 - (level * 100)); // Simplified logic matching startNextLevel
        setDropTime(baseSpeed);
      }
    }
  };

  const dropPlayer = () => {
    setDropTime(null); // Stop interval while manual dropping
    drop();
  };

  const move = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver && status === GameStatus.PLAYING) {
      if (keyCode === 37) { // Left
        movePlayer(-1);
      } else if (keyCode === 39) { // Right
        movePlayer(1);
      } else if (keyCode === 40) { // Down
        dropPlayer();
      } else if (keyCode === 38) { // Up
        playerRotate(stage, 1);
      }
    }
  };

  // Game Loop
  useInterval(() => {
    drop();
  }, dropTime);

  // Survival Timer
  useInterval(() => {
    if (status === GameStatus.PLAYING) {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Level Passed!
          setStatus(GameStatus.LEVEL_COMPLETE);
          setDropTime(null);
          return 0;
        }
        return prev - 1;
      });
    }
  }, status === GameStatus.PLAYING ? 1000 : null);

  // Merge player with stage
  useEffect(() => {
    const updateStage = (prevStage: BoardShape) => {
      // Flush the stage from the previous render
      const newStage = prevStage.map((row) =>
        row.map((cell) => (cell.locked ? cell : { type: 0, color: '0, 0, 0', locked: false } as CellValue))
      );

      // Draw the player
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            if (
              newStage[y + player.pos.y] &&
              newStage[y + player.pos.y][x + player.pos.x]
            ) {
              newStage[y + player.pos.y][x + player.pos.x] = {
                type: value,
                color: player.color,
                locked: false, // Player piece is not locked yet
              };
            }
          }
        });
      });

      // Check if collided
      if (player.collided) {
        resetPlayer();
        const sweptStage = sweepRows(newStage.map((row) =>
          row.map((cell) => {
            if (cell.color === player.color && !cell.locked && cell.type !== 0) {
                 return { ...cell, locked: true };
            }
            return cell;
          })
        ));
        return sweptStage;
      }

      return newStage;
    };

    setStage((prev) => updateStage(prev));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.collided, player.pos.x, player.pos.y, player.tetromino]); 

  // Focus wrapper
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if(wrapperRef.current) wrapperRef.current.focus();
  }, []);


  // Render Helpers
  const renderNextPiece = () => {
    const { tetromino, color } = nextPiece;
    return (
      <div className="grid grid-cols-4 gap-1 p-2 bg-black/30 rounded border border-white/10 w-24 h-24 place-content-center">
        {tetromino.shape.map((row, y) =>
          row.map((cell, x) => {
            if (cell !== 0) {
               return <div key={`${y}-${x}`} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgb(${color})`, boxShadow: `0 0 5px rgb(${color})` }} />;
            }
            return <div key={`${y}-${x}`} />; // Spacer
          })
        )}
      </div>
    );
  };

  return (
    <div
      className="w-full h-screen bg-slate-900 overflow-hidden flex flex-col lg:flex-row items-center justify-center outline-none"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => move(e)}
      onKeyUp={keyUp}
      ref={wrapperRef}
    >
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-green-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center max-w-5xl w-full p-4">
        
        {/* Left Panel: Stats */}
        <div className="hidden lg:flex flex-col gap-4 w-48">
             <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-digital mb-6 drop-shadow-sm">
                NEON<br/>TETRIS
             </h1>
             <Display label="Level" text={`${level}`} />
             <Display label="Score" text={`${score}`} />
             <Display label="Time" text={`${timeLeft}s`} isAlert={timeLeft <= 10} />
        </div>

        {/* Mobile Header (Top Bar) */}
        <div className="flex lg:hidden justify-between w-full max-w-sm mx-auto mb-2 bg-slate-800/50 p-2 rounded-xl backdrop-blur">
             <div className="flex flex-col items-center">
                 <span className="text-[10px] text-slate-400 uppercase">Level</span>
                 <span className="font-digital text-xl font-bold">{level}</span>
             </div>
             <div className="flex flex-col items-center">
                 <span className="text-[10px] text-slate-400 uppercase">Time</span>
                 <span className={`font-digital text-xl font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{timeLeft}</span>
             </div>
             <div className="flex flex-col items-center">
                 <span className="text-[10px] text-slate-400 uppercase">Score</span>
                 <span className="font-digital text-xl font-bold">{score}</span>
             </div>
        </div>

        {/* Game Board Container */}
        <div className="relative border-[10px] border-slate-800 rounded-lg bg-slate-900 shadow-2xl mx-auto">
            <div 
              className="grid grid-rows-[repeat(20,minmax(0,1fr))] grid-cols-[repeat(12,minmax(0,1fr))] bg-black/40 backdrop-blur-sm w-[280px] h-[466px] sm:w-[360px] sm:h-[600px]"
            >
              {stage.map((row) =>
                row.map((cell, x) => (
                  <Cell key={x} type={cell.type} color={cell.color} />
                ))
              )}
            </div>

            {/* Overlays */}
            {status === GameStatus.MENU && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center z-20 backdrop-blur-sm">
                <h2 className="text-3xl font-bold font-digital text-blue-400 mb-2">NEON TETRIS</h2>
                <p className="text-slate-300 mb-8 max-w-[200px]">Survive 60 seconds to reach the next level.</p>
                <button 
                  onClick={startGame}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded text-white font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                >
                  START GAME
                </button>
              </div>
            )}

            {status === GameStatus.GAME_OVER && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center z-20">
                <h2 className="text-4xl font-bold font-digital text-red-500 mb-4">GAME OVER</h2>
                <p className="text-xl text-white mb-2">Score: {score}</p>
                <p className="text-lg text-slate-400 mb-8">Level: {level}</p>
                <button 
                  onClick={startGame}
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold transition-colors border border-slate-500"
                >
                  TRY AGAIN
                </button>
              </div>
            )}

            {status === GameStatus.LEVEL_COMPLETE && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center z-20 backdrop-blur-sm">
                 <h2 className="text-3xl font-bold font-digital text-green-400 mb-2">LEVEL {level} CLEARED!</h2>
                 <p className="text-slate-300 mb-6">Speed increasing...</p>
                 <button 
                  onClick={startNextLevel}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded text-white font-bold transition-transform hover:scale-105 shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                >
                  NEXT LEVEL
                </button>
              </div>
            )}
        </div>

        {/* Right Panel: Next Piece & Controls (Desktop) */}
        <div className="hidden lg:flex flex-col gap-6 w-48">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
            <span className="text-slate-400 text-sm mb-2 uppercase tracking-widest">Next</span>
            {renderNextPiece()}
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-xl text-xs text-slate-400 space-y-2">
            <p className="flex justify-between"><span>Rotate</span> <kbd className="bg-slate-700 px-1 rounded text-white">↑</kbd></p>
            <p className="flex justify-between"><span>Move</span> <kbd className="bg-slate-700 px-1 rounded text-white">← →</kbd></p>
            <p className="flex justify-between"><span>Drop</span> <kbd className="bg-slate-700 px-1 rounded text-white">↓</kbd></p>
          </div>
        </div>

      </div>

       {/* Mobile Controls */}
      <div className="lg:hidden w-full max-w-sm px-4 pb-8 z-10">
         <Controls 
            onMoveLeft={() => move({ keyCode: 37 })}
            onMoveRight={() => move({ keyCode: 39 })}
            onRotate={() => playerRotate(stage, 1)}
            onDrop={dropPlayer}
         />
      </div>

    </div>
  );
};

export default App;