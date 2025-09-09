#!/usr/bin/env node

/**
 * Simple test script to verify that all predefined games can be created without errors
 * This tests the updated game definitions against the modern game engine
 */

const { GameEngine } = require('./dist/engine/gameEngine.js');
const { predefinedGames } = require('./dist/utils/predefinedGames.js');
const { complexTestGames } = require('./dist/utils/complexTestGames.js');
const { attackHealthGame } = require('./dist/utils/testAttackGame.js');

console.log('🎮 Testing Game Creation...\n');

// Test all predefined games
console.log('Testing predefined games:');
let successCount = 0;
let totalCount = 0;

for (const game of predefinedGames) {
  totalCount++;
  try {
    const engine = new GameEngine(game.rules);
    engine.addPlayer('Player 1', 'human');
    engine.addPlayer('Player 2', 'bot');
    if (game.rules.players.min >= 3) {
      engine.addPlayer('Player 3', 'bot');
    }
    if (game.rules.players.requiresDealer) {
      engine.addPlayer('Dealer', 'dealer');
    }
    engine.startGame();
    console.log(`✅ ${game.name} - Created successfully`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${game.name} - Error: ${error.message}`);
  }
}

// Test complex test games
console.log('\nTesting complex test games:');
const testGames = [
  { name: 'Card Thief', rules: complexTestGames[0] },
  { name: 'Chaos Wars', rules: complexTestGames[1] },
  { name: 'Memory Palace Deluxe', rules: complexTestGames[2] }
];

for (const game of testGames) {
  totalCount++;
  try {
    const engine = new GameEngine(game.rules);
    engine.addPlayer('Player 1', 'human');
    engine.addPlayer('Player 2', 'bot');
    if (game.rules.players.min >= 3) {
      engine.addPlayer('Player 3', 'bot');
    }
    engine.startGame();
    console.log(`✅ ${game.name} - Created successfully`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${game.name} - Error: ${error.message}`);
  }
}

// Test attack health game
console.log('\nTesting attack health game:');
totalCount++;
try {
  const engine = new GameEngine(attackHealthGame);
  engine.addPlayer('Player 1', 'human');
  engine.addPlayer('Player 2', 'bot');
  engine.startGame();
  console.log(`✅ Attack & Health Game - Created successfully`);
  successCount++;
} catch (error) {
  console.log(`❌ Attack & Health Game - Error: ${error.message}`);
}

console.log(`\n🎯 Results: ${successCount}/${totalCount} games created successfully`);

if (successCount === totalCount) {
  console.log('🎉 All games are working with the modern game engine!');
  process.exit(0);
} else {
  console.log('⚠️  Some games need additional fixes');
  process.exit(1);
}
