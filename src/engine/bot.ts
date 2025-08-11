import type { GameState, GameAction, GameRules } from '../types';

/**
 * Generic bot decision engine. Returns the next action for a bot player.
 * Extend this logic for each game type as needed.
 */
export function getBotAction(gameState: GameState, rules: GameRules, botId: string): { action: GameAction, cardIds?: string[] } {
  // Example: Blackjack bot
  if (rules.id === 'blackjack' || rules.name.toLowerCase().includes('blackjack')) {
    const handValues = (gameState as any).handValues || {};
    const value = handValues[botId] ?? 0;
    if (value < 16) {
      return { action: 'play' }; // Hit
    } else {
      return { action: 'pass' }; // Stand
    }
  }

  // Example: Go Fish bot (very basic)
  if (rules.id === 'go-fish' || rules.name.toLowerCase().includes('go fish')) {
    // Always call (ask for a card) if possible, else draw
    if (rules.actions.includes('call')) {
      return { action: 'call' };
    }
    if (rules.actions.includes('draw')) {
      return { action: 'draw' };
    }
    return { action: 'pass' };
  }

  // Sevens bot logic
  if (rules.id === 'sevens') {
    const bot = gameState.players.find(p => p.id === botId);
    if (!bot || bot.hand.length === 0) {
      return { action: 'pass' };
    }
    
    const table = (gameState as any).table || {};
    const totalCardsOnTable = Object.values(table).reduce((sum: number, suitCards: any) => sum + suitCards.length, 0);
    
    // First move: Must play 7 of diamonds if we have it
    if (totalCardsOnTable === 0) {
      const sevenOfDiamonds = bot.hand.find(card => card.rank === '7' && card.suit === 'diamonds');
      if (sevenOfDiamonds) {
        return { action: 'play', cardIds: [sevenOfDiamonds.id] };
      }
      // If we don't have 7 of diamonds, we must pass (this shouldn't happen if game setup is correct)
      return { action: 'pass' };
    }
    
    // After first move: Priority order for playing cards
    
    // 1. First priority: Play any 7s to open new suits
    const sevens = bot.hand.filter(card => card.rank === '7');
    if (sevens.length > 0) {
      return { action: 'play', cardIds: [sevens[0].id] };
    }
    
    // 2. Second priority: Play cards that build on existing sequences
    for (const card of bot.hand) {
      const suitCards = table[card.suit] || [];
      if (suitCards.length === 0) continue; // Can't play if no 7 in this suit yet
      
      // Check if this card can be played
      const cardValue = getCardNumericValue(card.rank);
      const suitValues = suitCards.map((c: any) => getCardNumericValue(c.rank)).sort((a: number, b: number) => a - b);
      const minValue = Math.min(...suitValues);
      const maxValue = Math.max(...suitValues);
      
      if (cardValue === minValue - 1 || cardValue === maxValue + 1) {
        return { action: 'play', cardIds: [card.id] };
      }
    }
    
    // No valid moves, must pass
    return { action: 'pass' };
  }

  // Default: pick the first available action (custom or built-in)
  if (rules.actions && rules.actions.length > 0) {
    return { action: rules.actions[0] };
  }
  return { action: 'pass' };
}

// Helper function for card values (same as in GameEngine)
function getCardNumericValue(rank: string): number {
  switch (rank) {
    case 'A': return 14; // Aces are high in Sevens
    case 'K': return 13;
    case 'Q': return 12;
    case 'J': return 11;
    default: return parseInt(rank);
  }
}
