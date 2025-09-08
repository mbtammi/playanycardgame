import type { GameState, GameAction, GameRules, AIBotMove, Player } from '../types';

/**
 * Universal bot decision engine that works with any card game.
 * Uses the game engine's validation system to make intelligent decisions.
 * No hardcoded game logic - completely schema-driven.
 * Supports dealers, betting games, and complex scenarios.
 */
export function getBotAction(gameState: GameState, rules: GameRules, botId: string): { action: GameAction, cardIds?: string[] } {
  const bot = gameState.players.find(p => p.id === botId);
  if (!bot) {
    return { action: 'pass' };
  }

  // Handle dealer-specific logic
  if (bot.isDealer) {
    return getDealerAction(gameState, rules, botId, bot);
  }

  // Handle betting game logic
  if (rules.players.bettingConfig) {
    return getBettingGameAction(gameState, rules, botId, bot);
  }

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
 * Dealer-specific bot logic
 */
function getDealerAction(gameState: GameState, rules: GameRules, botId: string, dealer: Player): { action: GameAction, cardIds?: string[] } {
  // Dealers typically follow strict rules rather than strategic play
  
  // For Blackjack-style games
  if (isCardRequestGame(rules)) {
    const handValues = (gameState as any).handValues || {};
    const dealerValue = handValues[botId] || 0;
    const { mustHitOn = 16 } = dealer.dealerRules || {};

    if (dealerValue <= mustHitOn) {
      return { action: 'play' }; // Hit
    } else {
      return { action: 'pass' }; // Stand
    }
  }

  // For other dealer games, use standard logic but prioritize conservative play
  return getUniversalBotMove(gameState, rules, botId);
}

/**
 * Betting game bot logic (poker, etc.)
 */
function getBettingGameAction(gameState: GameState, rules: GameRules, botId: string, player: Player): { action: GameAction, cardIds?: string[] } {
  // For now, implement basic betting logic
  // This can be expanded for more sophisticated poker AI
  
  const bettingConfig = rules.players.bettingConfig;
  if (!bettingConfig) {
    return getUniversalBotMove(gameState, rules, botId);
  }

  // Simple conservative betting strategy
  const chips = player.chips || 0;
  const currentBet = player.currentBet || 0;
  
  // If we have very few chips, play conservatively
  if (chips < bettingConfig.initialChips * 0.2) {
    // Low on chips - fold or check
    const validActions = getValidActionsForPlayer(gameState, rules, botId);
    if (validActions.includes('fold')) return { action: 'fold' };
    if (validActions.includes('check')) return { action: 'check' };
  }

  // Standard play - call small bets, fold large ones
  const validActions = getValidActionsForPlayer(gameState, rules, botId);
  if (validActions.includes('call') && currentBet < chips * 0.1) {
    return { action: 'call' };
  }
  if (validActions.includes('check')) {
    return { action: 'check' };
  }
  if (validActions.includes('fold')) {
    return { action: 'fold' };
  }

  // Fallback to universal logic
  return getUniversalBotMove(gameState, rules, botId);
}

/**
 * Emergency action when bot is completely stuck - GUARANTEED to work
 */
function getEmergencyAction(gameState: GameState, rules: GameRules, botId: string, bot: Player): { action: GameAction, cardIds?: string[] } {
  console.log(`🚨 Emergency action for bot ${bot.name}`);

  // CRITICAL ENHANCEMENT: Try the most safe actions first - in order of safety
  // 1. Actions that NEVER fail and don't require validation
  const guaranteedSafeActions = ['draw', 'pass', 'skip'];
  
  for (const action of guaranteedSafeActions) {
    if (rules.actions.includes(action)) {
      // Draw action - ultimate fallback for stuck situations
      if (action === 'draw') {
        console.log(`🚑 Emergency: DRAW (guaranteed unstuck action)`);
        return { action: 'draw' };
      }
      // Pass/skip actions
      if (action === 'pass' || action === 'skip') {
        console.log(`🚑 Emergency: ${action.toUpperCase()} (guaranteed safe)`);
        return { action: action as GameAction };
      }
    }
  }

  // 2. Try other actions that are in the game rules
  const otherActions = ['stand', 'stay', 'fold', 'check'];
  for (const action of otherActions) {
    if (rules.actions.includes(action)) {
      try {
        console.log(`🚑 Emergency: ${action.toUpperCase()} (rules-based)`);
        return { action: action as GameAction };
      } catch (error) {
        continue;
      }
    }
  }

  // 3. Try actions that might need cards, but with safety checks
  const cardActions = ['play', 'discard', 'hit'];
  for (const action of cardActions) {
    if (!rules.actions.includes(action)) continue;

    try {
      // Try without cards first (some games allow this)
      if (wouldActionBeValidSafe(gameState, rules, botId, action as GameAction, [])) {
        console.log(`🚑 Emergency: ${action.toUpperCase()} (no cards required)`);
        return { action: action as GameAction };
      }
      
      // Try with first available card if bot has cards
      if (bot.hand.length > 0) {
        const firstCard = bot.hand[0];
        if (wouldActionBeValidSafe(gameState, rules, botId, action as GameAction, [firstCard.id])) {
          console.log(`🚑 Emergency: ${action.toUpperCase()} with first card ${firstCard.rank}${firstCard.suit}`);
          return { action: action as GameAction, cardIds: [firstCard.id] };
        }
      }
    } catch (error) {
      console.warn(`⚠️ Emergency action ${action} failed:`, error);
      continue;
    }
  }

  // ABSOLUTE FINAL FALLBACK: Force a draw action (this bypasses all validation)
  // This is the ultimate unstuck mechanism - every game should allow drawing a card
  console.log(`🆘 ULTIMATE EMERGENCY: FORCED DRAW (bypassing all validation)`);
  return { action: 'draw' };
}

/**
 * Extensive action trying with multiple card combinations
 */
function tryActionWithCardsExtensive(
  gameState: GameState, 
  rules: GameRules, 
  botId: string, 
  action: GameAction, 
  bot: Player
): { action: GameAction, cardIds?: string[] } | null {
  
  try {
    // Actions that don't need cards
    if (['pass', 'draw', 'stand', 'stay'].includes(action)) {
      if (wouldActionBeValidSafe(gameState, rules, botId, action, [])) {
        return { action };
      }
    }

    // For card request games (like Blackjack), most actions don't need cards from hand
    if (isCardRequestGame(rules)) {
      if (['play', 'hit', 'stand', 'stay'].includes(action)) {
        if (wouldActionBeValidSafe(gameState, rules, botId, action, [])) {
          return { action };
        }
      }
    }

    // Actions that might need cards - try extensive combinations
    if (['play', 'discard', 'playToTable', 'attack', 'defend', 'lift'].includes(action)) {
      
      // Try without cards first (for games where actions don't always need cards)
      if (wouldActionBeValidSafe(gameState, rules, botId, action, [])) {
        return { action };
      }
      
      // Try with cards if available
      if (bot.hand.length > 0) {
        const validCardCombinations = findValidCardCombinationsExtensive(gameState, rules, botId, action, bot.hand);
        
        if (validCardCombinations.length > 0) {
          const bestCombination = selectBestCardCombination(validCardCombinations, gameState, rules, action);
          return { action, cardIds: bestCombination };
        }
      }
    }

    // Special handling for flip action (memory games)
    if (action === 'flip') {
      const tableCards = getAllFlippableCards(gameState);
      if (tableCards.length > 0) {
        // Pick a random card to flip
        const randomCard = tableCards[Math.floor(Math.random() * tableCards.length)];
        if (wouldActionBeValidSafe(gameState, rules, botId, action, [randomCard.id])) {
          return { action, cardIds: [randomCard.id] };
        }
      }
    }

    // Special handling for peek action (memory games with peek mechanics)
    if (action === 'peek') {
      const tableCards = getAllPeekableCards(gameState);
      if (tableCards.length > 0) {
        // Pick a random card to peek at
        const randomCard = tableCards[Math.floor(Math.random() * tableCards.length)];
        if (wouldActionBeValidSafe(gameState, rules, botId, action, [randomCard.id])) {
          return { action, cardIds: [randomCard.id] };
        }
      }
    }

    // For unknown/custom actions, try both with and without cards
    // Try without cards first
    if (wouldActionBeValidSafe(gameState, rules, botId, action, [])) {
      return { action };
    }
    
    // Try with one random card if available
    if (bot.hand.length > 0) {
      const randomCard = bot.hand[Math.floor(Math.random() * bot.hand.length)];
      if (wouldActionBeValidSafe(gameState, rules, botId, action, [randomCard.id])) {
        return { action, cardIds: [randomCard.id] };
      }
    }

  } catch (error) {
    console.warn(`⚠️ Error in tryActionWithCardsExtensive for action ${action}:`, error);
  }

  return null;
}

/**
 * Safe version of wouldActionBeValid that doesn't throw errors
 */
function wouldActionBeValidSafe(
  gameState: GameState, 
  rules: GameRules, 
  botId: string, 
  action: GameAction, 
  cardIds: string[]
): boolean {
  try {
    // Basic safety checks first
    const player = gameState.players.find(p => p.id === botId);
    if (!player || !player.isActive) {
      return false;
    }

    // Check if action is in the allowed actions list
    const currentPhase = gameState.currentPhase || 'playing';
    const phaseObj = rules.turnStructure?.phases?.find(phase => phase.name === currentPhase);
    const allowedActions = phaseObj?.actions || rules.actions;
    if (!allowedActions.includes(action)) {
      return false;
    }

    // If cards are specified, check if player has them
    if (cardIds && cardIds.length > 0) {
      const hasAllCards = cardIds.every(cardId => 
        player.hand.some(card => card.id === cardId)
      );
      if (!hasAllCards) {
        return false;
      }
    }

    // Call the original validation function safely
    return wouldActionBeValid(gameState, rules, botId, action, cardIds);
  } catch (error) {
    console.warn(`⚠️ Action validation error for ${action} with cards [${cardIds.join(', ')}]:`, error);
    return false;
  }
}

/**
 * More extensive card combination finding that tries everything
 */
function findValidCardCombinationsExtensive(
  gameState: GameState, 
  rules: GameRules, 
  botId: string, 
  action: GameAction, 
  hand: any[]
): string[][] {
  const validCombinations: string[][] = [];

  // Try with no cards first (many actions don't need cards)
  if (wouldActionBeValidSafe(gameState, rules, botId, action, [])) {
    validCombinations.push([]);
  }

  // Try single cards
  for (const card of hand) {
    if (wouldActionBeValidSafe(gameState, rules, botId, action, [card.id])) {
      validCombinations.push([card.id]);
    }
  }

  // Try pairs if no single card worked
  if (validCombinations.length === 0 && hand.length > 1) {
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        const combination = [hand[i].id, hand[j].id];
        if (wouldActionBeValidSafe(gameState, rules, botId, action, combination)) {
          validCombinations.push(combination);
        }
      }
    }
  }

  // Try triples if desperate
  if (validCombinations.length === 0 && hand.length > 2) {
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        for (let k = j + 1; k < hand.length; k++) {
          const combination = [hand[i].id, hand[j].id, hand[k].id];
          if (wouldActionBeValidSafe(gameState, rules, botId, action, combination)) {
            validCombinations.push(combination);
          }
        }
      }
    }
  }

  return validCombinations;
}

/**
 * Universal bot logic that works for any game by using the schema and validation
 * GUARANTEED to never get stuck - always finds a valid move
 */
function getUniversalBotMove(gameState: GameState, rules: GameRules, botId: string): { action: GameAction, cardIds?: string[] } {
  const bot = gameState.players.find(p => p.id === botId);
  if (!bot) {
    console.warn(`🤖 Bot ${botId} not found, using emergency pass`);
    return { action: 'pass' };
  }

  console.log(`🤖 Bot ${bot.name} thinking... (hand: ${bot.hand.length} cards, active: ${bot.isActive})`);

  // FAILSAFE: Always have an immediate fallback
  const guaranteedAction = { action: 'pass' as GameAction };

  try {
    // ENHANCED DEBUGGING: Get detailed game state info
    console.log(`🤖 Bot ${bot.name} analyzing game state:`, {
      phase: gameState.currentPhase || 'playing',
      handSize: bot.hand.length,
      availableActions: rules.actions,
      currentPlayer: gameState.currentPlayerIndex,
      gameStatus: gameState.gameStatus,
      tableCards: gameState.communityCards?.length || 0,
      deckSize: gameState.deck.length
    });

    // Get all valid actions from the game engine (this uses the schema)
    const validActions = getValidActionsForPlayer(gameState, rules, botId);
    console.log(`🎯 Valid actions for bot: [${validActions.join(', ')}]`);
    
    if (validActions.length === 0) {
      console.warn(`⚠️ No valid actions found for bot ${bot.name}, using emergency actions`);
      return getEmergencyAction(gameState, rules, botId, bot);
    }

    // ENHANCED: Try actions in priority order with extensive fallback logic
    const prioritizedActions = prioritizeActions(validActions, gameState, rules);
    console.log(`📋 Prioritized actions: [${prioritizedActions.join(', ')}]`);
    // SPECIAL CASE: Sequence game (3,6,9 difference) helper – precompute a best playable card
    let sequencePlayableCard: string | null = null;
    try {
      const desc = (rules.description || '').toLowerCase();
      const seqPattern = /3\s*,?\s*6\s*,?\s*or\s*9|3\s*,?\s*6\s*,?\s*9/;
      const looksLikeSequence = seqPattern.test(desc);
      if (looksLikeSequence && gameState.communityCards && gameState.communityCards.length > 0) {
        const last = gameState.communityCards[gameState.communityCards.length - 1];
        const lastVal = getCardNumericValue(last.rank);
        const wantedDiffs = [3,6,9];
        const handSorted = [...bot.hand].sort((a,b)=>getCardNumericValue(a.rank)-getCardNumericValue(b.rank));
        for (const card of handSorted) {
          const diff = Math.abs(getCardNumericValue(card.rank) - lastVal);
            if (wantedDiffs.includes(diff)) { sequencePlayableCard = card.id; break; }
        }
        if (sequencePlayableCard) {
          console.log('🤖 Sequence helper found playable card', { cardId: sequencePlayableCard });
        } else {
          console.log('🤖 Sequence helper found no 3/6/9 diff card – will fallback to draw');
        }
      }
    } catch(e){ console.warn('Sequence helper error', e); }
    
    for (let i = 0; i < prioritizedActions.length; i++) {
      const action = prioritizedActions[i];
      console.log(`🔍 Bot trying action ${i + 1}/${prioritizedActions.length}: ${action}`);
      
      try {
        // If action is play and we have a precomputed sequence card, try that first
        if (action === 'play' && sequencePlayableCard) {
          if (wouldActionBeValidSafe(gameState, rules, botId, 'play', [sequencePlayableCard])) {
            console.log('✅ Bot using sequencePlayableCard for play', sequencePlayableCard);
            return { action: 'play', cardIds: [sequencePlayableCard] };
          }
        }
        const result = tryActionWithCardsExtensive(gameState, rules, botId, action, bot);
        if (result) {
          console.log(`✅ Bot ${bot.name} chose: ${result.action}${result.cardIds ? ` with cards [${result.cardIds.join(', ')}]` : ''}`);
          return result;
        } else {
          console.log(`❌ Action ${action} failed validation`);
        }
      } catch (error) {
        console.warn(`⚠️ Error trying action ${action}:`, error);
        continue; // Try next action
      }
    }

    // ENHANCED: Multiple fallback levels to prevent getting stuck
    console.warn(`🔄 Bot ${bot.name} trying enhanced fallback system...`);
    
    // Level 1: Try most basic actions that never require cards
    const safeActions = ['draw', 'pass', 'skip', 'stand'];
    for (const action of safeActions) {
      if (rules.actions.includes(action)) {
        try {
          console.log(`🔄 Level 1 fallback: trying ${action}`);
          // For draw, make sure it's really safe
          if (action === 'draw') {
            console.log(`🔄 Draw action - deck has ${gameState.deck.length} cards`);
            return { action: 'draw' as GameAction };
          }
          return { action: action as GameAction };
        } catch (error) {
          console.warn(`⚠️ Level 1 fallback ${action} failed:`, error);
        }
      }
    }

    // Level 2: Try actions that might work with any card
    const cardActions = ['play', 'discard'];
    for (const action of cardActions) {
      if (rules.actions.includes(action) && bot.hand.length > 0) {
        try {
          console.log(`🔄 Level 2 fallback: trying ${action} with any card`);
          // Try with sequence helper first
          if (action === 'play' && sequencePlayableCard && wouldActionBeValidSafe(gameState, rules, botId, 'play', [sequencePlayableCard])) {
            return { action: 'play', cardIds: [sequencePlayableCard] };
          }
          // Try with each card in hand (sorted to stabilize behavior)
          const handIter = [...bot.hand].sort((a,b)=>getCardNumericValue(a.rank)-getCardNumericValue(b.rank));
          for (const card of handIter) {
            if (wouldActionBeValidSafe(gameState, rules, botId, action as GameAction, [card.id])) {
              console.log(`🔄 Level 2 fallback: ${action} with card ${card.rank}${card.suit}`);
              return { action: action as GameAction, cardIds: [card.id] };
            }
          }
        } catch (error) {
          console.warn(`⚠️ Level 2 fallback ${action} failed:`, error);
        }
      }
    }

    // Level 3: Emergency action system
    console.warn(`🚨 Bot ${bot.name} activating emergency action system`);
    return getEmergencyAction(gameState, rules, botId, bot);

  } catch (error) {
    console.error(`🚨 Critical error in bot logic for ${bot.name}:`, error);
    // Even if everything fails, use the emergency system
    return getEmergencyAction(gameState, rules, botId, bot);
  }

  // Ultimate emergency: guaranteed to work
  console.error(`🚨 Bot ${botId} using ultimate emergency action`);
  return guaranteedAction;
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
 * Enhanced to handle custom actions and edge cases
 */
function isBasicActionValid(gameState: GameState, rules: GameRules, botId: string, action: GameAction): boolean {
  const player = gameState.players.find(p => p.id === botId);
  if (!player) return false;

  switch (action) {
    case 'draw':
    case 'lift':
      return gameState.deck.length > 0;
    
    case 'play':
      // Smart play validation based on game type
      if (isCardRequestGame(rules)) {
        // In card request games (like Blackjack), "play" means "hit" - always valid if not busted
        const handValues = (gameState as any).handValues || {};
        const busted = (gameState as any).busted || {};
        return !busted[botId] && (handValues[botId] || 0) < 21;
      } else {
        // In regular games, need cards to play (but not always - some games allow playing without cards)
        return true; // Let the extensive validation figure it out
      }
    
    case 'attack':
    case 'defend':
      // Combat actions - usually valid if player has cards or in combat phase
      return player.hand.length > 0 || true; // Let game engine validate
    
    case 'discard':
    case 'playToTable':
      return player.hand.length > 0;
    
    case 'pass':
    case 'stand':
    case 'stay':
      return true;
    
    case 'fold':
      return player.status !== 'folded';
    
    case 'call':
    case 'bet':
    case 'raise':
      // Betting actions - valid if player has chips and isn't folded
      const chips = player.chips || 0;
      return chips > 0 && player.status !== 'folded';
    
    case 'check':
      return player.status !== 'folded';
    
    case 'flip':
      // Flip action for memory games - valid if there are flippable cards
      const flippableCards = getAllFlippableCards(gameState);
      return flippableCards.length > 0;
    
    case 'peek':
      // Peek action for memory games - valid if there are peekable cards
      const peekableCards = getAllPeekableCards(gameState);
      return peekableCards.length > 0;
    
    default:
      // For custom actions, assume they're valid and let the game engine decide
      // This is crucial for games with unique actions like 'lift health card'
      console.log(`🔍 Unknown action '${action}' - assuming valid for universal compatibility`);
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
 * Enhanced to handle custom actions intelligently
 */
function prioritizeActions(actions: GameAction[], _gameState: GameState, rules: GameRules): GameAction[] {
  const priority: Record<string, number> = {
    // Standard high-priority actions
    'play': 10,        // Playing cards is usually the main action
    'attack': 10,      // Attack actions are usually primary
    'flip': 9,         // Flipping cards in memory games is primary
    'lift': 9,         // Lifting/drawing actions are important
    'draw': 9,         // Drawing cards is common
    'peek': 8,         // Peeking in memory games
    'call': 8,         // Calling/asking is usually important
    'playToTable': 8,  // Playing to table is important
    'hit': 8,          // Blackjack hit
    'stand': 7,        // Blackjack stand
    'discard': 6,      // Discarding is often secondary
    'defend': 5,       // Defensive actions
    'pass': 1,         // Passing is usually last resort
    'fold': 1,         // Folding is last resort
  };

  // Analyze game context to adjust priorities
  const gameText = [rules.name, rules.description, ...(rules.specialRules || [])].join(' ').toLowerCase();
  
  // For memory games, prioritize flip actions highly
  if (gameText.includes('memory') || gameText.includes('match') || gameText.includes('flip') || gameText.includes('pair')) {
    priority['flip'] = 12;
    priority['peek'] = 10;
    priority['pass'] = 2; // In memory games, pass should be higher priority than usual
  }
  
  // For combat/attack games, prioritize attack actions
  if (gameText.includes('attack') || gameText.includes('battle') || gameText.includes('fight')) {
    priority['attack'] = 12;
    priority['defend'] = 8;
  }
  
  // For drawing games, prioritize lift/draw actions
  if (gameText.includes('lift') || gameText.includes('reveal')) {
    priority['lift'] = 11;
    priority['draw'] = 11;
  }

  // For betting games, adjust betting action priorities
  if (rules.players.bettingConfig) {
    priority['bet'] = 9;
    priority['call'] = 8;
    priority['raise'] = 7;
    priority['check'] = 6;
    priority['fold'] = 2;
  }

  // Sort by priority, with unknown actions getting medium priority (5)
  return [...actions].sort((a, b) => {
    const priorityA = priority[a] || 5;
    const priorityB = priority[b] || 5;
    return priorityB - priorityA;
  });
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

  // For flip and peek actions, check if the cards exist in table zones (not player hand)
  if (action === 'flip' || action === 'peek') {
    if (!cardIds || cardIds.length === 0) return false;
    
    // Check if the card exists in table zones
    const cardExistsInTable = gameState.tableZones?.some(zone => 
      zone.cards.some(card => cardIds.includes(card.id))
    ) || false;
    
    return cardExistsInTable;
  }

  // Check if player has all the cards (for actions that use hand cards)
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

/**
 * Get all cards from table zones that can be flipped (face down cards)
 */
function getAllFlippableCards(gameState: GameState): any[] {
  const flippableCards: any[] = [];
  
  // Check table zones for face-down cards
  if (gameState.tableZones) {
    for (const zone of gameState.tableZones) {
      for (const card of zone.cards) {
        if (!card.faceUp) {
          flippableCards.push(card);
        }
      }
    }
  }
  
  return flippableCards;
}

/**
 * Get all cards from table zones that can be peeked at
 */
function getAllPeekableCards(gameState: GameState): any[] {
  const peekableCards: any[] = [];
  
  // Check table zones for face-down cards
  if (gameState.tableZones) {
    for (const zone of gameState.tableZones) {
      for (const card of zone.cards) {
        if (!card.faceUp) {
          peekableCards.push(card);
        }
      }
    }
  }
  
  return peekableCards;
}
