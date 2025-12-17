import React from 'react';

interface DisplayProps {
  label: string;
  text: string;
  isAlert?: boolean;
}

const Display: React.FC<DisplayProps> = ({ label, text, isAlert }) => (
  <div className={`flex flex-col items-center bg-slate-800/80 rounded-lg p-2 w-24 sm:w-28 backdrop-blur-sm border border-slate-700 shadow-lg mb-2`}>
    <span className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">{label}</span>
    <span className={`font-digital text-lg sm:text-xl ${isAlert ? 'text-red-500 animate-pulse' : 'text-white'}`}>{text}</span>
  </div>
);

export default Display;