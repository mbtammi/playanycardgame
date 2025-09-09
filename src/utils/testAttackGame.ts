import type { GameRules } from '../types';

/**
 * Test game for attack/health mechanics to verify bot never gets stuck
 */
export const attackHealthGame: GameRules = {
  id: 'attack-health-game',
  name: 'Attack & Health Game',
  description: 'Players lift 2 cards per turn - one for health, one for attack. Choose to either lift 1 card or play 1 card each turn.',
  players: {
    min: 2,
    max: 4,
    recommended: 2,
  },
  setup: {
    cardsPerPlayer: 0, // Start with no cards, lift them during play
    deckSize: 52,
    keepDrawnCard: true, // Lifted cards go to hand
  },
  objective: {
    type: 'custom',
    description: 'Defeat your enemies by dealing more attack damage than their health',
  },
  turnStructure: {
    order: 'clockwise',
    phases: [
      {
        name: 'action',
        required: true,
        actions: ['draw', 'play', 'pass'],
      },
    ],
  },
  actions: ['draw', 'play', 'pass'],
  winConditions: [
    {
      type: 'custom',
      description: 'Last player standing with health > 0',
    },
  ],
  specialRules: [
    'Each turn: draw 2 cards (health + attack) OR play 1 card to attack',
    'Red cards = health points (hearts/diamonds)',
    'Black cards = attack points (clubs/spades)',
    'Number cards = face value, Face cards = 10, Aces = 11',
    'Attack reduces enemy health by attack value',
    'When health reaches 0, player is eliminated',
    'Drawing cards is always a valid action',
    'Can always pass turn if no other actions work',
  ],
  aiPrompt: 'This is a combat card game where players alternate between gathering resources (drawing cards) and attacking enemies. Bots should prioritize drawing cards early to build up health/attack, then attack when they have advantage.',
};
