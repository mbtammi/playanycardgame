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
  onTableCardClick?: (cardId: string, zoneId: string) => void;
  gameRules?: GameRules;
  tableData?: {
    tableType: 'none' | 'suit-based' | 'pile-based' | 'sequence' | 'scattered' | 'custom';
    zones: Array<{
      id: string;
      type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard' | 'grid' | 'center-area' | 'player-zone';
      cards: CardType[];
      position?: { x: number; y: number };
      allowDrop?: boolean;
      allowFlip?: boolean;
      faceDown?: boolean;
      label?: string;
      gridSize?: { rows: number; cols: number };
      maxCards?: number;
      playerIndex?: number;
    }>;
    metadata: {
      needsTable: boolean;
      gameType: string;
      flexiblePlacement: boolean;
      supportsFlipping: boolean;
      supportsPeeking: boolean;
      hasPlayerZones: boolean;
      hasGridLayout: boolean;
      hasCenterArea: boolean;
    };
  };
}

const GameTable: React.FC<GameTableProps> = ({ 
  table, 
  onPlayToTable, 
  selectableCard, 
  children, 
  onCardDrop,
  onTableCardClick,
  gameRules,
  tableData
}) => {
  // AI-driven table rendering that adapts to any game type
  const renderTable = () => {
    // If we have AI-analyzed table data, use it (most flexible)
    if (tableData) {
      return renderAIAnalyzedTable(tableData);
    }

    // Fallback: Try to infer from game rules
    if (gameRules) {
      return renderInferredTable(gameRules);
    }

    // Last resort: Simple fallback
    return renderFallbackTable();
  };

  /**
   * AI-analyzed table rendering - handles any game type
   */
  const renderAIAnalyzedTable = (data: NonNullable<GameTableProps['tableData']>) => {
    const { tableType, zones, metadata } = data;

    // If game doesn't need a table, show minimal layout
    if (!metadata.needsTable || tableType === 'none') {
      return (
        <div className="simple-game-area">
          <div className="game-message">
            {getGameStatusMessage()}
          </div>
          {children}
        </div>
      );
    }

    // Render the table based on AI analysis
    return (
      <div className={`ai-table-layout ${tableType}`}>
        {/* Debug info for development */}
        <div className="debug-info">
          <span>{tableType} | flip: {metadata.supportsFlipping ? '✓' : '✗'} | grid: {metadata.hasGridLayout ? '✓' : '✗'} | center: {metadata.hasCenterArea ? '✓' : '✗'}</span>
        </div>

        {/* Render zones dynamically */}
        <div className="table-zones-container">
          {renderTableZones(zones, metadata)}
        </div>

        {/* Player zones (if the game uses them) */}
        {metadata.hasPlayerZones && renderPlayerZones(zones)}
        
        {children}
      </div>
    );
  };

  /**
   * Get game status message based on rules and current state
   */
  const getGameStatusMessage = (): string => {
    if (!gameRules) return 'Game in progress...';
    
    const { name, description } = gameRules;
    
    // AI-driven status messages for different game types
    if (name.toLowerCase().includes('memory')) {
      return 'Find matching pairs by flipping cards!';
    }
    if (name.toLowerCase().includes('black card')) {
      return 'Draw cards from the deck. Find a black card to win!';
    }
    if (name.toLowerCase().includes('sequence')) {
      return 'Build sequences with your cards!';
    }
    if (description?.toLowerCase().includes('flip')) {
      return 'Flip cards to reveal them!';
    }
    if (description?.toLowerCase().includes('match')) {
      return 'Find matching cards to score points!';
    }
    
    return description || `Playing ${name}...`;
  };

  /**
   * Render table zones dynamically based on AI analysis
   */
  const renderTableZones = (zones: NonNullable<GameTableProps['tableData']>['zones'], metadata: NonNullable<GameTableProps['tableData']>['metadata']) => {
    if (!zones || zones.length === 0) return null;

    return zones
      .filter(zone => zone.type !== 'player-zone') // Player zones rendered separately
      .map(zone => renderAdvancedTableZone(zone, metadata));
  };

  /**
   * Render player zones separately (for games that have dedicated player areas)
   */
  const renderPlayerZones = (zones: NonNullable<GameTableProps['tableData']>['zones']) => {
    const playerZones = zones.filter(zone => zone.type === 'player-zone');
    if (playerZones.length === 0) return null;

    return (
      <div className="player-zones-container">
        <h3>Player Areas</h3>
        <div className="player-zones-grid">
          {playerZones.map(zone => renderAdvancedTableZone(zone, { needsTable: true, gameType: '', flexiblePlacement: false, supportsFlipping: false, supportsPeeking: false, hasPlayerZones: true, hasGridLayout: false, hasCenterArea: false }))}
        </div>
      </div>
    );
  };

  /**
   * Advanced table zone rendering that handles all zone types
   */
  const renderAdvancedTableZone = (zone: NonNullable<GameTableProps['tableData']>['zones'][0], metadata: NonNullable<GameTableProps['tableData']>['metadata']) => {
    // Try zone.cards first (from engine tableZones), then fallback to table lookup
    const zoneCards = zone.cards || (table as any)?.[zone.id] || [];
    
    return (
      <div
        key={zone.id}
        className={`table-zone zone-${zone.type} ${zone.allowFlip ? 'flippable' : ''}`}
        style={{
          position: zone.position ? 'absolute' : 'relative',
          left: zone.position?.x || 'auto',
          top: zone.position?.y || 'auto',
        }}
      >
        {/* Zone label */}
        {zone.label && <span className="zone-label">{zone.label}</span>}
        
        {/* Zone content */}
        <div className="zone-content">
          {renderZoneContent(zone, zoneCards, metadata)}
        </div>
      </div>
    );
  };

  /**
   * Render zone content based on zone type and game requirements
   */
  const renderZoneContent = (zone: NonNullable<GameTableProps['tableData']>['zones'][0], cards: CardType[], metadata: NonNullable<GameTableProps['tableData']>['metadata']) => {
    // Handle empty zones
    if (cards.length === 0) {
      return renderEmptyZone(zone);
    }

    // Special rendering for different zone types
    switch (zone.type) {
      case 'grid':
        return renderGridZone(zone, cards, metadata);
      case 'center-area':
        return renderCenterAreaZone(zone, cards, metadata);
      case 'sequence':
        return renderSequenceZone(zone, cards, metadata);
      case 'pile':
        return renderPileZone(zone, cards, metadata);
      case 'player-zone':
        return renderPlayerZone(zone, cards, metadata);
      default:
        return renderDefaultZone(zone, cards, metadata);
    }
  };

  /**
   * Render empty zone with appropriate placeholder
   */
  const renderEmptyZone = (zone: NonNullable<GameTableProps['tableData']>['zones'][0]) => {
    return (
      <div className="empty-zone">
        {zone.type === 'deck' && <div className="deck-placeholder">Deck</div>}
        {zone.type === 'discard' && <div className="discard-placeholder">Discard</div>}
        {zone.type === 'grid' && <div className="grid-placeholder">Memory Grid</div>}
        {zone.type === 'center-area' && <div className="center-placeholder">Center Area</div>}
        {zone.type === 'sequence' && <div className="sequence-placeholder">Build Sequences</div>}
        {zone.type === 'pile' && <div className="pile-placeholder">Empty Pile</div>}
        {zone.type === 'player-zone' && <div className="player-placeholder">Player Area</div>}
        
        {zone.allowDrop && selectableCard && (
          <button
            className="drop-zone-button"
            onClick={() => handleDropZone(zone.id)}
          >
            Place card
          </button>
        )}
      </div>
    );
  };

  /**
   * Render grid zone (for memory games, etc.)
   */
  const renderGridZone = (zone: NonNullable<GameTableProps['tableData']>['zones'][0], cards: CardType[], metadata: NonNullable<GameTableProps['tableData']>['metadata']) => {
    const { rows = 4, cols = 4 } = zone.gridSize || {};
    
    return (
      <div 
        className="memory-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${cols}, 1fr)`, 
          gap: '8px',
          padding: '1rem' 
        }}
      >
        {cards.map((card, index) => {
          const isFaceDown = zone.faceDown !== undefined ? zone.faceDown : !card.faceUp;
          
          return (
            <CardComponent
              key={card.id}
              suit={card.suit}
              rank={card.rank}
              faceDown={isFaceDown}
              selected={card.selected}
              onClick={onTableCardClick && zone.allowFlip ? () => onTableCardClick(card.id, zone.id) : undefined}
              style={{
                width: '60px',
                height: '84px',
                cursor: (onTableCardClick && zone.allowFlip) ? 'pointer' : 'default',
                transform: card.selected ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.2s ease',
              }}
            />
          );
        })}
      </div>
    );
  };

  /**
   * Render center area zone (for building sequences, etc.)
   */
  const renderCenterAreaZone = (zone: NonNullable<GameTableProps['tableData']>['zones'][0], cards: CardType[], metadata: NonNullable<GameTableProps['tableData']>['metadata']) => {
    if (cards.length === 0) {
      return (
        <div className="empty-center-area">
          <p>Create sequences here by playing cards from your hand</p>
          {zone.allowDrop && selectableCard && (
            <button
              className="center-drop-button"
              onClick={() => handleDropZone(zone.id)}
            >
              Start sequence
            </button>
          )}
        </div>
      );
    }

    // Group cards by sequences (consecutive ranks)
    const sequences = groupCardsIntoSequences(cards);
    
    return (
      <div className="center-area-sequences">
        {sequences.map((sequence, seqIndex) => (
          <div key={seqIndex} className="sequence-group">
            {sequence.map((card, cardIndex) => (
              <CardComponent
                key={card.id}
                suit={card.suit}
                rank={card.rank}
                faceDown={zone.faceDown !== undefined ? zone.faceDown : !card.faceUp}
                selected={card.selected}
                onClick={onTableCardClick ? () => onTableCardClick(card.id, zone.id) : undefined}
                style={{
                  position: 'relative',
                  marginLeft: cardIndex > 0 ? '-30px' : '0',
                  zIndex: cardIndex + 1,
                  cursor: onTableCardClick ? 'pointer' : 'default',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render sequence zone
   */
  const renderSequenceZone = (zone: NonNullable<GameTableProps['tableData']>['zones'][0], cards: CardType[], metadata: NonNullable<GameTableProps['tableData']>['metadata']) => {
    return (
      <div className="sequence-cards">
        {cards.map((card, index) => (
          <CardComponent
            key={card.id}
            suit={card.suit}
            rank={card.rank}
            faceDown={zone.faceDown !== undefined ? zone.faceDown : !card.faceUp}
            selected={card.selected}
            onClick={onTableCardClick ? () => onTableCardClick(card.id, zone.id) : undefined}
            style={{
              position: 'relative',
              marginLeft: index > 0 ? '-40px' : '0',
              zIndex: 10 + index,
              cursor: onTableCardClick ? 'pointer' : 'default',
            }}
          />
        ))}
      </div>
    );
  };

  /**
   * Render pile zone (stacked cards)
   */
  const renderPileZone = (zone: NonNullable<GameTableProps['tableData']>['zones'][0], cards: CardType[], metadata: NonNullable<GameTableProps['tableData']>['metadata']) => {
    return (
      <div className="pile-cards">
        {cards.map((card, index) => (
          <CardComponent
            key={card.id}
            suit={card.suit}
            rank={card.rank}
            faceDown={zone.faceDown !== undefined ? zone.faceDown : !card.faceUp}
            selected={card.selected}
            onClick={onTableCardClick ? () => onTableCardClick(card.id, zone.id) : undefined}
            style={{
              position: 'relative',
              marginTop: index > 0 ? '-60px' : '0',
              zIndex: index + 1,
              cursor: onTableCardClick ? 'pointer' : 'default',
            }}
          />
        ))}
      </div>
    );
  };

  /**
   * Render player zone (dedicated player area)
   */
  const renderPlayerZone = (zone: NonNullable<GameTableProps['tableData']>['zones'][0], cards: CardType[], metadata: NonNullable<GameTableProps['tableData']>['metadata']) => {
    return (
      <div className="player-zone-cards">
        <h4>Player {(zone.playerIndex || 0) + 1}</h4>
        <div className="player-cards">
          {cards.map((card, index) => (
            <CardComponent
              key={card.id}
              suit={card.suit}
              rank={card.rank}
              faceDown={zone.faceDown !== undefined ? zone.faceDown : !card.faceUp}
              selected={card.selected}
              onClick={onTableCardClick ? () => onTableCardClick(card.id, zone.id) : undefined}
              style={{
                position: 'relative',
                marginLeft: index > 0 ? '-20px' : '0',
                zIndex: index + 1,
                cursor: onTableCardClick ? 'pointer' : 'default',
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render default zone (fallback)
   */
  const renderDefaultZone = (zone: NonNullable<GameTableProps['tableData']>['zones'][0], cards: CardType[], metadata: NonNullable<GameTableProps['tableData']>['metadata']) => {
    return (
      <div className="default-zone-cards">
        {cards.map((card, index) => (
          <CardComponent
            key={card.id}
            suit={card.suit}
            rank={card.rank}
            faceDown={zone.faceDown !== undefined ? zone.faceDown : !card.faceUp}
            selected={card.selected}
            onClick={onTableCardClick ? () => onTableCardClick(card.id, zone.id) : undefined}
            style={{
              position: 'relative',
              marginRight: index < cards.length - 1 ? '10px' : '0',
              cursor: onTableCardClick ? 'pointer' : 'default',
            }}
          />
        ))}
      </div>
    );
  };

  /**
   * Infer table layout from game rules when no AI analysis is available
   */
  const renderInferredTable = (rules: GameRules) => {
    const { name, description, specialRules } = rules;
    const lowerName = name.toLowerCase();
    const lowerDesc = description?.toLowerCase() || '';
    const lowerSpecial = specialRules?.join(' ').toLowerCase() || '';
    
    // AI-driven rule inference
    const hasMemoryElements = lowerName.includes('memory') || lowerDesc.includes('flip') || lowerDesc.includes('match');
    const hasGridLayout = lowerDesc.includes('grid') || lowerDesc.includes('4x4') || lowerDesc.includes('3x3');
    const hasCenterArea = lowerDesc.includes('center') || lowerDesc.includes('sequence');
    const hasFlipping = lowerDesc.includes('flip') || lowerDesc.includes('face-down');
    
    if (hasMemoryElements && hasGridLayout) {
      return (
        <div className="inferred-memory-game">
          <div className="game-message">Memory game detected - flip cards to find matches!</div>
          <div className="inferred-grid">
            {/* Placeholder for memory grid */}
            <div className="grid-placeholder">4x4 Memory Grid</div>
          </div>
          {hasCenterArea && (
            <div className="inferred-center">
              <div className="center-placeholder">Center Area for Sequences</div>
            </div>
          )}
          {children}
        </div>
      );
    }
    
    return renderFallbackTable();
  };

  /**
   * Simple fallback table for when no other options work
   */
  const renderFallbackTable = () => {
    return (
      <div className="fallback-table">
        <div className="game-message">
          {gameRules?.description || 'Game in progress...'}
        </div>
        {children}
      </div>
    );
  };

  /**
   * Group cards into sequences for center area display
   */
  const groupCardsIntoSequences = (cards: CardType[]): CardType[][] => {
    if (cards.length === 0) return [];
    
    // Simple grouping by suit first, then sort by rank
    const suitGroups = cards.reduce((groups, card) => {
      if (!groups[card.suit]) groups[card.suit] = [];
      groups[card.suit].push(card);
      return groups;
    }, {} as Record<string, CardType[]>);
    
    // Sort each suit by rank and return as sequences
    return Object.values(suitGroups).map(suitCards => 
      suitCards.sort((a, b) => getCardNumericValue(a.rank) - getCardNumericValue(b.rank))
    );
  };

  /**
   * Get numeric value for card ranking
   */
  const getCardNumericValue = (rank: string): number => {
    switch (rank.toUpperCase()) {
      case 'A': return 1;
      case '2': return 2;
      case '3': return 3;
      case '4': return 4;
      case '5': return 5;
      case '6': return 6;
      case '7': return 7;
      case '8': return 8;
      case '9': return 9;
      case '10': return 10;
      case 'J': return 11;
      case 'Q': return 12;
      case 'K': return 13;
      default: return 0;
    }
  };

  const handleDropZone = (suit: string, position?: 'before' | 'after') => {
    if (selectableCard && onCardDrop) {
      onCardDrop(selectableCard.id, suit, position);
    } else if (selectableCard && onPlayToTable) {
      onPlayToTable(suit, selectableCard);
    }
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
        {tableData ? `${tableData.tableType} | needs: ${tableData.metadata.needsTable}` : 'inferred'}
      </div>
      
      {renderTable()}
    </div>
  );
};

export default GameTable;
