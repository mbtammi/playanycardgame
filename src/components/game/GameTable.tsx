import React from 'react';
import type { Card as CardType } from '../../types';
import Card from './Card';

interface GameTableProps {
  table?: Record<string, CardType[]>;
  onPlayToTable?: (suit: string, card: CardType) => void;
  selectableCard?: CardType | null;
  children?: React.ReactNode;
}

const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

const GameTable: React.FC<GameTableProps> = ({ table, onPlayToTable, selectableCard, children }) => (
  <div className="game-table w-full max-w-4xl mx-auto my-8 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-green-100 to-green-200 border border-green-200 relative flex flex-col items-center justify-center min-h-[400px]">
    {/* Flexible table visualization if table prop is provided */}
    {table ? (
      <div className="grid grid-cols-4 gap-8 w-full mb-8">
        {suits.map((suit) => (
          <div key={suit} className="flex flex-col items-center">
            <span className="capitalize font-bold mb-2">{suit}</span>
            <div className="flex flex-col gap-1 min-h-[120px]">
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
                  className="mt-2 px-2 py-1 bg-green-100 rounded text-xs text-green-700 hover:bg-green-200"
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
