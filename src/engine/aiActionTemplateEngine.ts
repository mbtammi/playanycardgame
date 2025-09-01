/**
 * Safe AI-driven custom actions using predefined templates
 * This approach is much safer than code generation while still being very flexible
 */

import type { GameState, GameRules, Player, Card } from '../types';

export interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  parameters: ActionParameter[];
  effects: ActionEffect[];
  conditions: ActionCondition[];
  requiresCards: boolean;
  targetType: 'self' | 'opponent' | 'all' | 'none' | 'choice';
}

export interface ActionParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'cardId' | 'playerId';
  required: boolean;
  default?: any;
  min?: number;
  max?: number;
  options?: string[];
}

export interface ActionEffect {
  type: 'move_card' | 'swap_cards' | 'draw_cards' | 'discard_cards' | 'modify_score' | 
        'shuffle_deck' | 'peek_card' | 'reveal_card' | 'skip_turn' | 'extra_turn' |
        'steal_card' | 'give_card' | 'copy_card' | 'destroy_card' | 'transform_card';
  source?: 'hand' | 'deck' | 'discard' | 'table' | 'opponent_hand';
  target?: 'hand' | 'deck' | 'discard' | 'table' | 'opponent_hand' | 'community';
  amount?: number | 'all' | 'random';
  cardFilter?: {
    suits?: string[];
    ranks?: string[];
    minValue?: number;
    maxValue?: number;
  };
  playerId?: string; // For targeted effects
  message?: string;
}

export interface ActionCondition {
  type: 'hand_size' | 'card_in_hand' | 'score_range' | 'turn_number' | 'custom';
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'not_contains';
  value: any;
  target?: 'self' | 'opponent' | 'all';
}

export class AIActionTemplateEngine {
  private templates: Map<string, ActionTemplate> = new Map();
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeBasicTemplates();
  }

  /**
   * Initialize basic action templates
   */
  private initializeBasicTemplates(): void {
    // Switch Cards Template
    this.templates.set('switch_cards', {
      id: 'switch_cards',
      name: 'Switch Cards',
      description: 'Exchange cards with another player',
      parameters: [
        { name: 'cardCount', type: 'number', required: false, default: 1, min: 1, max: 5 },
        { name: 'targetPlayer', type: 'playerId', required: false }
      ],
      effects: [
        {
          type: 'swap_cards',
          source: 'hand',
          target: 'opponent_hand',
          amount: 1,
          message: 'Cards have been switched!'
        }
      ],
      conditions: [
        { type: 'hand_size', operator: 'greater', value: 0, target: 'self' },
        { type: 'hand_size', operator: 'greater', value: 0, target: 'opponent' }
      ],
      requiresCards: true,
      targetType: 'opponent'
    });

    // Steal Random Card Template
    this.templates.set('steal_card', {
      id: 'steal_card',
      name: 'Steal Card',
      description: 'Take a random card from opponent',
      parameters: [],
      effects: [
        {
          type: 'steal_card',
          source: 'opponent_hand',
          target: 'hand',
          amount: 'random',
          message: 'You stole a card!'
        }
      ],
      conditions: [
        { type: 'hand_size', operator: 'greater', value: 0, target: 'opponent' }
      ],
      requiresCards: false,
      targetType: 'opponent'
    });

    // Peek at Cards Template
    this.templates.set('peek_cards', {
      id: 'peek_cards',
      name: 'Peek at Cards',
      description: 'Look at opponent\'s hand or deck',
      parameters: [
        { name: 'source', type: 'string', required: true, options: ['opponent_hand', 'deck'] },
        { name: 'cardCount', type: 'number', required: false, default: 1, min: 1, max: 3 }
      ],
      effects: [
        {
          type: 'peek_card',
          source: 'opponent_hand',
          amount: 1,
          message: 'You peeked at cards!'
        }
      ],
      conditions: [],
      requiresCards: false,
      targetType: 'choice'
    });

    // Extra Turn Template
    this.templates.set('extra_turn', {
      id: 'extra_turn',
      name: 'Extra Turn',
      description: 'Take an additional turn',
      parameters: [],
      effects: [
        {
          type: 'extra_turn',
          message: 'You get another turn!'
        }
      ],
      conditions: [],
      requiresCards: false,
      targetType: 'self'
    });

    // Discard and Draw Template
    this.templates.set('refresh_hand', {
      id: 'refresh_hand',
      name: 'Refresh Hand',
      description: 'Discard cards and draw new ones',
      parameters: [
        { name: 'discardCount', type: 'number', required: false, default: 1, min: 1, max: 5 }
      ],
      effects: [
        {
          type: 'discard_cards',
          source: 'hand',
          target: 'discard',
          amount: 1
        },
        {
          type: 'draw_cards',
          source: 'deck',
          target: 'hand',
          amount: 1
        }
      ],
      conditions: [
        { type: 'hand_size', operator: 'greater', value: 0, target: 'self' }
      ],
      requiresCards: true,
      targetType: 'self'
    });
  }

  /**
   * Generate a custom action using AI and templates
   */
  async generateCustomAction(
    actionName: string,
    description: string,
    gameContext: { state: GameState; rules: GameRules }
  ): Promise<ActionTemplate> {
    const prompt = `Create a card game action called "${actionName}".
Description: ${description}

Available effect types: move_card, swap_cards, draw_cards, discard_cards, modify_score, shuffle_deck, peek_card, reveal_card, skip_turn, extra_turn, steal_card, give_card

Available sources/targets: hand, deck, discard, table, opponent_hand, community

Game context:
- Players: ${gameContext.state.players.length}
- Game type: ${gameContext.rules.name}

Return a JSON ActionTemplate object with:
- id: kebab-case action name
- name: human-readable name
- description: what this action does
- parameters: array of required parameters
- effects: array of effects this action has
- conditions: array of conditions that must be met
- requiresCards: whether player must select cards
- targetType: who this action targets

Make it balanced and fun!`;

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
            { role: 'system', content: 'You are a card game designer. Output only valid JSON ActionTemplate objects.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 800
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const template: ActionTemplate = JSON.parse(content);

      if (this.validateTemplate(template)) {
        this.templates.set(template.id, template);
        return template;
      } else {
        throw new Error('Generated template failed validation');
      }
    } catch (error) {
      console.error('Failed to generate custom action:', error);
      throw error;
    }
  }

  /**
   * Execute a template-based action
   */
  executeTemplateAction(
    templateId: string,
    gameState: GameState,
    rules: GameRules,
    playerId: string,
    parameters: Record<string, any> = {},
    cardIds?: string[],
    targetPlayerId?: string
  ): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Unknown action template: ${templateId}`);
    }

    // Validate conditions
    if (!this.checkConditions(template.conditions, gameState, playerId, targetPlayerId)) {
      throw new Error(`Action ${template.name} conditions not met`);
    }

    const messages: string[] = [];

    // Execute each effect
    for (const effect of template.effects) {
      const result = this.executeEffect(effect, gameState, playerId, targetPlayerId, parameters, cardIds);
      if (result) {
        messages.push(result);
      }
    }

    return messages.length > 0 ? messages.join(' ') : `${template.name} executed successfully`;
  }

  /**
   * Execute a single effect
   */
  private executeEffect(
    effect: ActionEffect,
    gameState: GameState,
    playerId: string,
    targetPlayerId?: string,
    parameters: Record<string, any> = {},
    cardIds?: string[]
  ): string {
    const player = gameState.players.find(p => p.id === playerId);
    const targetPlayer = targetPlayerId ? gameState.players.find(p => p.id === targetPlayerId) : null;

    if (!player) {
      throw new Error('Player not found');
    }

    switch (effect.type) {
      case 'swap_cards':
        return this.executeSwapCards(effect, gameState, player, targetPlayer || null, cardIds);
      
      case 'steal_card':
        return this.executeStealCard(effect, gameState, player, targetPlayer || null);
      
      case 'draw_cards':
        return this.executeDrawCards(effect, gameState, player, parameters);
      
      case 'discard_cards':
        return this.executeDiscardCards(effect, gameState, player, cardIds);
      
      case 'peek_card':
        return this.executePeekCard(effect, gameState, player, targetPlayer || null, parameters);
      
      case 'modify_score':
        return this.executeModifyScore(effect, gameState, player, parameters);
      
      case 'extra_turn':
        return this.executeExtraTurn(effect, gameState, player);
      
      default:
        return effect.message || 'Unknown effect executed';
    }
  }

  private executeSwapCards(
    effect: ActionEffect,
    gameState: GameState,
    player: Player,
    targetPlayer: Player | null,
    cardIds?: string[]
  ): string {
    if (!targetPlayer || !cardIds || cardIds.length === 0) {
      throw new Error('Swap requires target player and card selection');
    }

    const playerCard = player.hand.find(c => cardIds.includes(c.id));
    if (!playerCard) {
      throw new Error('You don\'t have the selected card');
    }

    if (targetPlayer.hand.length === 0) {
      throw new Error('Target player has no cards to swap');
    }

    // Remove card from player
    player.hand = player.hand.filter(c => c.id !== playerCard.id);
    
    // Take random card from target
    const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
    const targetCard = targetPlayer.hand.splice(randomIndex, 1)[0];
    
    // Complete the swap
    player.hand.push(targetCard);
    targetPlayer.hand.push(playerCard);

    return `${player.name} swapped ${playerCard.rank} of ${playerCard.suit} with ${targetPlayer.name}'s ${targetCard.rank} of ${targetCard.suit}`;
  }

  private executeStealCard(
    effect: ActionEffect,
    gameState: GameState,
    player: Player,
    targetPlayer: Player | null
  ): string {
    if (!targetPlayer || targetPlayer.hand.length === 0) {
      throw new Error('No cards to steal');
    }

    const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
    const stolenCard = targetPlayer.hand.splice(randomIndex, 1)[0];
    player.hand.push(stolenCard);

    return `${player.name} stole ${stolenCard.rank} of ${stolenCard.suit} from ${targetPlayer.name}`;
  }

  private executeDrawCards(
    effect: ActionEffect,
    gameState: GameState,
    player: Player,
    parameters: Record<string, any>
  ): string {
    const amount = typeof effect.amount === 'number' ? effect.amount : parameters.cardCount || 1;
    const drawnCards: Card[] = [];

    for (let i = 0; i < amount && gameState.deck.length > 0; i++) {
      const card = gameState.deck.pop()!;
      player.hand.push(card);
      drawnCards.push(card);
    }

    return `${player.name} drew ${drawnCards.length} card(s)`;
  }

  private executeDiscardCards(
    effect: ActionEffect,
    gameState: GameState,
    player: Player,
    cardIds?: string[]
  ): string {
    if (!cardIds || cardIds.length === 0) {
      throw new Error('No cards selected for discard');
    }

    const discardedCards: Card[] = [];
    for (const cardId of cardIds) {
      const cardIndex = player.hand.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        const card = player.hand.splice(cardIndex, 1)[0];
        gameState.discardPile.push(card);
        discardedCards.push(card);
      }
    }

    return `${player.name} discarded ${discardedCards.length} card(s)`;
  }

  private executePeekCard(
    effect: ActionEffect,
    gameState: GameState,
    player: Player,
    targetPlayer: Player | null,
    parameters: Record<string, any>
  ): string {
    const source = parameters.source || 'opponent_hand';
    
    if (source === 'opponent_hand' && targetPlayer) {
      const cardCount = Math.min(parameters.cardCount || 1, targetPlayer.hand.length);
      return `${player.name} peeked at ${cardCount} card(s) in ${targetPlayer.name}'s hand`;
    } else if (source === 'deck') {
      const cardCount = Math.min(parameters.cardCount || 1, gameState.deck.length);
      return `${player.name} peeked at the top ${cardCount} card(s) of the deck`;
    }

    return `${player.name} peeked at cards`;
  }

  private executeModifyScore(
    effect: ActionEffect,
    gameState: GameState,
    player: Player,
    parameters: Record<string, any>
  ): string {
    const amount = parameters.scoreChange || 0;
    gameState.scores[player.id] = (gameState.scores[player.id] || 0) + amount;
    
    return `${player.name}'s score changed by ${amount}`;
  }

  private executeExtraTurn(
    _effect: ActionEffect,
    _gameState: GameState,
    player: Player
  ): string {
    // This would need to be handled by the game engine's turn system
    // For now, just return a message
    return `${player.name} gets an extra turn!`;
  }

  /**
   * Check if action conditions are met
   */
  private checkConditions(
    conditions: ActionCondition[],
    gameState: GameState,
    playerId: string,
    targetPlayerId?: string
  ): boolean {
    for (const condition of conditions) {
      if (!this.checkSingleCondition(condition, gameState, playerId, targetPlayerId)) {
        return false;
      }
    }
    return true;
  }

  private checkSingleCondition(
    condition: ActionCondition,
    gameState: GameState,
    playerId: string,
    targetPlayerId?: string
  ): boolean {
    const player = gameState.players.find(p => p.id === playerId);
    const targetPlayer = targetPlayerId ? gameState.players.find(p => p.id === targetPlayerId) : null;

    switch (condition.type) {
      case 'hand_size':
        const checkPlayer = condition.target === 'opponent' ? targetPlayer : player;
        if (!checkPlayer) return false;
        
        switch (condition.operator) {
          case 'greater': return checkPlayer.hand.length > condition.value;
          case 'less': return checkPlayer.hand.length < condition.value;
          case 'equals': return checkPlayer.hand.length === condition.value;
          default: return false;
        }
      
      default:
        return true; // Unknown conditions pass by default
    }
  }

  /**
   * Validate template structure
   */
  private validateTemplate(template: ActionTemplate): boolean {
    return !!(
      template.id &&
      template.name &&
      template.description &&
      Array.isArray(template.effects) &&
      Array.isArray(template.conditions)
    );
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): Map<string, ActionTemplate> {
    return new Map(this.templates);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ActionTemplate | undefined {
    return this.templates.get(id);
  }
}
