import React from 'react';
import type { Card as CardType } from '../../types';
import Card from './Card';
import './GameTable.css';

interface GameTableProps {
  table?: Record<string, CardType[]>;
  onPlayToTable?: (suit: string, card: CardType) => void;
  selectableCard?: CardType | null;
  children?: React.ReactNode;
}

const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

const GameTable: React.FC<GameTableProps> = ({ table, onPlayToTable, selectableCard, children }) => (
  <div className="game-table">
    {/* Flexible table visualization if table prop is provided */}
    {table ? (
      <div className="table-grid">
        {suits.map((suit) => (
          <div key={suit} className="suit-column">
            <span className="suit-label">{suit}</span>
            <div className="suit-cards">
              {(table[suit] || []).map((card) => (
                <Card
                  key={card.id}
                  suit={card.suit}
                  rank={card.rank}
                  faceDown={card.faceUp === false}
                  selected={card.selected}
                />
              ))}
              {onPlayToTable && selectableCard && (
                <button
                  className="play-button"
                  onClick={() => onPlayToTable(suit, selectableCard)}
                >
                  Play here
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : null}
    {/* Render children for backward compatibility */}
    {children}
  </div>
);

export default GameTable;
