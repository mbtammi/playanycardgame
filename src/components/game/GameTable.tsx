import React from 'react';
import type { Card as CardType, GameRules } from '../../types';
import Card from './Card';
import './GameTable.css';

interface GameTableProps {
  table?: Record<string, CardType[]> | CardType[] | any;
  onPlayToTable?: (suit: string, card: CardType) => void;
  selectableCard?: CardType | null;
  children?: React.ReactNode;
  layout?: 'grid' | 'centered' | 'sequence' | 'scattered' | 'custom';
  flexiblePlacement?: boolean;
  playerCount?: number;
  onCardDrop?: (cardId: string, targetSuit: string, position?: 'before' | 'after') => void;
  gameRules?: GameRules;
  tableData?: {
    tableType: 'none' | 'suit-based' | 'pile-based' | 'sequence' | 'scattered' | 'custom';
    zones: Array<{
      id: string;
      type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard';
      cards: CardType[];
      position?: { x: number; y: number };
      allowDrop?: boolean;
      label?: string;
    }>;
    metadata: {
      needsTable: boolean;
      gameType: string;
      flexiblePlacement: boolean;
    };
  };
}

const GameTable: React.FC<GameTableProps> = ({ 
  table, 
  onPlayToTable, 
  selectableCard, 
  children, 
  layout = 'centered',
  flexiblePlacement = false,
  onCardDrop,
  gameRules,
  tableData
}) => {
  // Revolutionary AI-driven table rendering
  const renderTable = () => {
    // If we have advanced table data, use it
    if (tableData) {
      // If game doesn't need a table, show minimal layout
      if (!tableData.metadata.needsTable || tableData.tableType === 'none') {
        return (
          <div className="simple-game-area">
            <div className="game-message">
              {gameRules?.name === 'Black Card Challenge' ? 
                'Draw cards from the deck. Find a black card to win!' :
                'Game in progress...'
              }
            </div>
            {children}
          </div>
        );
      }

      // Render zones based on table type
      return renderTableZones(tableData);
    }

    // Fallback: Legacy table rendering
    return renderLegacyTable();
  };

  const renderTableZones = (data: NonNullable<GameTableProps['tableData']>) => {
    const { tableType, zones } = data;

    switch (tableType) {
      case 'suit-based':
        return renderSuitBasedTable(zones);
      case 'pile-based':
        return renderPileBasedTable(zones);
      case 'scattered':
        return renderScatteredTable(zones);
      case 'sequence':
        return renderSequenceTable(zones);
      default:
        return renderCustomTable(zones);
    }
  };

  const renderSuitBasedTable = (zones: NonNullable<GameTableProps['tableData']>['zones']) => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    
    return (
      <div className="table-grid grid">
        {suits.map((suit) => {
          const zone = zones.find(z => z.id === suit);
          const { symbol, color } = getSuitSymbol(suit);
          
          return (
            <div key={suit} className="suit-column">
              <span className={`suit-label ${color}`}>
                {suit} {symbol}
              </span>
              <div className="suit-cards">
                {zone?.cards?.length === 0 ? (
                  <div className="empty-pile">
                    {zone.allowDrop && selectableCard && (
                      <button
                        className="play-button"
                        onClick={() => handleDropZone(suit)}
                      >
                        Start {suit}
                      </button>
                    )}
                  </div>
                ) : (
                  zone?.cards?.map((card, index) => (
                    <Card
                      key={card.id}
                      suit={card.suit}
                      rank={card.rank}
                      faceDown={card.faceUp === false}
                      selected={card.selected}
                      style={{
                        position: 'relative',
                        marginLeft: index > 0 ? '-40px' : '0',
                        zIndex: 10 + index,
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPileBasedTable = (zones: NonNullable<GameTableProps['tableData']>['zones']) => {
    return (
      <div className="table-grid centered">
        {zones.map((zone) => (
          <div key={zone.id} className="pile-zone">
            {zone.label && <span className="zone-label">{zone.label}</span>}
            <div className="pile-cards">
              {zone.cards.map((card, index) => (
                <Card
                  key={card.id}
                  suit={card.suit}
                  rank={card.rank}
                  faceDown={card.faceUp === false}
                  selected={card.selected}
                  style={{
                    position: 'relative',
                    marginTop: index > 0 ? '-60px' : '0',
                    zIndex: index + 1,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderScatteredTable = (zones: NonNullable<GameTableProps['tableData']>['zones']) => {
    return (
      <div className="scattered-table" style={{ position: 'relative', width: '100%', height: '500px' }}>
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="scattered-card"
            style={{
              position: 'absolute',
              left: zone.position?.x || 0,
              top: zone.position?.y || 0,
            }}
          >
            {zone.cards.map((card) => (
              <Card
                key={card.id}
                suit={card.suit}
                rank={card.rank}
                faceDown={card.faceUp === false}
                selected={card.selected}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderSequenceTable = (zones: NonNullable<GameTableProps['tableData']>['zones']) => {
    return (
      <div className="table-grid sequence">
        {zones.map((zone) => (
          <div key={zone.id} className="sequence-zone">
            {zone.label && <span className="zone-label">{zone.label}</span>}
            <div className="sequence-cards">
              {zone.cards.map((card, index) => (
                <Card
                  key={card.id}
                  suit={card.suit}
                  rank={card.rank}
                  faceDown={card.faceUp === false}
                  selected={card.selected}
                  style={{
                    position: 'relative',
                    marginLeft: index > 0 ? '-40px' : '0',
                    zIndex: 10 + index,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomTable = (zones: NonNullable<GameTableProps['tableData']>['zones']) => {
    return (
      <div className="custom-table">
        <div className="custom-message">Custom game layout</div>
        {zones.map((zone) => (
          <div key={zone.id} className="custom-zone">
            {zone.cards.map((card) => (
              <Card
                key={card.id}
                suit={card.suit}
                rank={card.rank}
                faceDown={card.faceUp === false}
                selected={card.selected}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderLegacyTable = () => {
    // Only show legacy suit-based table if game actually uses suits
    if (!table || typeof table !== 'object' || Array.isArray(table)) {
      return (
        <div className="simple-game-area">
          <div className="game-message">Game in progress...</div>
          {children}
        </div>
      );
    }

    const hasSuitData = Object.keys(table).some(key => 
      ['hearts', 'diamonds', 'clubs', 'spades'].includes(key) && 
      table[key]?.length > 0
    );

    if (!hasSuitData) {
      return (
        <div className="simple-game-area">
          <div className="game-message">Game in progress...</div>
          {children}
        </div>
      );
    }

    // Legacy suit-based rendering
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    return (
      <div className="table-grid centered">
        {suits.map((suit) => {
          const suitCards = table[suit] || [];
          const { symbol, color } = getSuitSymbol(suit);
          
          return (
            <div key={suit} className="suit-column">
              <span className={`suit-label ${color}`}>
                {suit} {symbol}
              </span>
              <div className="suit-cards">
                {suitCards.length === 0 ? (
                  <div className="empty-pile" />
                ) : (
                  suitCards.map((card: CardType, index: number) => (
                    <Card
                      key={card.id}
                      suit={card.suit}
                      rank={card.rank}
                      faceDown={card.faceUp === false}
                      selected={card.selected}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleDropZone = (suit: string, position?: 'before' | 'after') => {
    if (selectableCard && onCardDrop) {
      onCardDrop(selectableCard.id, suit, position);
    } else if (selectableCard && onPlayToTable) {
      onPlayToTable(suit, selectableCard);
    }
  };

  const getSuitSymbol = (suit: string) => {
    const symbols = {
      hearts: { symbol: '♥', color: 'text-red-500' },
      diamonds: { symbol: '♦', color: 'text-red-500' },
      clubs: { symbol: '♣', color: 'text-black' },
      spades: { symbol: '♠', color: 'text-black' },
    };
    return symbols[suit as keyof typeof symbols] || { symbol: '', color: 'text-black' };
  };

  return (
    <div className="game-table">
      {/* Debug: Show current table type and layout */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        background: 'rgba(0,0,0,0.1)', 
        padding: '4px 8px', 
        borderRadius: '4px', 
        fontSize: '12px',
        color: '#666'
      }}>
        {tableData ? `${tableData.tableType} | needs: ${tableData.metadata.needsTable}` : 'legacy'}
      </div>
      
      {renderTable()}
    </div>
  );
};

export default GameTable;
