import type { Card } from '../types';

export interface TableLayoutConfig {
  layout: 'grid' | 'centered' | 'sequence' | 'radial';
  spacing: 'compact' | 'normal' | 'spacious';
  orientation: 'horizontal' | 'vertical' | 'auto';
  centerCard?: Card;
}

export class TableLayoutManager {
  /**
   * Calculate optimal layout for a given table state
   */
  static calculateOptimalLayout(
    gameType: string,
    totalCards: number
  ): TableLayoutConfig {
    // Sevens and sequence games work best with horizontal sequences
    if (gameType === 'sevens' || gameType.includes('sequence')) {
      return {
        layout: 'sequence',
        spacing: 'normal',
        orientation: 'horizontal',
      };
    }

    // Games with many cards need compact layout
    if (totalCards > 20) {
      return {
        layout: 'grid',
        spacing: 'compact',
        orientation: 'auto',
      };
    }

    // Few cards can be centered nicely
    if (totalCards < 8) {
      return {
        layout: 'centered',
        spacing: 'spacious',
        orientation: 'auto',
      };
    }

    // Default balanced layout
    return {
      layout: 'centered',
      spacing: 'normal',
      orientation: 'auto',
    };
  }

  /**
   * Calculate card positions for smooth animations
   */
  static calculateCardPositions(
    cards: Card[],
    layout: TableLayoutConfig,
    containerWidth: number,
    containerHeight: number
  ): Array<{ x: number; y: number; rotation: number; zIndex: number }> {
    const cardWidth = 64;
    const cardHeight = 96;

    switch (layout.layout) {
      case 'sequence':
        return this.calculateSequencePositions(cards, containerWidth, cardWidth);
      
      case 'grid':
        return this.calculateGridPositions(cards, containerWidth, containerHeight, cardWidth, cardHeight);
      
      case 'centered':
        return this.calculateCenteredPositions(cards, containerWidth, containerHeight, cardWidth, cardHeight);
      
      case 'radial':
        return this.calculateRadialPositions(cards, containerWidth, containerHeight, cardWidth, cardHeight);
      
      default:
        return this.calculateCenteredPositions(cards, containerWidth, containerHeight, cardWidth, cardHeight);
    }
  }

  private static calculateSequencePositions(
    cards: Card[],
    containerWidth: number,
    cardWidth: number
  ): Array<{ x: number; y: number; rotation: number; zIndex: number }> {
    const positions = [];
    const spacing = 20; // Overlap by 44px (64-20)
    const totalWidth = cardWidth + (cards.length - 1) * spacing;
    const startX = (containerWidth - totalWidth) / 2;

    for (let i = 0; i < cards.length; i++) {
      positions.push({
        x: startX + i * spacing,
        y: 0,
        rotation: 0,
        zIndex: i + 1,
      });
    }

    return positions;
  }

  private static calculateGridPositions(
    cards: Card[],
    containerWidth: number,
    containerHeight: number,
    cardWidth: number,
    cardHeight: number
  ): Array<{ x: number; y: number; rotation: number; zIndex: number }> {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(cards.length));
    const rows = Math.ceil(cards.length / cols);
    
    const spacing = 10;
    const totalWidth = cols * cardWidth + (cols - 1) * spacing;
    const totalHeight = rows * cardHeight + (rows - 1) * spacing;
    
    const startX = (containerWidth - totalWidth) / 2;
    const startY = (containerHeight - totalHeight) / 2;

    for (let i = 0; i < cards.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      positions.push({
        x: startX + col * (cardWidth + spacing),
        y: startY + row * (cardHeight + spacing),
        rotation: 0,
        zIndex: i + 1,
      });
    }

    return positions;
  }

  private static calculateCenteredPositions(
    cards: Card[],
    containerWidth: number,
    containerHeight: number,
    cardWidth: number,
    cardHeight: number
  ): Array<{ x: number; y: number; rotation: number; zIndex: number }> {
    const positions = [];
    const centerX = containerWidth / 2 - cardWidth / 2;
    const centerY = containerHeight / 2 - cardHeight / 2;

    // Create a slight fan effect for multiple cards
    const maxRotation = Math.min(15, cards.length * 2);
    const rotationStep = cards.length > 1 ? (maxRotation * 2) / (cards.length - 1) : 0;

    for (let i = 0; i < cards.length; i++) {
      const rotation = cards.length > 1 ? -maxRotation + i * rotationStep : 0;
      const offsetX = i * 3 - (cards.length - 1) * 1.5; // Slight horizontal spread
      const offsetY = Math.abs(rotation) * 0.5; // Slight vertical offset based on rotation

      positions.push({
        x: centerX + offsetX,
        y: centerY + offsetY,
        rotation,
        zIndex: i + 1,
      });
    }

    return positions;
  }

  private static calculateRadialPositions(
    cards: Card[],
    containerWidth: number,
    containerHeight: number,
    cardWidth: number,
    cardHeight: number
  ): Array<{ x: number; y: number; rotation: number; zIndex: number }> {
    const positions = [];
    const centerX = containerWidth / 2 - cardWidth / 2;
    const centerY = containerHeight / 2 - cardHeight / 2;
    const radius = Math.min(containerWidth, containerHeight) * 0.3;

    for (let i = 0; i < cards.length; i++) {
      const angle = (i / cards.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const rotation = (angle * 180) / Math.PI + 90; // Point cards toward center

      positions.push({
        x,
        y,
        rotation,
        zIndex: i + 1,
      });
    }

    return positions;
  }
}
