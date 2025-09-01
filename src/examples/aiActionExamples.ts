/**
 * Example: How AI could generate custom actions for your games
 * This demonstrates how the template system could work with your UI
 */

import { GameEngine } from '../engine/gameEngine';
import type { GameRules } from '../types';

// Example: User wants to create "switch cards with opponent" action
async function createSwitchCardsAction(engine: GameEngine, apiKey: string) {
  // User describes what they want
  const userInput = "I want an action where I can switch cards with my opponent without us implementing them in code";
  
  // AI generates the action template (safe, no code execution)
  const template = await engine.generateCustomAction(
    'switch_cards',
    userInput,
    apiKey
  );
  
  if (template) {
    console.log('Generated action:', template);
    // The action is now available for use in the game!
    // Players can use "switch_cards" action in their games
  }
}

// Example: How this would work in a game
async function demonstrateAIActions() {
  // Create a game with AI actions enabled
  const rules: GameRules = {
    id: 'ai-enhanced-game',
    name: 'AI Enhanced Card Game',
    description: 'A game with AI-generated custom actions',
    players: { min: 2, max: 4, recommended: 2 },
    setup: { cardsPerPlayer: 7, deckSize: 52 },
    objective: { type: 'empty_hand', description: 'First to empty hand wins' },
    turnStructure: {
      order: 'clockwise',
      phases: [{ name: 'playing', required: true, actions: ['play', 'draw', 'switch_cards', 'steal_card', 'peek_cards'] }]
    },
    actions: ['play', 'draw', 'switch_cards', 'steal_card', 'peek_cards'],
    winConditions: [{ type: 'first_to_empty', description: 'Empty your hand' }]
  };
  
  const engine = new GameEngine(rules);
  
  // Initialize AI actions (this would happen during game setup)
  // engine.initializeAIActions(process.env.OPENAI_API_KEY);
  
  // Add players
  engine.addPlayer('Player 1', 'human');
  engine.addPlayer('Player 2', 'bot');
  
  // Start game
  engine.startGame();
  
  // Now players can use AI-generated actions!
  // When player selects "switch_cards" action:
  try {
    const result = engine.executeAction(
      'player-1',
      'switch_cards', // AI-generated action
      ['card-id-123'], // selected card
      'player-2' // target opponent
    );
    
    console.log('Action result:', result.message);
    // Would output something like: "Player 1 switched 7 of hearts with Player 2's King of spades"
  } catch (error) {
    console.error('Action failed:', error);
  }
}

// Example: What the AI might generate for different requests
const exampleAIGeneratedActions = {
  "Mirror Hand": {
    description: "Copy opponent's hand",
    effects: [
      { type: "peek_card", source: "opponent_hand", amount: "all" },
      { type: "copy_card", source: "opponent_hand", target: "hand", amount: 1 }
    ]
  },
  
  "Card Sacrifice": {
    description: "Discard 2 cards to draw 3",
    effects: [
      { type: "discard_cards", source: "hand", amount: 2 },
      { type: "draw_cards", source: "deck", amount: 3 }
    ]
  },
  
  "Chaos Shuffle": {
    description: "All players shuffle their hands together and redeal",
    effects: [
      { type: "collect_all_hands", target: "community" },
      { type: "shuffle_deck", source: "community" },
      { type: "redeal_cards", amount: "original_count" }
    ]
  },
  
  "Time Thief": {
    description: "Skip opponent's next turn",
    effects: [
      { type: "skip_turn", target: "opponent" },
      { type: "extra_turn", target: "self" }
    ]
  }
};

export { createSwitchCardsAction, demonstrateAIActions, exampleAIGeneratedActions };
