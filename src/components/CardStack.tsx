import React from 'react';
import Card from './game/Card';
import type { Card as CardType } from '../types';
import './CardStack.css';

interface CardStackProps {
  cards: CardType[];
  stackType: 'clean' | 'messy';
  maxVisible?: number;
  onCardClick?: (cardId: string) => void;
  className?: string;
}

export const CardStack: React.FC<CardStackProps> = ({
  cards,
  stackType,
  maxVisible,
  onCardClick,
  className = ''
}) => {
  if (cards.length === 0) {
    return (
      <div className={`card-stack-empty ${className}`}>
        Empty
      </div>
    );
  }

  const visibleCards = maxVisible ? cards.slice(-maxVisible) : cards;

  if (stackType === 'clean') {
    // Calculate required dimensions for clean stack
    const cardWidth = 64;
    const cardHeight = 96;
    const stackWidth = cardWidth + (visibleCards.length - 1) * 8; // Reduced spacing
    const stackHeight = cardHeight + (visibleCards.length - 1) * 1; // Reduced height
    
    return (
      <div 
        className={`card-stack-container ${className}`}
        style={{ 
          width: `${stackWidth}px`, 
          height: `${stackHeight}px`,
          minHeight: '96px',
          minWidth: '64px'
        }}
      >
        {visibleCards.map((card, index) => (
          <div 
            key={card.id} 
            className="card-in-stack"
            style={{ 
              left: `${index * 8}px`, // Reduced horizontal spacing
              top: `${index * 1}px`,   // Reduced vertical offset
              zIndex: index + 1,
              transform: `rotate(${index * 0.3}deg)` // Reduced rotation
            }}
            onClick={() => onCardClick?.(card.id)}
          >
            <Card suit={card.suit} rank={card.rank} />
          </div>
        ))}
      </div>
    );
  }

  // Messy stack style - cards stack directly on top
  const cardWidth = 64;
  const cardHeight = 96;
  
  return (
    <div 
      className={`card-stack-messy ${className}`}
      style={{ 
        width: `${cardWidth}px`, 
        height: `${cardHeight}px`,
        minHeight: '96px',
        minWidth: '64px'
      }}
    >
      {visibleCards.map((card, index) => {
        // Create controlled "randomness" for rotation only
        const seed = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const randomRotation = (seed % 20) - 10; // Only rotation varies
        
        return (
          <div 
            key={card.id} 
            className="card-in-stack"
            style={{ 
              left: '0px', // Always at left edge
              top: '0px', // Always at top
              zIndex: index + 1,
              transform: `rotate(${randomRotation}deg)`,
              boxShadow: index === visibleCards.length - 1 
                ? '0 4px 12px rgba(0,0,0,0.2)' 
                : 'none' // Only top card has shadow
            }}
            onClick={() => onCardClick?.(card.id)}
          >
            <Card suit={card.suit} rank={card.rank} />
          </div>
        );
      })}
    </div>
  );
};

export default CardStack;
