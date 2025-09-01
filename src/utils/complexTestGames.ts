/**
 * Complex test games demonstrating AI-generated actions with multiple effects
 * These show how templates can create sophisticated gameplay without code generation
 */

import type { GameRules } from '../types';
import type { ActionTemplate } from '../engine/aiActionTemplateEngine';

// ===== GAME 1: CARD THIEF (Complex Stealing Mechanics) =====
export const cardThiefGame: GameRules = {
  id: 'card-thief',
  name: 'Card Thief: Master of Deception',
  description: 'A strategic game where you steal, swap, and manipulate cards using complex AI-generated actions. Use cunning tactics to empty your hand first!',
  
  players: { min: 2, max: 4, recommended: 3 },
  setup: { cardsPerPlayer: 7, deckSize: 52 },
  objective: { type: 'empty_hand', description: 'Be the first to empty your hand using theft and trickery' },
  
  turnStructure: {
    order: 'clockwise',
    phases: [{ 
      name: 'action_phase', 
      required: true, 
      actions: ['play', 'steal_and_draw', 'double_trouble', 'card_sacrifice', 'phantom_swap'] 
    }]
  },
  
  actions: ['play', 'steal_and_draw', 'double_trouble', 'card_sacrifice', 'phantom_swap'],
  winConditions: [{ type: 'first_to_empty', description: 'Empty your hand using any means necessary' }],
  
  specialRules: [
    'Each turn you can either play cards normally OR use a special thief action',
    'Thief actions have powerful effects but may require sacrificing cards',
    'Some actions target specific opponents, others affect all players',
    'The deck refills from discard pile when empty'
  ]
};

// ===== GAME 2: CHAOS WARS (Multi-Effect Combat) =====
export const chaosWarsGame: GameRules = {
  id: 'chaos-wars',
  name: 'Chaos Wars: Battlefield of Cards',
  description: 'An intense card battle where every action creates chaos! Chain multiple effects together for devastating combinations.',
  
  players: { min: 2, max: 4, recommended: 2 },
  setup: { cardsPerPlayer: 6, deckSize: 52 },
  objective: { type: 'custom', description: 'Survive the chaos and maintain the highest score' },
  
  turnStructure: {
    order: 'clockwise',
    phases: [
      { name: 'chaos_phase', required: true, actions: ['chaos_strike', 'time_warp', 'card_storm'] },
      { name: 'recovery_phase', required: false, actions: ['draw', 'play'] }
    ]
  },
  
  actions: ['play', 'draw', 'chaos_strike', 'time_warp', 'card_storm'],
  winConditions: [{ type: 'highest_score', description: 'Highest score after 10 rounds wins' }],
  
  specialRules: [
    'Each chaos action affects multiple players',
    'Actions can chain together for powerful combos',
    'Some actions give extra turns, others skip turns',
    'Score is calculated from cards remaining + special bonuses'
  ]
};

// ===== GAME 3: MEMORY PALACE DELUXE (Complex Multi-Phase) =====
export const memoryPalaceDeluxe: GameRules = {
  id: 'memory-palace-deluxe',
  name: 'Memory Palace Deluxe: Mind Games',
  description: 'A sophisticated memory game with AI-powered peek, reveal, and memory manipulation actions. Master the art of information warfare!',
  
  players: { min: 2, max: 4, recommended: 3 },
  setup: { 
    cardsPerPlayer: 5, 
    deckSize: 52,
    tableLayout: {
      type: 'grid',
      allowFlexiblePlacement: true,
      zones: [
        { id: 'memory_grid', type: 'grid', initialCards: 16, faceDown: true },
        { id: 'revelation_pile', type: 'pile', initialCards: 0 },
        { id: 'mind_vault', type: 'pile', initialCards: 0, faceDown: true }
      ]
    }
  },
  objective: { type: 'highest_score', description: 'Score points through memory matches and mind tricks' },
  
  turnStructure: {
    order: 'clockwise',
    phases: [
      { name: 'peek_phase', required: true, actions: ['mind_read', 'future_sight', 'memory_steal'] },
      { name: 'action_phase', required: true, actions: ['flip', 'play', 'revelation_combo'] },
      { name: 'memory_phase', required: false, actions: ['memory_bank', 'forget_spell'] }
    ]
  },
  
  actions: ['flip', 'play', 'mind_read', 'future_sight', 'memory_steal', 'revelation_combo', 'memory_bank', 'forget_spell'],
  winConditions: [{ type: 'highest_score', description: 'Most points from matches and mind games' }],
  
  specialRules: [
    'Grid cards are face-down and can be flipped to find matches',
    'AI actions let you peek at opponent hands and grid cards',
    'Some actions manipulate what others can remember',
    'Complex scoring based on matches, peeks, and mind tricks'
  ]
};

// ===== COMPLEX AI ACTION TEMPLATES =====

// Template 1: Steal and Draw (Multi-effect)
export const stealAndDrawTemplate: ActionTemplate = {
  id: 'steal_and_draw',
  name: 'Thief\'s Gambit',
  description: 'Steal a random card from opponent, then draw one from deck, then discard your lowest card',
  parameters: [],
  effects: [
    {
      type: 'steal_card',
      source: 'opponent_hand',
      target: 'hand',
      amount: 'random',
      message: 'Stole a card from opponent!'
    },
    {
      type: 'draw_cards',
      source: 'deck', 
      target: 'hand',
      amount: 1,
      message: 'Drew a card from deck!'
    },
    {
      type: 'discard_cards',
      source: 'hand',
      target: 'discard',
      amount: 1,
      cardFilter: { minValue: 1, maxValue: 5 }, // Discard low-value cards
      message: 'Discarded lowest card!'
    }
  ],
  conditions: [
    { type: 'hand_size', operator: 'greater', value: 0, target: 'opponent' },
    { type: 'hand_size', operator: 'greater', value: 0, target: 'self' }
  ],
  requiresCards: false,
  targetType: 'opponent'
};

// Template 2: Double Trouble (Multi-target)
export const doubleTroubleTemplate: ActionTemplate = {
  id: 'double_trouble',
  name: 'Double Trouble',
  description: 'Force all opponents to discard a card, then you draw two cards and peek at one opponent\'s hand',
  parameters: [],
  effects: [
    {
      type: 'discard_cards',
      source: 'opponent_hand',
      target: 'discard',
      amount: 1,
      message: 'All opponents discard a card!'
    },
    {
      type: 'draw_cards',
      source: 'deck',
      target: 'hand',
      amount: 2,
      message: 'You draw 2 cards!'
    },
    {
      type: 'peek_card',
      source: 'opponent_hand',
      amount: 3,
      message: 'You peek at opponent\'s hand!'
    }
  ],
  conditions: [],
  requiresCards: false,
  targetType: 'all'
};

// Template 3: Card Sacrifice (Risk/Reward)
export const cardSacrificeTemplate: ActionTemplate = {
  id: 'card_sacrifice',
  name: 'Blood Sacrifice',
  description: 'Discard 2 cards to steal 2 random cards from different opponents and gain 5 points',
  parameters: [],
  effects: [
    {
      type: 'discard_cards',
      source: 'hand',
      target: 'discard',
      amount: 2,
      message: 'Sacrificed 2 cards!'
    },
    {
      type: 'steal_card',
      source: 'opponent_hand',
      target: 'hand',
      amount: 1,
      message: 'Stole card from first opponent!'
    },
    {
      type: 'steal_card',
      source: 'opponent_hand',
      target: 'hand',
      amount: 1,
      message: 'Stole card from second opponent!'
    },
    {
      type: 'modify_score',
      amount: 5,
      message: 'Gained 5 bonus points!'
    }
  ],
  conditions: [
    { type: 'hand_size', operator: 'greater', value: 1, target: 'self' }
  ],
  requiresCards: true,
  targetType: 'all'
};

// Template 4: Phantom Swap (Complex Manipulation)
export const phantomSwapTemplate: ActionTemplate = {
  id: 'phantom_swap',
  name: 'Phantom Swap',
  description: 'Secretly swap a card with opponent, then both of you draw a card, then peek at the deck',
  parameters: [],
  effects: [
    {
      type: 'swap_cards',
      source: 'hand',
      target: 'opponent_hand',
      amount: 1,
      message: 'Secretly swapped cards!'
    },
    {
      type: 'draw_cards',
      source: 'deck',
      target: 'hand',
      amount: 1,
      message: 'You both draw a card!'
    },
    {
      type: 'peek_card',
      source: 'deck',
      amount: 3,
      message: 'You peek at the top 3 deck cards!'
    }
  ],
  conditions: [
    { type: 'hand_size', operator: 'greater', value: 0, target: 'self' },
    { type: 'hand_size', operator: 'greater', value: 0, target: 'opponent' }
  ],
  requiresCards: true,
  targetType: 'opponent'
};

// Template 5: Chaos Strike (Ultimate Multi-Effect)
export const chaosStrikeTemplate: ActionTemplate = {
  id: 'chaos_strike',
  name: 'Chaos Strike',
  description: 'Unleash chaos: steal from all opponents, shuffle the deck, everyone discards one, then you draw three',
  parameters: [],
  effects: [
    {
      type: 'steal_card',
      source: 'opponent_hand',
      target: 'hand',
      amount: 1,
      message: 'Stole from all opponents!'
    },
    {
      type: 'shuffle_deck',
      message: 'Deck shuffled in chaos!'
    },
    {
      type: 'discard_cards',
      source: 'opponent_hand',
      target: 'discard',
      amount: 1,
      message: 'Everyone discards!'
    },
    {
      type: 'discard_cards',
      source: 'hand',
      target: 'discard',
      amount: 1,
      message: 'You also discard!'
    },
    {
      type: 'draw_cards',
      source: 'deck',
      target: 'hand',
      amount: 3,
      message: 'You draw 3 from the chaos!'
    }
  ],
  conditions: [],
  requiresCards: true,
  targetType: 'all'
};

// Template 6: Time Warp (Turn Manipulation)
export const timeWarpTemplate: ActionTemplate = {
  id: 'time_warp',
  name: 'Time Warp',
  description: 'Skip all other players\' next turn, you get an extra turn, and peek at everyone\'s hand',
  parameters: [],
  effects: [
    {
      type: 'skip_turn',
      target: 'opponent_hand',
      message: 'All opponents skip their next turn!'
    },
    {
      type: 'extra_turn',
      message: 'You get an extra turn!'
    },
    {
      type: 'peek_card',
      source: 'opponent_hand',
      amount: 'all',
      message: 'You see everyone\'s cards!'
    }
  ],
  conditions: [],
  requiresCards: false,
  targetType: 'all'
};

// Export all templates for easy registration
export const complexActionTemplates = [
  stealAndDrawTemplate,
  doubleTroubleTemplate,
  cardSacrificeTemplate,
  phantomSwapTemplate,
  chaosStrikeTemplate,
  timeWarpTemplate
];

// Export all games for easy testing
export const complexTestGames = [
  cardThiefGame,
  chaosWarsGame,
  memoryPalaceDeluxe
];
