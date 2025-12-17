import React from 'react';
import { TetrominoType } from '../types';

interface CellProps {
  type: TetrominoType | 0;
  color: string;
}

const Cell: React.FC<CellProps> = ({ type, color }) => {
  return (
    <div
      className={`w-full h-full border-b border-r border-slate-900/20 box-border`}
      style={{
        background: type === 0 ? 'rgba(0,0,0,0.5)' : `rgba(${color}, 0.8)`,
        boxShadow: type === 0 ? 'none' : `inset 0px 0px 8px rgba(0,0,0,0.5), 0 0 10px rgba(${color}, 0.5)`,
        borderTop: type === 0 ? 'none' : `2px solid rgba(255,255,255,0.3)`,
        borderLeft: type === 0 ? 'none' : `2px solid rgba(255,255,255,0.3)`,
      }}
    />
  );
};

export default React.memo(Cell);