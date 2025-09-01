/**
 * AI-powered custom action generator that creates dynamic game mechanics
 * WARNING: This involves eval() and should be used with extreme caution in production
 */

import type { GameState, GameRules, Player, Card } from '../types';

export interface AIGeneratedAction {
  name: string;
  description: string;
  code: string; // JavaScript function as string
  parameters: string[]; // Parameter names
  requiresCards: boolean;
  targetType: 'self' | 'opponent' | 'all' | 'none';
}

export class AIActionGenerator {
  private generatedActions: Map<string, AIGeneratedAction> = new Map();
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a custom action using AI
   */
  async generateAction(
    actionName: string,
    description: string,
    gameContext: { state: GameState; rules: GameRules }
  ): Promise<AIGeneratedAction> {
    const prompt = `Create a JavaScript function for a card game action called "${actionName}".
Description: ${description}

The function should:
1. Take parameters: (gameState, rules, playerId, cardIds?, target?)
2. Modify the gameState object directly
3. Return a message describing what happened
4. Be safe and not break the game

Game context:
- Players: ${gameContext.state.players.length}
- Deck size: ${gameContext.state.deck.length}
- Game type: ${gameContext.rules.name}

Return ONLY a JSON object with this structure:
{
  "name": "action_name",
  "description": "what this action does",
  "code": "function(gameState, rules, playerId, cardIds, target) { /* implementation */ return 'success message'; }",
  "parameters": ["gameState", "rules", "playerId", "cardIds", "target"],
  "requiresCards": true/false,
  "targetType": "self/opponent/all/none"
}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a card game AI that generates safe, functional JavaScript code. Output only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const actionDef: AIGeneratedAction = JSON.parse(content);

      // Validate the generated action
      if (this.validateGeneratedAction(actionDef)) {
        this.generatedActions.set(actionName, actionDef);
        return actionDef;
      } else {
        throw new Error('Generated action failed validation');
      }
    } catch (error) {
      console.error('Failed to generate AI action:', error);
      throw error;
    }
  }

  /**
   * Execute a generated action
   */
  executeGeneratedAction(
    actionName: string,
    gameState: GameState,
    rules: GameRules,
    playerId: string,
    cardIds?: string[],
    target?: string
  ): string {
    const action = this.generatedActions.get(actionName);
    if (!action) {
      throw new Error(`Unknown generated action: ${actionName}`);
    }

    try {
      // Create a safe execution context
      const safeContext = {
        gameState: this.createSafeGameState(gameState),
        rules,
        playerId,
        cardIds: cardIds || [],
        target,
        // Utility functions that actions can use
        utils: {
          findPlayer: (id: string) => gameState.players.find(p => p.id === id),
          moveCard: this.moveCard.bind(this),
          drawCard: this.drawCard.bind(this),
          shuffleDeck: this.shuffleDeck.bind(this),
          calculateScore: this.calculateScore.bind(this)
        }
      };

      // Execute the generated function
      // WARNING: Using eval() - this should be sandboxed in production
      const func = eval(`(${action.code})`);
      const result = func(
        safeContext.gameState,
        safeContext.rules,
        safeContext.playerId,
        safeContext.cardIds,
        safeContext.target,
        safeContext.utils
      );

      // Update the real game state with changes
      this.applySafeChanges(gameState, safeContext.gameState);

      return result || `${actionName} executed successfully`;
    } catch (error) {
      console.error(`Error executing generated action ${actionName}:`, error);
      throw new Error(`Failed to execute ${actionName}: ${error}`);
    }
  }

  /**
   * Validate that a generated action is safe and functional
   */
  private validateGeneratedAction(action: AIGeneratedAction): boolean {
    try {
      // Check required fields
      if (!action.name || !action.code || !Array.isArray(action.parameters)) {
        return false;
      }

      // Try to parse the function
      const func = eval(`(${action.code})`);
      if (typeof func !== 'function') {
        return false;
      }

      // Check for dangerous patterns
      const dangerousPatterns = [
        'require(',
        'import(',
        'eval(',
        'Function(',
        'window.',
        'document.',
        'process.',
        'global.',
        'fetch(',
        'XMLHttpRequest'
      ];

      for (const pattern of dangerousPatterns) {
        if (action.code.includes(pattern)) {
          console.warn(`Generated action contains dangerous pattern: ${pattern}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Action validation failed:', error);
      return false;
    }
  }

  /**
   * Create a safe copy of game state for action execution
   */
  private createSafeGameState(gameState: GameState): GameState {
    return JSON.parse(JSON.stringify(gameState));
  }

  /**
   * Apply safe changes back to the real game state
   */
  private applySafeChanges(realState: GameState, modifiedState: GameState): void {
    // Only allow modifications to certain fields
    const allowedChanges = [
      'players',
      'deck',
      'discardPile',
      'communityCards',
      'table',
      'scores',
      'lastAction'
    ];

    for (const field of allowedChanges) {
      if (field in modifiedState) {
        (realState as any)[field] = (modifiedState as any)[field];
      }
    }
  }

  /**
   * Utility functions that generated actions can use
   */
  private moveCard(from: Card[], to: Card[], cardId: string): boolean {
    const cardIndex = from.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return false;
    
    const card = from.splice(cardIndex, 1)[0];
    to.push(card);
    return true;
  }

  private drawCard(gameState: GameState, playerId: string): Card | null {
    if (gameState.deck.length === 0) return null;
    
    const card = gameState.deck.pop()!;
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
      player.hand.push(card);
    }
    return card;
  }

  private shuffleDeck(deck: Card[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  private calculateScore(player: Player, rules: GameRules): number {
    // Basic scoring - can be enhanced based on rules
    return player.hand.reduce((score, card) => score + card.value, 0);
  }

  /**
   * Get all available generated actions
   */
  getAvailableActions(): Map<string, AIGeneratedAction> {
    return new Map(this.generatedActions);
  }

  /**
   * Remove a generated action
   */
  removeAction(actionName: string): boolean {
    return this.generatedActions.delete(actionName);
  }
}

// Example of how AI might generate the "switch_cards" action:
export const exampleSwitchCardsAction: AIGeneratedAction = {
  name: "switch_cards",
  description: "Switch a card from your hand with a random card from opponent's hand",
  code: `function(gameState, rules, playerId, cardIds, target, utils) {
    const player = utils.findPlayer(playerId);
    const targetPlayer = target ? utils.findPlayer(target) : 
      gameState.players.find(p => p.id !== playerId && p.type !== 'dealer');
    
    if (!player || !targetPlayer || !cardIds || cardIds.length === 0) {
      return "Switch failed: invalid parameters";
    }
    
    if (targetPlayer.hand.length === 0) {
      return "Switch failed: opponent has no cards";
    }
    
    // Move player's card to opponent
    const playerCard = player.hand.find(c => c.id === cardIds[0]);
    if (!playerCard) {
      return "Switch failed: you don't have that card";
    }
    
    // Remove from player, add to opponent
    player.hand = player.hand.filter(c => c.id !== cardIds[0]);
    targetPlayer.hand.push(playerCard);
    
    // Take random card from opponent
    const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
    const opponentCard = targetPlayer.hand.splice(randomIndex, 1)[0];
    player.hand.push(opponentCard);
    
    return \`\${player.name} switched \${playerCard.rank} of \${playerCard.suit} with \${targetPlayer.name}'s \${opponentCard.rank} of \${opponentCard.suit}\`;
  }`,
  parameters: ["gameState", "rules", "playerId", "cardIds", "target", "utils"],
  requiresCards: true,
  targetType: "opponent"
};
