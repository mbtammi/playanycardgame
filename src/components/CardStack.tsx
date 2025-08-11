import React from 'react';
import Card from './game/Card';
import type { Card as CardType } from '../types';

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
      <div className={`w-16 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs ${className}`}>
        Empty
      </div>
    );
  }

  const visibleCards = maxVisible ? cards.slice(-maxVisible) : cards;

  if (stackType === 'clean') {
    // Calculate required dimensions for clean stack
    const cardWidth = 64;
    const cardHeight = 96;
    const stackWidth = cardWidth + (visibleCards.length - 1) * 12;
    const stackHeight = cardHeight + (visibleCards.length - 1) * 2;
    
    return (
      <div 
        className={`relative ${className}`}
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
            className="absolute transition-all duration-300 hover:z-50 hover:scale-110 cursor-pointer"
            style={{ 
              left: `${index * 12}px`, // Clean horizontal spacing
              top: `${index * 2}px`,   // Slight vertical offset for depth
              zIndex: index + 1,
              transform: `rotate(${index * 0.5}deg)` // Very subtle rotation for realism
            }}
            onClick={() => onCardClick?.(card.id)}
          >
            <Card suit={card.suit} rank={card.rank} />
          </div>
        ))}
      </div>
    );
  }

  // Messy stack style - calculate required dimensions
  const cardWidth = 64;
  const cardHeight = 96;
  const pileWidth = cardWidth + 40; // Extra space for random positioning
  const pileHeight = cardHeight + (visibleCards.length * 3) + 16; // Stack height + random offset
  
  return (
    <div 
      className={`relative flex justify-center ${className}`}
      style={{ 
        width: `${pileWidth}px`, 
        height: `${pileHeight}px`,
        minHeight: '96px',
        minWidth: '80px'
      }}
    >
      {visibleCards.map((card, index) => {
        // Create controlled "randomness" based on card ID for consistency
        const seed = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const randomX = (seed % 20) - 10; // -10 to +10 px
        const randomY = (seed % 16) - 8;  // -8 to +8 px
        const randomRotation = (seed % 30) - 15; // -15 to +15 degrees
        
        return (
          <div 
            key={card.id} 
            className="absolute transition-all duration-300 hover:z-50 hover:scale-110 cursor-pointer"
            style={{ 
              left: `${20 + randomX}px`, // Center + random offset
              top: `${index * 3 + randomY}px`, // Stack height + random offset
              zIndex: index + 1,
              transform: `rotate(${randomRotation}deg)`,
              boxShadow: index === visibleCards.length - 1 
                ? '0 8px 24px rgba(0,0,0,0.3)' 
                : '0 2px 8px rgba(0,0,0,0.1)'
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
