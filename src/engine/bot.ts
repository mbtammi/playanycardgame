import type { GameState, GameAction, GameRules, AIBotMove } from '../types';

/**
 * Universal bot decision engine that works with any card game.
 * Uses the game engine's validation system to make intelligent decisions.
 * No hardcoded game logic - completely schema-driven.
 */
export function getBotAction(gameState: GameState, rules: GameRules, botId: string): { action: GameAction, cardIds?: string[] } {
  // 1. Check if the game rules provide an AI strategy function
  if (rules.aiPrompt && typeof window !== 'undefined' && (window as any).gameEngine) {
    try {
      const aiMove = getAIGeneratedMove(gameState, rules, botId);
      if (aiMove && validateBotMove(gameState, rules, botId, aiMove)) {
        return { action: aiMove.action, cardIds: aiMove.cards };
      }
    } catch (error) {
      console.warn('AI strategy failed, falling back to universal logic:', error);
    }
  }

  // 2. Use universal game-agnostic logic
  return getUniversalBotMove(gameState, rules, botId);
}

/**
 * Universal bot logic that works for any game by using the schema and validation
 */
function getUniversalBotMove(gameState: GameState, rules: GameRules, botId: string): { action: GameAction, cardIds?: string[] } {
  const bot = gameState.players.find(p => p.id === botId);
  if (!bot) {
    return { action: 'pass' };
  }

  // Get all valid actions from the game engine (this uses the schema)
  const validActions = getValidActionsForPlayer(gameState, rules, botId);
  
  if (validActions.length === 0) {
    return { action: 'pass' };
  }

  // For each valid action, try to find valid cards (if needed)
  for (const action of prioritizeActions(validActions, gameState, rules)) {
    const result = tryActionWithCards(gameState, rules, botId, action, bot);
    if (result) {
      return result;
    }
  }

  // Final fallback: first valid action without cards
  return { action: validActions[0] };
}

/**
 * Get valid actions for a player using game engine logic simulation
 */
function getValidActionsForPlayer(gameState: GameState, rules: GameRules, botId: string): GameAction[] {
  // Use the current phase to determine allowed actions
  const currentPhase = gameState.currentPhase || 'playing';
  const phaseObj = rules.turnStructure?.phases?.find(phase => phase.name === currentPhase);
  const allowedActions = phaseObj?.actions || rules.actions;

  const player = gameState.players.find(p => p.id === botId);
  if (!player || !player.isActive) {
    return [];
  }

  // Filter actions based on basic validation
  return (allowedActions as GameAction[]).filter(action => {
    return isBasicActionValid(gameState, rules, botId, action);
  });
}

/**
 * Basic action validation without card selection
 */
function isBasicActionValid(gameState: GameState, rules: GameRules, botId: string, action: GameAction): boolean {
  const player = gameState.players.find(p => p.id === botId);
  if (!player) return false;

  switch (action) {
    case 'draw':
      return gameState.deck.length > 0;
    case 'play':
      // Smart play validation based on game type
      if (isCardRequestGame(rules)) {
        // In card request games (like Blackjack), "play" means "hit" - always valid
        return true;
      } else {
        // In regular games, need cards to play
        return player.hand.length > 0;
      }
    case 'discard':
    case 'playToTable':
      return player.hand.length > 0;
    case 'pass':
      return true;
    default:
      // For custom actions, assume they're valid (let the game engine decide)
      return true;
  }
}

/**
 * Detect if this is a card request game (like Blackjack) where "play" means "request card"
 */
function isCardRequestGame(rules: GameRules): boolean {
  const { name, description, specialRules, objective } = rules;
  const allText = [name, description, ...(specialRules || []), objective?.description || ''].join(' ').toLowerCase();
  
  // Blackjack-style games
  if (allText.includes('blackjack') || allText.includes('21')) return true;
  if (allText.includes('hit') && allText.includes('stand')) return true;
  if (allText.includes('bust') || allText.includes('over 21')) return true;
  
  return false;
}

/**
 * Prioritize actions based on game theory and common patterns
 */
function prioritizeActions(actions: GameAction[], _gameState: GameState, _rules: GameRules): GameAction[] {
  const priority: Record<string, number> = {
    'play': 10,        // Playing cards is usually the main action
    'call': 9,         // Calling/asking is usually important
    'playToTable': 8,  // Playing to table is important
    'draw': 7,         // Drawing cards is common
    'discard': 6,      // Discarding is often secondary
    'pass': 1,         // Passing is usually last resort
  };

  // Sort by priority, with custom actions getting medium priority (5)
  return [...actions].sort((a, b) => {
    const priorityA = priority[a] || 5;
    const priorityB = priority[b] || 5;
    return priorityB - priorityA;
  });
}

/**
 * Try an action with different card combinations
 */
function tryActionWithCards(
  gameState: GameState, 
  rules: GameRules, 
  botId: string, 
  action: GameAction, 
  bot: any
): { action: GameAction, cardIds?: string[] } | null {
  
  // Actions that don't need cards
  if (['pass', 'draw'].includes(action)) {
    return { action };
  }

  // Play action: smart handling based on game type
  if (action === 'play') {
    if (isCardRequestGame(rules)) {
      // In card request games (like Blackjack), "play" means "hit" - no cards needed
      return { action };
    } else {
      // In regular games, need to find valid card combinations
      const validCardCombinations = findValidCardCombinations(gameState, rules, botId, action, bot.hand);
      
      if (validCardCombinations.length > 0) {
        const bestCombination = selectBestCardCombination(validCardCombinations, gameState, rules, action);
        return { action, cardIds: bestCombination };
      }
    }
  }

  // Actions that need cards - try different combinations
  if (['discard', 'playToTable'].includes(action)) {
    const validCardCombinations = findValidCardCombinations(gameState, rules, botId, action, bot.hand);
    
    if (validCardCombinations.length > 0) {
      // Use smart selection for the best card combination
      const bestCombination = selectBestCardCombination(validCardCombinations, gameState, rules, action);
      return { action, cardIds: bestCombination };
    }
  }

  // Custom actions - try with random cards or no cards based on game type
  if (isCardRequestGame(rules)) {
    // For card request games, most actions don't need cards from hand
    return { action };
  } else {
    // For regular games, try with a random card if available
    const randomCard = bot.hand.length > 0 ? [(bot.hand[0] as any).id] : undefined;
    return { action, cardIds: randomCard };
  }
}

/**
 * Find all valid card combinations for an action using brute force + validation
 */
function findValidCardCombinations(
  gameState: GameState, 
  rules: GameRules, 
  botId: string, 
  action: GameAction, 
  hand: any[]
): string[][] {
  const validCombinations: string[][] = [];

  // Try single cards first (most common)
  for (const card of hand) {
    if (wouldActionBeValid(gameState, rules, botId, action, [card.id])) {
      validCombinations.push([card.id]);
    }
  }

  // Try pairs (for games that need multiple cards)
  if (validCombinations.length === 0 && hand.length > 1) {
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        const combination = [hand[i].id, hand[j].id];
        if (wouldActionBeValid(gameState, rules, botId, action, combination)) {
          validCombinations.push(combination);
        }
      }
    }
  }

  // Try triples, etc. if needed (for complex games)
  if (validCombinations.length === 0 && hand.length > 2) {
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        for (let k = j + 1; k < hand.length; k++) {
          const combination = [hand[i].id, hand[j].id, hand[k].id];
          if (wouldActionBeValid(gameState, rules, botId, action, combination)) {
            validCombinations.push(combination);
          }
        }
      }
    }
  }

  return validCombinations;
}

/**
 * Simulate if an action would be valid (simplified validation)
 */
function wouldActionBeValid(
  gameState: GameState, 
  rules: GameRules, 
  botId: string, 
  action: GameAction, 
  cardIds: string[]
): boolean {
  const player = gameState.players.find(p => p.id === botId);
  if (!player) return false;

  // Check if player has all the cards
  const hasAllCards = cardIds.every(cardId => 
    player.hand.some(card => card.id === cardId)
  );
  if (!hasAllCards) return false;

  // Game-specific validation patterns
  if (rules.id === 'sevens') {
    return validateSevensMove(gameState, cardIds[0]);
  }

  if (rules.id === 'blackjack' || rules.name.toLowerCase().includes('blackjack')) {
    return validateBlackjackMove(gameState, botId, action);
  }

  // For other games, assume it's valid if player has the cards
  return true;
}

/**
 * Select the best card combination using simple heuristics
 */
function selectBestCardCombination(
  combinations: string[][],
  _gameState: GameState,
  _rules: GameRules,
  _action: GameAction
): string[] {
  if (combinations.length === 0) return [];
  
  // For now, prefer single cards over multiple cards
  const singleCards = combinations.filter(combo => combo.length === 1);
  if (singleCards.length > 0) {
    return getRandomElement(singleCards);
  }
  
  return getRandomElement(combinations);
}

/**
 * Game-specific validation helpers
 */
function validateSevensMove(gameState: GameState, cardId: string): boolean {
  const allCards = gameState.players.flatMap(p => p.hand);
  const card = allCards.find(c => c.id === cardId);
  if (!card) return false;

  const table = (gameState as any).table || {};
  const suitCards = table[card.suit] || [];
  
  // Can always play 7s
  if (card.rank === '7') return true;
  
  // Can't play in empty suit
  if (suitCards.length === 0) return false;
  
  // Check if card continues sequence
  const cardValue = getCardNumericValue(card.rank);
  const suitValues = suitCards.map((c: any) => getCardNumericValue(c.rank)).sort((a: number, b: number) => a - b);
  const minValue = Math.min(...suitValues);
  const maxValue = Math.max(...suitValues);
  
  return cardValue === minValue - 1 || cardValue === maxValue + 1;
}

function validateBlackjackMove(gameState: GameState, botId: string, action: GameAction): boolean {
  const handValues = (gameState as any).handValues || {};
  const busted = (gameState as any).busted || {};
  const value = handValues[botId] ?? 0;
  
  if (busted[botId]) return false;
  
  if (action === 'play') return value < 21; // Can hit
  if (action === 'pass') return true; // Can always stand
  
  return true;
}

/**
 * AI-generated move (for future integration with OpenAI)
 */
function getAIGeneratedMove(_gameState: GameState, _rules: GameRules, _botId: string): AIBotMove | null {
  // This is where you'd integrate with OpenAI or another AI service
  // to get context-aware bot moves based on the game rules and state
  // For now, return null to use the universal logic
  return null;
}

/**
 * Validate that an AI-generated move is legal
 */
function validateBotMove(gameState: GameState, rules: GameRules, botId: string, move: AIBotMove): boolean {
  return wouldActionBeValid(gameState, rules, botId, move.action, move.cards || []);
}

/**
 * Utility functions
 */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Helper function for card values (consistent with GameEngine)
 */
function getCardNumericValue(rank: string): number {
  switch (rank) {
    case 'A': return 14; // Aces are high in most games
    case 'K': return 13;
    case 'Q': return 12;
    case 'J': return 11;
    default: return parseInt(rank);
  }
}
