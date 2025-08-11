import type { GameRules, PredefinedGame } from '../types';

const sevensRules: GameRules = {
  id: 'sevens',
  name: 'Sevens',
  description: 'Be the first to play all your cards by building up and down from the 7s in each suit.',
  players: {
    min: 3,
    max: 8,
    recommended: 4,
  },
  setup: {
    cardsPerPlayer: 0, // Special value: deal all cards evenly among players
    deckSize: 52,
  },
  objective: {
    type: 'empty_hand',
    description: 'Be the first player to play all your cards.',
  },
  turnStructure: {
    order: 'clockwise',
    phases: [
      {
        name: 'play',
        required: true,
        actions: ['play', 'pass'],
      },
    ],
  },
  actions: ['play', 'pass'],
  winConditions: [
    {
      type: 'first_to_empty',
      description: 'First player to empty their hand wins.',
    },
  ],
  specialRules: [
    'The player with the 7 of diamonds starts by playing it to the center.',
    'Players can only play a 7 or build up/down from a 7 in the same suit (e.g., 6♠, 8♠, etc.). But number 6 must be played before 8.',
    'After the first 7 of diamonds is played, the next player can play a 7 of any suit.',
    'After playing the final card, being 2 or Ace you can play another card if you can play it.',
    'If you cannot play, you must pass.',
    'You cannot pass if you have a legal move.',
    'Aces are high.',
    'Play continues until one player runs out of cards.',
    'Scoring: Each losing player gets 1 point per card left in hand.',
    'Lowest score after a set number of rounds wins the session.'
  ],
};

export const sevensGame: PredefinedGame = {
  id: 'sevens',
  name: 'Sevens',
  description: 'Classic build-up card game. Play all your cards by building from the 7s!',
  thumbnail: '7♦️',
  difficulty: 'medium',
  playerCount: '3-8 players',
  duration: '15-30 min',
  rules: sevensRules,
  featured: true,
};
