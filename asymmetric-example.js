// Example of how the new asymmetric dealing schema would work
// for your game: "4 players, I will be dealt 3 cards and everybody else 7"

const exampleGameRules = {
  "id": "asymmetric-discard-game",
  "name": "Fresh Start Card Game",
  "description": "4 players, I will be dealt 3 cards and everybody else 7. The smallest card starts. Smallest overall is ace and then highest is king. If you have a 9 or 10 you can discard the deck on the table and start fresh with any card",
  "players": {
    "min": 4,
    "max": 4,
    "recommended": 4
  },
  "setup": {
    "cardsPerPlayer": 0, // Ignored when cardsPerPlayerPosition is provided
    "cardsPerPlayerPosition": [3, 7, 7, 7], // Player 0 gets 3 cards, others get 7
    "deckSize": 52
  },
  "objective": {
    "type": "custom",
    "description": "Be the first to empty your hand using strategic play and 9/10 special powers"
  },
  "turnStructure": {
    "order": "clockwise",
    "phases": [
      {
        "name": "playing",
        "actions": ["play", "discard", "pass"]
      }
    ]
  },
  "actions": ["play", "discard", "pass"],
  "winConditions": [
    {
      "type": "first_to_empty",
      "description": "First player to empty their hand wins"
    }
  ],
  "specialRules": [
    "Player with smallest card starts (Ace is smallest, King is highest)",
    "Playing a 9 or 10 allows you to discard all cards on the table and start fresh with any card"
  ]
};

console.log('✅ Asymmetric dealing schema example:');
console.log('Player 0 gets:', exampleGameRules.setup.cardsPerPlayerPosition[0], 'cards');
console.log('Player 1 gets:', exampleGameRules.setup.cardsPerPlayerPosition[1], 'cards');
console.log('Player 2 gets:', exampleGameRules.setup.cardsPerPlayerPosition[2], 'cards');
console.log('Player 3 gets:', exampleGameRules.setup.cardsPerPlayerPosition[3], 'cards');
