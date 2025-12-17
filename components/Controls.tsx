import React from 'react';

interface ControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRotate: () => void;
  onDrop: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onMoveLeft, onMoveRight, onRotate, onDrop }) => {
  const btnClass = "bg-slate-700/80 active:bg-slate-600 active:scale-95 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl shadow-lg backdrop-blur-md select-none touch-manipulation transition-transform";

  return (
    <div className="flex flex-col gap-4 mt-4 select-none touch-none">
       {/* Top Row: Rotate and Drop */}
       <div className="flex justify-center gap-12">
        <button
          className={btnClass}
          onClick={(e) => { e.preventDefault(); onRotate(); }}
          aria-label="Rotate"
        >
          ↻
        </button>
        <button
          className={btnClass}
          onTouchStart={(e) => { e.preventDefault(); onDrop(); }} // Trigger on touch for faster response
          onClick={(e) => { e.preventDefault(); onDrop(); }}
          aria-label="Drop"
        >
          ↓
        </button>
      </div>

      {/* Bottom Row: Left and Right */}
      <div className="flex justify-between w-64 mx-auto">
        <button
          className={btnClass}
          onClick={(e) => { e.preventDefault(); onMoveLeft(); }}
          aria-label="Left"
        >
          ←
        </button>

        <button
          className={btnClass}
          onClick={(e) => { e.preventDefault(); onMoveRight(); }}
          aria-label="Right"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default Controls;