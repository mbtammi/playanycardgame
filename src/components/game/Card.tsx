import React from 'react';

export interface CardProps {
  suit: string;
  rank: string;
  faceDown?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

const suitSymbols: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const Card: React.FC<CardProps> = ({ suit, rank, faceDown, onClick, selected }) => {
  return (
    <div
      className={`game-card${selected ? ' selected' : ''} cursor-pointer select-none relative flex flex-col items-stretch justify-between text-lg font-bold border-2 transition-all duration-200${faceDown ? ' bg-gray-300 text-gray-400' : ''}`}
      style={{ width: 48, height: 68, minWidth: 48, minHeight: 68 }}
      onClick={onClick}
      aria-label={faceDown ? 'Card face down' : `${rank} of ${suit}`}
    >
      {faceDown ? (
        <span className="text-2xl flex-1 flex items-center justify-center">🂠</span>
      ) : (
        <>
          <div className="flex justify-between items-start w-full px-1 pt-1">
            <span
              className="text-xs"
              style={suit === 'hearts' || suit === 'diamonds' ? { color: '#ef4444' } : { color: '#222' }}
            >
              {rank}
            </span>
            <span
              className="text-xs"
              style={suit === 'hearts' || suit === 'diamonds' ? { color: '#ef4444' } : { color: '#222' }}
            >
              {rank}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span
              className="text-2xl"
              style={suit === 'hearts' || suit === 'diamonds' ? { color: '#ef4444' } : { color: '#222' }}
            >
              {suitSymbols[suit]}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default Card;
