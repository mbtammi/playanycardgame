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

  // Default: pick the first available action (custom or built-in)
  if (rules.actions && rules.actions.length > 0) {
    return { action: rules.actions[0] };
  }
  return { action: 'pass' };
}
