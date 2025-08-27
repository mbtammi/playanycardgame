import React from 'react';
import CardComponent from './Card';
import type { Card as CardType, GameRules } from '../../types';
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
  onTableCardClick?: (cardId: string, zoneId: string) => void; // New prop for table card clicks
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
  layout = 'centered', // eslint-disable-line @typescript-eslint/no-unused-vars
  flexiblePlacement = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  onCardDrop,
  onTableCardClick, // New prop for handling table card clicks
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
                gameRules?.description || 'Game in progress...'
              }
            </div>
            {children}
          </div>
        );
      }

      // Render zones based on table type with enhanced flexibility
      return renderAdvancedTableZones(tableData);
    }

    // Check if rules specify a table layout
    if (gameRules?.setup?.tableLayout) {
      return renderRulesBasedTable(gameRules.setup.tableLayout);
    }

    // Fallback: Legacy table rendering
    return renderLegacyTable();
  };

  const renderAdvancedTableZones = (data: NonNullable<GameTableProps['tableData']>) => {
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
      case 'custom':
        return renderCustomTable(zones);
      default:
        return renderFlexibleTable(zones);
    }
  };

  const renderRulesBasedTable = (layout: NonNullable<GameRules['setup']['tableLayout']>) => {
    if (!layout.zones || layout.zones.length === 0) {
      return renderSimpleLayout(layout);
    }

    return (
      <div className={`rules-based-table ${layout.type}`}>
        {layout.freeformPlacement ? (
          <div className="freeform-table" style={{ position: 'relative', minHeight: '400px' }}>
            {layout.zones.map((zone) => renderTableZone(zone))}
          </div>
        ) : (
          <div className={`structured-table ${layout.type}`}>
            {layout.zones.map((zone) => renderTableZone(zone))}
          </div>
        )}
      </div>
    );
  };

  const renderTableZone = (zone: any) => {
    // Try zone.cards first (from engine tableZones), then fallback to table lookup
    const zoneCards = zone.cards || (table as any)?.[zone.id] || [];
    
    return (
      <div
        key={zone.id}
        className={`table-zone zone-${zone.type}`}
        style={{
          position: zone.position ? 'absolute' : 'relative',
          left: zone.position?.x || 'auto',
          top: zone.position?.y || 'auto',
        }}
      >
        {zone.id && <span className="zone-label">{zone.id}</span>}
        <div className="zone-cards">
          {zoneCards.length === 0 ? (
            <div className="empty-zone">
              {zone.type === 'deck' && <div className="deck-placeholder">Deck</div>}
              {zone.type === 'discard' && <div className="discard-placeholder">Discard</div>}
              {zone.type === 'grid' && <div className="grid-placeholder">Grid Area</div>}
              {zone.allowDrop && selectableCard && (
                <button
                  className="drop-zone-button"
                  onClick={() => handleDropZone(zone.id)}
                >
                  Place card
                </button>
              )}
            </div>
          ) : (
            renderZoneCards(zoneCards, zone)
          )}
        </div>
      </div>
    );
  };

  const renderZoneCards = (cards: CardType[], zone: any) => {
    // Handle grid layout specially for memory games
    if (zone.type === 'grid' && cards.length === 16) {
      return (
        <div className="memory-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '8px',
          padding: '1rem' 
        }}>
          {cards.map((card) => {
            const isFaceDown = zone.faceDown !== undefined ? zone.faceDown : !card.faceUp;
            
            return (
              <CardComponent
                key={card.id}
                suit={card.suit}
                rank={card.rank}
                faceDown={isFaceDown}
                selected={card.selected}
                onClick={onTableCardClick ? () => onTableCardClick(card.id, zone.id) : undefined}
                style={{
                  width: '60px',
                  height: '84px',
                  cursor: onTableCardClick ? 'pointer' : 'default',
                }}
              />
            );
          })}
        </div>
      );
    }
    
    // Default rendering for other zone types
    return cards.map((card, index) => {
      const isFaceDown = zone.faceDown !== undefined ? zone.faceDown : !card.faceUp;
      
      return (
        <CardComponent
          key={card.id}
          suit={card.suit}
          rank={card.rank}
          faceDown={isFaceDown}
          selected={card.selected}
          onClick={onTableCardClick ? () => onTableCardClick(card.id, zone.id) : undefined}
          style={{
            position: 'relative',
            marginLeft: zone.type === 'sequence' && index > 0 ? '-40px' : '0',
            marginTop: zone.type === 'pile' && index > 0 ? '-60px' : '0',
            zIndex: index + 1,
            cursor: onTableCardClick ? 'pointer' : 'default',
          }}
        />
      );
    });
  };

  const renderSimpleLayout = (layout: NonNullable<GameRules['setup']['tableLayout']>) => {
    return (
      <div className={`simple-layout ${layout.type}`}>
        <div className="layout-message">
          {layout.allowFlexiblePlacement ? 
            'Flexible card placement enabled' : 
            'Structured card layout'
          }
        </div>
        {children}
      </div>
    );
  };

  const renderFlexibleTable = (zones: NonNullable<GameTableProps['tableData']>['zones']) => {
    return (
      <div className="flexible-table">
        <div className="flexible-message">Advanced game layout</div>
        {zones.map((zone) => renderTableZone(zone))}
        {children}
      </div>
    );
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
                    <CardComponent
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
                <CardComponent
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
              <CardComponent
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
                <CardComponent
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
    // Check if this is a memory palace game with grid and sequence zones
    const memoryGridZone = zones.find(z => z.id === 'memory-grid');
    const sequenceAreaZone = zones.find(z => z.id === 'sequence-area');
    
    if (memoryGridZone && sequenceAreaZone) {
      return (
        <div className="memory-palace-layout">
          <div className="memory-grid-section">
            <h3 className="zone-title">Memory Grid</h3>
            {renderTableZone(memoryGridZone)}
          </div>
          <div className="sequence-area-section">
            <h3 className="zone-title">Sequence Area</h3>
            {sequenceAreaZone.cards.length === 0 ? (
              <div className="empty-sequence-area">
                <p>Create sequences here by playing cards from your hand</p>
              </div>
            ) : (
              renderTableZone(sequenceAreaZone)
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="custom-table">
        <div className="custom-message">Custom game layout</div>
        {zones.map((zone) => renderTableZone(zone))}
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
                  suitCards.map((card: CardType) => (
                    <CardComponent
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
