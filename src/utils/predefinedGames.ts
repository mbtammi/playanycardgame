import type { PredefinedGame, GameRules } from '../types';
import { sevensGame } from './predefinedSevens';

// Go Fish Rules
const goFishRules: GameRules = {
  id: 'go-fish',
  name: 'Go Fish',
  description: 'Classic card matching game where players collect books of four matching cards.',
  players: {
    min: 2,
    max: 6,
    recommended: 4,
  },
  setup: {
    cardsPerPlayer: 7,
    deckSize: 52,
  },
  objective: {
    type: 'collect_sets',
    description: 'Collect the most books (sets of 4 matching ranks)',
  },
  turnStructure: {
    order: 'clockwise',
    phases: [
      {
        name: 'ask',
        required: true,
        actions: ['call'],
      },
      {
        name: 'draw',
        required: false,
        actions: ['draw'],
      },
    ],
  },
  actions: ['call', 'draw', 'reveal'],
  winConditions: [
    {
      type: 'highest_score',
      description: 'Player with most books when all cards are collected',
    },
  ],
  specialRules: [
    'Ask other players for cards of a specific rank',
    'If they have matching cards, they must give them all to you',
    'If not, they say "Go Fish" and you draw from the deck',
    'When you collect 4 of a kind, place them down as a book',
  ],
};

// Crazy 8s Rules
const crazy8sRules: GameRules = {
  id: 'crazy-8s',
  name: 'Crazy 8s',
  description: 'Fast-paced game where players match suits or ranks to empty their hand first.',
  players: {
    min: 2,
    max: 7,
    recommended: 4,
  },
  setup: {
    cardsPerPlayer: 7,
    deckSize: 52,
  },
  objective: {
    type: 'empty_hand',
    description: 'Be the first player to play all cards from your hand',
  },
  turnStructure: {
    order: 'clockwise',
    phases: [
      {
        name: 'play',
        required: true,
        actions: ['play', 'draw'],
      },
    ],
  },
  actions: ['play', 'draw'],
  winConditions: [
    {
      type: 'first_to_empty',
      description: 'First player to empty their hand wins',
    },
  ],
  specialRules: [
    'Match the top discard pile card by suit or rank',
    '8s are wild and can be played anytime',
    'When playing an 8, declare the new suit',
    'If you cannot play, draw cards until you can',
    'Score points based on cards remaining in opponents\' hands',
  ],
};

// Blackjack Rules
const blackjackRules: GameRules = {
  id: 'blackjack',
  name: 'Blackjack',
  description: 'Get as close to 21 as possible without going over.',
  players: {
    min: 1,
    max: 6,
    recommended: 3,
  },
  setup: {
    cardsPerPlayer: 2,
    deckSize: 52,
  },
  objective: {
    type: 'highest_score',
    description: 'Get a hand value as close to 21 as possible without exceeding it',
    target: 21,
  },
  turnStructure: {
    order: 'clockwise',
    phases: [
      {
        name: 'decision',
        required: true,
        actions: ['play', 'pass'],
      },
    ],
  },
  actions: ['play', 'pass'], // 'play' represents hit, 'pass' represents stand
  winConditions: [
    {
      type: 'highest_score',
      description: 'Closest to 21 without going over',
      target: 21,
    },
  ],
  specialRules: [
    'Aces can be worth 1 or 11',
    'Face cards (J, Q, K) are worth 10',
    'If your hand exceeds 21, you bust and lose',
    'Blackjack (21 with first 2 cards) beats regular 21',
  ],
};

// War Rules
const warRules: GameRules = {
  id: 'war',
  name: 'War',
  description: 'Simple battle game where highest card wins.',
  players: {
    min: 2,
    max: 4,
    recommended: 2,
  },
  setup: {
    cardsPerPlayer: 26, // For 2 players
    deckSize: 52,
  },
  objective: {
    type: 'collect_sets',
    description: 'Capture all the cards',
  },
  turnStructure: {
    order: 'clockwise',
    phases: [
      {
        name: 'battle',
        required: true,
        actions: ['play'],
      },
    ],
  },
  actions: ['play'],
  winConditions: [
    {
      type: 'specific_cards',
      description: 'Collect all cards in the deck',
    },
  ],
  specialRules: [
    'Each player plays their top card simultaneously',
    'Highest card wins all played cards',
    'On ties, players place 3 cards down and flip the 4th',
    'Winner of tie breaker takes all cards in play',
  ],
};

// Black Card Challenge - Test game for custom win conditions
const blackCardRules: GameRules = {
  id: 'black-card-challenge',
  name: 'Black Card Challenge',
  description: 'Draw cards from the deck. If you draw a black card (clubs or spades), you win!',
  players: {
    min: 1,
    max: 1,
    recommended: 1,
  },
  setup: {
    cardsPerPlayer: 0,
    deckSize: 52,
    keepDrawnCard: false, // Cards go to discard pile so we can see them
  },
  objective: {
    type: 'custom',
    description: 'Draw a black card to win',
  },
  turnStructure: {
    order: 'clockwise',
    phases: [
      {
        name: 'playing',
        required: true,
        actions: ['draw'],
      },
    ],
  },
  actions: ['draw'],
  winConditions: [
    {
      type: 'custom',
      description: 'I will lift cards from the deck, if the card is black I will win.',
    },
  ],
  specialRules: [
    'Draw cards one at a time from the deck',
    'If you draw a black card (clubs ♣ or spades ♠), you win immediately!',
    'Red cards (hearts ♥ or diamonds ♦) continue the game',
  ],
};

// Fresh Start Rules (demonstrates asymmetric dealing)
const freshStartRules: GameRules = {
  id: 'fresh-start',
  name: 'Fresh Start',
  description: '4 players, first player gets 3 cards, others get 7. Play cards in sequence, use 9s and 10s to clear the table.',
  players: {
    min: 4,
    max: 4,
    recommended: 4,
  },
  setup: {
    cardsPerPlayer: 0, // Ignored when cardsPerPlayerPosition is provided
    cardsPerPlayerPosition: [3, 7, 7, 7], // Player 0 gets 3 cards, others get 7
    deckSize: 52,
  },
  objective: {
    type: 'custom',
    description: 'Be the first to empty your hand using strategic play and 9/10 special powers',
  },
  turnStructure: {
    order: 'clockwise',
    phases: [
      {
        name: 'playing',
        required: true,
        actions: ['play', 'discard', 'pass'],
      },
    ],
  },
  actions: ['play', 'discard', 'pass'],
  winConditions: [
    {
      type: 'first_to_empty',
      description: 'First player to empty their hand wins',
    },
  ],
  specialRules: [
    'Player with smallest card starts (Ace is smallest, King is highest)',
    'Playing a 9 or 10 allows you to discard all cards on the table and start fresh with any card',
    'First player starts with only 3 cards while others get 7',
  ],
};

export const predefinedGames: PredefinedGame[] = [
  {
    id: 'go-fish',
    name: 'Go Fish',
    description: 'Classic card matching game for all ages',
    thumbnail: '🐠',
    difficulty: 'easy',
    playerCount: '2-6 players',
    duration: '15-30 min',
    rules: goFishRules,
    featured: true,
  },
  {
    id: 'crazy-8s',
    name: 'Crazy 8s',
    description: 'Fast-paced shedding game with wild cards',
    thumbnail: '🎯',
    difficulty: 'easy',
    playerCount: '2-7 players',
    duration: '10-20 min',
    rules: crazy8sRules,
    featured: true,
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'The classic casino game of 21',
    thumbnail: '♠️',
    difficulty: 'medium',
    playerCount: '1-6 players',
    duration: '5-15 min',
    rules: blackjackRules,
    featured: true,
  },
  {
    id: 'war',
    name: 'War',
    description: 'Simple battle game for all ages',
    thumbnail: '⚔️',
    difficulty: 'easy',
    playerCount: '2-4 players',
    duration: '10-30 min',
    rules: warRules,
  },
  {
    id: 'black-card-challenge',
    name: 'Black Card Challenge',
    description: 'Draw cards until you get a black card to win!',
    thumbnail: '🃏',
    difficulty: 'easy',
    playerCount: '1 player',
    duration: '5-10 min',
    rules: blackCardRules,
  },
  {
    id: 'fresh-start',
    name: 'Fresh Start',
    description: 'Asymmetric dealing with special card powers',
    thumbnail: '🔄',
    difficulty: 'medium',
    playerCount: '4 players',
    duration: '20-30 min',
    rules: freshStartRules,
    featured: true,
  },
  sevensGame,
];

// Helper function to get a game by ID
export const getGameById = (id: string): PredefinedGame | undefined => {
  return predefinedGames.find(game => game.id === id);
};

// Helper function to get featured games
export const getFeaturedGames = (): PredefinedGame[] => {
  return predefinedGames.filter(game => game.featured);
};

// Helper function to get games by difficulty
export const getGamesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): PredefinedGame[] => {
  return predefinedGames.filter(game => game.difficulty === difficulty);
};
