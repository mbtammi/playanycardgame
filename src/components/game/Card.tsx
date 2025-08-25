import React from 'react';
import './Card.css';

export interface CardProps {
  suit: string;
  rank: string;
  faceDown?: boolean;
  onClick?: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
}

const suitSymbols: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const Card: React.FC<CardProps> = ({ suit, rank, faceDown, onClick, selected, style }) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const cardClasses = `card ${selected ? 'selected' : ''} ${faceDown ? 'face-down' : ''}`;
  const colorClass = isRed ? 'card-red' : 'card-black';

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      aria-label={faceDown ? 'Card face down' : `${rank} of ${suit}`}
      style={style}
    >
      {faceDown ? (
        <span className="card-face-down-content">🂠</span>
      ) : (
        <>
          <div className={`card-corners ${colorClass}`}>
            <span className="card-corner">{rank}</span>
            <span className="card-corner">{rank}</span>
          </div>
          <div className="card-center">
            <span className={`card-suit ${colorClass}`}>
              {suitSymbols[suit]}
            </span>
          </div>
          <div className={`card-bottom-corner ${colorClass}`}>
            <span className="card-corner">{rank}</span>
            <span className="card-corner">{rank}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default Card;
