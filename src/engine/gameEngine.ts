
import type { GameState, GameRules, Player, Card, GameAction, GameActionResult } from '../types';
import { CardDeck, CardUtils } from './deck';

export class GameEngine {

  private state: GameState;
  private deck: CardDeck;
  private blackjackMode: boolean = false;

  constructor(rules: GameRules) {
    this.deck = new CardDeck();
    this.state = this.initializeGameState(rules);
    this.blackjackMode = rules.id === 'blackjack' || rules.name.toLowerCase().includes('blackjack');
  }

    /**
   * Create a new GameEngine from a natural language idea using OpenAI API.
   * This is a stub; wire up your OpenAI integration where marked.
   */
  static async createGameFromIdea(idea: string, openAIApiKey: string): Promise<GameEngine> {
    // 1. Call OpenAI API to interpret the idea and generate a GameRules object
    // (Replace this with your actual OpenAI call)
    // Example prompt: "Convert this card game idea into a JSON GameRules object: ..."
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert card game designer. Output only valid JSON for a GameRules object.' },
          { role: 'user', content: `Convert this card game idea into a JSON GameRules object: ${idea}` }
        ],
        temperature: 0.3,
        max_tokens: 1200
      })
    });
    const data = await response.json();
    // Parse the JSON from the model's response
    let rules: GameRules;
    try {
      // Try to parse the first code block or the whole content as JSON
      const content = data.choices?.[0]?.message?.content || '';
      const match = content.match(/```json\s*([\s\S]*?)```/);
      rules = JSON.parse(match ? match[1] : content);
    } catch (e) {
      throw new Error('Failed to parse GameRules from OpenAI response');
    }
    // 2. Return a new GameEngine instance
    return new GameEngine(rules);
  }

  private initializeGameState(rules: GameRules): GameState {
    return {
      id: `game-${Date.now()}`,
      rules,
      players: [],
      deck: [],
      discardPile: [],
      communityCards: [],
      table: {}, // Flexible table: suit -> array of cards, or any structure needed
      currentPlayerIndex: 0,
      currentPhase: 'setup',
      turn: 1,
      round: 1,
      scores: {},
      gameStatus: 'waiting',
      // Blackjack-specific state
      handValues: {}, // playerId -> hand value
      busted: {}, // playerId -> boolean
    } as GameState & { handValues?: Record<string, number>, busted?: Record<string, boolean>, table?: any };
  }

  addPlayer(name: string, type: 'human' | 'bot', avatar?: string): void {
    if (this.state.players.length >= this.state.rules.players.max) {
      throw new Error('Maximum number of players reached');
    }

    const player: Player = {
      id: `player-${this.state.players.length + 1}`,
      name,
      type,
      hand: [],
      isActive: false,
      score: 0,
      position: this.state.players.length,
      avatar,
    };

    this.state.players.push(player);
    this.state.scores[player.id] = 0;
    if (this.blackjackMode) {
      (this.state as any).handValues[player.id] = 0;
      (this.state as any).busted[player.id] = false;
    }
  }

  startGame(): void {
    if (this.state.players.length < this.state.rules.players.min) {
      throw new Error(`Need at least ${this.state.rules.players.min} players to start`);
    }

    // Shuffle deck
    this.deck.shuffle();

    // Deal initial hands
    const hands = this.deck.dealHand(
      this.state.players.length,
      this.state.rules.setup.cardsPerPlayer
    );

    // Assign hands to players
    this.state.players.forEach((player, index) => {
      player.hand = hands[index] || [];
      if (this.blackjackMode) {
        (this.state as any).handValues[player.id] = CardUtils.calculateHandValue(player.hand, 'blackjack');
        (this.state as any).busted[player.id] = false;
      }
    });

    // Set first player as active
    this.state.players[0].isActive = true;
    this.state.currentPlayerIndex = 0;
    this.state.gameStatus = 'active';
    this.state.currentPhase = 'playing';

    // Store remaining deck
    this.state.deck = this.deck.getCards();
  }

  getCurrentPlayer(): Player | null {
    return this.state.players[this.state.currentPlayerIndex] || null;
  }

  getGameState(): GameState {
    // Always return up-to-date deck and discardPile arrays
    return {
      ...this.state,
      deck: [...this.state.deck],
      discardPile: [...this.state.discardPile],
    };
  }

  isValidAction(playerId: string, action: GameAction, cards?: string[]): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isActive) {
      return false;
    }

    // Check if action is allowed in the current phase (not just globally)
    const currentPhase = this.state.currentPhase || 'playing';
    const phaseObj = this.state.rules.turnStructure?.phases?.find(phase => phase.name === currentPhase);
    const allowedActions = phaseObj?.actions || this.state.rules.actions;
    if (!allowedActions.includes(action)) {
      return false;
    }

    // Validate specific actions for built-in types, else allow custom actions
    if (action === 'draw') {
      return this.state.deck.length > 0;
    }
    if (action === 'play') {
      if (!cards || cards.length === 0) return false;
      return cards.every(cardId => player.hand.some(card => card.id === cardId));
    }
    if (action === 'playToTable') {
      if (!cards || cards.length !== 1) return false;
      return player.hand.some(card => card.id === cards[0]);
    }
    if (action === 'discard') {
      if (!cards || cards.length !== 1) return false;
      return player.hand.some(card => card.id === cards[0]);
    }
    // For custom actions, always allow (unless you want to add custom validation)
    return true;
  }

  /**
   * Returns a list of valid actions for the current player and phase, for UI use.
   */
  getValidActionsForCurrentPlayer(): GameAction[] {
    const player = this.getCurrentPlayer();
    if (!player || !player.isActive) return [];
    const currentPhase = this.state.currentPhase || 'playing';
    const phaseObj = this.state.rules.turnStructure?.phases?.find(phase => phase.name === currentPhase);
    const allowedActions = phaseObj?.actions || this.state.rules.actions;
    // Filter actions by isValidAction
    return (allowedActions as GameAction[]).filter(action => this.isValidAction(player.id, action));
  }

  executeAction(playerId: string, action: GameAction, cardIds?: string[], target?: string, tableTarget?: any): GameActionResult {
    if (!this.isValidAction(playerId, action, cardIds)) {
      return {
        playerId,
        action,
        cards: cardIds,
        target,
        success: false,
        message: 'Invalid action',
        timestamp: Date.now(),
      };
    }

    const player = this.state.players.find(p => p.id === playerId)!;
    let message = '';
    try {
      // --- Dynamic schema-driven action handling ---
      // If the action is in the schema and a card is provided, treat as play (remove from hand, add to community)
      if (cardIds && cardIds.length > 0) {
        // Remove cards from hand and add to community pile
        const cardsToPlay = cardIds.map(id => {
          const cardIndex = player.hand.findIndex(card => card.id === id);
          if (cardIndex === -1) {
            throw new Error(`Player doesn't have card ${id}`);
          }
          return player.hand.splice(cardIndex, 1)[0];
        });
        this.state.communityCards.push(...cardsToPlay);
        message = `${player.name} played ${cardsToPlay.length} card(s)`;
      } else if (action.toLowerCase().includes('draw')) {
        this.handleDrawAction(player);
        message = `${player.name} drew a card`;
      } else if (action.toLowerCase().includes('discard') && cardIds && cardIds.length === 1) {
        this.handleDiscardAction(player, cardIds[0]);
        message = `${player.name} discarded a card`;
      } else if (action.toLowerCase().includes('pass')) {
        message = `${player.name} passed their turn`;
      } else {
        message = `${player.name} performed ${action}`;
      }

      const result: GameActionResult = {
        playerId,
        action,
        cards: cardIds,
        target,
        success: true,
        message,
        timestamp: Date.now(),
      };
      this.state.lastAction = result;
      // Check for win condition after action
      this.checkWinCondition();

      // --- PHASE ADVANCEMENT LOGIC ---
      // If there are multiple phases, advance to next phase after each action
      const phases = this.state.rules.turnStructure?.phases || [];
      if (phases.length > 1) {
        const currentPhaseIdx = phases.findIndex(p => p.name === this.state.currentPhase);
        if (currentPhaseIdx !== -1 && currentPhaseIdx < phases.length - 1) {
          // Advance to next phase, do not advance turn
          this.state.currentPhase = phases[currentPhaseIdx + 1].name;
        } else {
          // Last phase: advance turn and reset to first phase
          this.nextTurn();
          this.state.currentPhase = phases[0].name;
        }
      } else {
        // Only one phase: advance turn as usual
        if (this.state.gameStatus === 'active') {
          this.nextTurn();
        }
      }
      return result;
    } catch (error) {
      return {
        playerId,
        action,
        cards: cardIds,
        target,
        success: false,
        message: error instanceof Error ? error.message : 'Action failed',
        timestamp: Date.now(),
      };
    }
  }

  // Blackjack-specific win/bust logic
  private checkBlackjackWinCondition(): void {
    const handValues = (this.state as any).handValues as Record<string, number>;
    const busted = (this.state as any).busted as Record<string, boolean>;
    // If any player has 21, they win immediately
    for (const player of this.state.players) {
      if (handValues[player.id] === 21) {
        this.state.gameStatus = 'finished';
        this.state.winner = player.id;
        return;
      }
    }
    // If all but one player are busted, that player wins
    const activePlayers = this.state.players.filter(p => !busted[p.id]);
    if (activePlayers.length === 1) {
      this.state.gameStatus = 'finished';
      this.state.winner = activePlayers[0].id;
      return;
    }
    // If all players are busted, no winner
    if (activePlayers.length === 0) {
      this.state.gameStatus = 'finished';
      this.state.winner = undefined;
      return;
    }
    // If all players have stood (not implemented yet), game should end and closest to 21 wins
    // (This can be improved with a 'stood' state per player)
  }

  /**
   * Draw a card. By default, drawn cards go to discard pile (not hand), unless rules specify otherwise.
   * For games like "draw_black_card", the card is revealed and discarded.
   * If rules.setup.keepDrawnCard === true, add to hand; else, discard.
   */
  private handleDrawAction(player: Player): void {
    if (this.state.deck.length === 0) {
      throw new Error('No cards left in deck');
    }
    const drawnCard = this.state.deck.shift()!;
    // If rules specify keeping drawn card, add to hand; else, discard
    // Allow keepDrawnCard as an optional property (not in type)
    const setup: any = this.state.rules?.setup || {};
    const keepDrawn = setup.keepDrawnCard === true;
    if (keepDrawn) {
      player.hand.push(drawnCard);
    } else {
      this.state.discardPile.push(drawnCard);
    }
    // Optionally, store last revealed card for UI
    (this.state as any).lastDrawnCard = drawnCard;
  }

  private handlePlayAction(player: Player, cardIds: string[]): void {
    const cardsToPlay = cardIds.map(id => {
      const cardIndex = player.hand.findIndex(card => card.id === id);
      if (cardIndex === -1) {
        throw new Error(`Player doesn't have card ${id}`);
      }
      return player.hand.splice(cardIndex, 1)[0];
    });

    // Add to community cards or handle based on game rules
    this.state.communityCards.push(...cardsToPlay);
  }

  private handleDiscardAction(player: Player, cardId: string): void {
    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) {
      throw new Error(`Player doesn't have card ${cardId}`);
    }

    const discardedCard = player.hand.splice(cardIndex, 1)[0];
    this.state.discardPile.push(discardedCard);
  }

  private nextTurn(): void {
    // Set all players as inactive
    this.state.players.forEach(p => p.isActive = false);

    // Move to next player
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;

    // If we've gone through all players, increment turn (multiplayer)
    if (this.state.currentPlayerIndex === 0) {
      this.state.turn++;
      // For single-player games, increment round as well
      if (this.state.players.length === 1) {
        this.state.round++;
      }
    }
    // For single-player games, increment round every turn
    if (this.state.players.length === 1) {
      this.state.round = this.state.turn;
    }

    // Set only the new current player as active
    this.state.players[this.state.currentPlayerIndex].isActive = true;
  }

  private checkWinCondition(): void {
    const winConditions = this.state.rules.winConditions;

    for (const condition of winConditions) {
      for (const player of this.state.players) {
        if (this.evaluateWinCondition(player, condition)) {
          this.state.gameStatus = 'finished';
          this.state.winner = player.id;
          return;
        }
      }
    }
  }

  private evaluateWinCondition(player: Player, condition: any): boolean {
    switch (condition.type) {
      case 'first_to_empty':
        return player.hand.length === 0;
      
      case 'highest_score':
        if (condition.target) {
          return this.state.scores[player.id] >= condition.target;
        }
        break;
      
      case 'lowest_score':
        // This would typically be evaluated at game end
        break;
      
      case 'specific_cards':
        if (condition.target && Array.isArray(condition.target)) {
          return condition.target.every((cardPattern: string) =>
            player.hand.some(card => this.matchesPattern(card, cardPattern))
          );
        }
        break;
    }

    return false;
  }

  private matchesPattern(card: Card, pattern: string): boolean {
    // Simple pattern matching - can be expanded
    // Patterns like "A♥", "K*", "*♠", etc.
    if (pattern.includes('*')) {
      const [rank, suit] = pattern.split('');
      if (rank === '*') return suit === '' || card.suit === this.getSuitFromSymbol(suit);
      if (suit === '*') return card.rank === rank;
    }
    
    return `${card.rank}${this.getSuitSymbol(card.suit)}` === pattern;
  }

  private getSuitFromSymbol(symbol: string): string {
    const suitMap: { [key: string]: string } = {
      '♥': 'hearts',
      '♦': 'diamonds',
      '♣': 'clubs',
      '♠': 'spades',
    };
    return suitMap[symbol] || '';
  }

  private getSuitSymbol(suit: string): string {
    const symbolMap: { [key: string]: string } = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠',
    };
    return symbolMap[suit] || '';
  }

  updateScore(playerId: string, points: number): void {
    this.state.scores[playerId] = (this.state.scores[playerId] || 0) + points;
  }

  getPlayerHand(playerId: string): Card[] {
    const player = this.state.players.find(p => p.id === playerId);
    return player ? [...player.hand] : [];
  }

  getPublicGameState(): Partial<GameState> {
    // Return game state without showing other players' hands
    return {
      ...this.state,
      players: this.state.players.map(player => ({
        ...player,
        hand: player.type === 'human' ? player.hand : player.hand.map(() => ({ 
          ...player.hand[0], 
          faceUp: false 
        } as Card))
      }))
    };
  }
}
