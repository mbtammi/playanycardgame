
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
          { role: 'system', content: `You are an expert card game designer. Output only valid JSON for a GameRules object.

IMPORTANT: For asymmetric dealing (different players get different amounts of cards), use "cardsPerPlayerPosition" instead of "cardsPerPlayer".

Example schemas:
- Symmetric dealing: "setup": { "cardsPerPlayer": 7, "deckSize": 52 }
- Asymmetric dealing: "setup": { "cardsPerPlayer": 0, "cardsPerPlayerPosition": [3, 7, 7, 7], "deckSize": 52 }

The cardsPerPlayerPosition array represents cards dealt to each player position (0=first player, 1=second, etc.).
If a player description mentions "I will get X cards and others get Y", use cardsPerPlayerPosition.` },
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

    // Deal initial hands with support for asymmetric dealing
    let hands: Card[][];
    
    if (this.state.rules.setup.cardsPerPlayerPosition) {
      // Use asymmetric dealing: different cards per player position
      const cardsPerPosition = this.state.rules.setup.cardsPerPlayerPosition;
      hands = [];
      
      for (let i = 0; i < this.state.players.length; i++) {
        const cardsForThisPlayer = cardsPerPosition[i] || cardsPerPosition[cardsPerPosition.length - 1] || 0;
        const playerHand = this.deck.deal(cardsForThisPlayer);
        hands.push(playerHand);
      }
    } else if (this.state.rules.setup.cardsPerPlayer === 0) {
      // Deal all cards evenly among players
      hands = this.deck.dealAllEvenly(this.state.players.length);
    } else {
      // Deal specific number of cards per player (symmetric)
      hands = this.deck.dealHand(
        this.state.players.length,
        this.state.rules.setup.cardsPerPlayer
      );
    }

    // Assign hands to players
    this.state.players.forEach((player, index) => {
      player.hand = hands[index] || [];
      if (this.blackjackMode) {
        (this.state as any).handValues[player.id] = CardUtils.calculateHandValue(player.hand, 'blackjack');
        (this.state as any).busted[player.id] = false;
      }
    });

    // Game-specific initialization
    if (this.state.rules.id === 'sevens') {
      this.initializeSevensGame();
    }

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
      const hasCards = cards.every(cardId => player.hand.some(card => card.id === cardId));
      if (!hasCards) return false;
      
      // Game-specific validation
      if (this.state.rules.id === 'sevens') {
        return cards.length === 1 && this.isValidSevensPlay(cards[0]);
      }
      
      return true;
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

  executeAction(playerId: string, action: GameAction, cardIds?: string[], target?: string ): GameActionResult {
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
      // === GAME-SPECIFIC HANDLING ===
      if (this.state.rules.id === 'sevens' && action === 'play' && cardIds && cardIds.length === 1) {
        // Special handling for Sevens gameplay
        if (!this.isValidSevensPlay(cardIds[0])) {
          throw new Error('Invalid Sevens move. You can only play a 7 or a card adjacent to existing cards in the same suit.');
        }
        message = this.executeSevensPlay(player, cardIds[0]);
      }
      // === GENERIC HANDLING ===
      else if (cardIds && cardIds.length > 0) {
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

  // private handlePlayAction(player: Player, cardIds: string[]): void {
  //   const cardsToPlay = cardIds.map(id => {
  //     const cardIndex = player.hand.findIndex(card => card.id === id);
  //     if (cardIndex === -1) {
  //       throw new Error(`Player doesn't have card ${id}`);
  //     }
  //     return player.hand.splice(cardIndex, 1)[0];
  //   });

  //   // Add to community cards or handle based on game rules
  //   this.state.communityCards.push(...cardsToPlay);
  // }

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
      
      case 'custom':
        return this.evaluateCustomWinCondition(player, condition);
    }

    return false;
  }

  private evaluateCustomWinCondition(player: Player, condition: any): boolean {
    const description = condition.description.toLowerCase();
    console.log(`🎯 Evaluating custom win condition for ${player.name}: "${description}"`);
    
    // Handle "draw/lift black card to win" scenarios
    if (description.includes('black') && description.includes('win')) {
      const lastAction = this.state.lastAction;
      console.log(`📋 Last action:`, lastAction);
      const lastDrawnCard = (this.state as any).lastDrawnCard;
      console.log(`🃏 Last drawn card:`, lastDrawnCard);
      
      if (lastAction && lastAction.playerId === player.id && lastAction.action === 'draw') {
        // Check if the last drawn card was black
        if (lastDrawnCard && (lastDrawnCard.suit === 'clubs' || lastDrawnCard.suit === 'spades')) {
          console.log(`🎉 WIN CONDITION MET: ${player.name} drew a black card!`);
          return true;
        }
      }
    }
    
    // Handle "draw/lift red card to win" scenarios
    if (description.includes('red') && description.includes('win')) {
      const lastAction = this.state.lastAction;
      if (lastAction && lastAction.playerId === player.id && lastAction.action === 'draw') {
        const lastDrawnCard = (this.state as any).lastDrawnCard;
        if (lastDrawnCard && (lastDrawnCard.suit === 'hearts' || lastDrawnCard.suit === 'diamonds')) {
          console.log(`🎉 WIN CONDITION MET: ${player.name} drew a red card!`);
          return true;
        }
      }
    }
    
    // Handle "draw specific rank to win" scenarios
    const rankMatches = description.match(/(?:draw|lift).*?([akqj]|ace|king|queen|jack|\d+).*?win/);
    if (rankMatches) {
      const targetRank = this.normalizeRank(rankMatches[1]);
      const lastAction = this.state.lastAction;
      if (lastAction && lastAction.playerId === player.id && lastAction.action === 'draw') {
        const lastDrawnCard = (this.state as any).lastDrawnCard;
        if (lastDrawnCard && this.normalizeRank(lastDrawnCard.rank) === targetRank) {
          console.log(`🎉 WIN CONDITION MET: ${player.name} drew a ${targetRank}!`);
          return true;
        }
      }
    }
    
    // Handle "collect X cards to win" scenarios
    const collectMatches = description.match(/collect.*?(\d+).*?cards?.*?win/);
    if (collectMatches) {
      const targetCount = parseInt(collectMatches[1]);
      const hasEnough = player.hand.length >= targetCount;
      if (hasEnough) {
        console.log(`🎉 WIN CONDITION MET: ${player.name} has ${player.hand.length} cards (need ${targetCount})!`);
      }
      return hasEnough;
    }
    
    // Handle "reach X points to win" scenarios
    const pointMatches = description.match(/reach.*?(\d+).*?points?.*?win/);
    if (pointMatches) {
      const targetPoints = parseInt(pointMatches[1]);
      const currentPoints = this.state.scores[player.id];
      const hasEnough = currentPoints >= targetPoints;
      if (hasEnough) {
        console.log(`🎉 WIN CONDITION MET: ${player.name} has ${currentPoints} points (need ${targetPoints})!`);
      }
      return hasEnough;
    }
    
    // Handle "empty hand to win" scenarios
    if (description.includes('empty hand') || description.includes('no cards')) {
      const isEmpty = player.hand.length === 0;
      if (isEmpty) {
        console.log(`🎉 WIN CONDITION MET: ${player.name} has an empty hand!`);
      }
      return isEmpty;
    }
    
    // Handle suit-based win conditions
    if (description.includes('all hearts') || description.includes('only hearts')) {
      const allHearts = player.hand.every(card => card.suit === 'hearts');
      if (allHearts && player.hand.length > 0) {
        console.log(`🎉 WIN CONDITION MET: ${player.name} has all hearts!`);
      }
      return allHearts && player.hand.length > 0;
    }
    if (description.includes('all diamonds') || description.includes('only diamonds')) {
      const allDiamonds = player.hand.every(card => card.suit === 'diamonds');
      if (allDiamonds && player.hand.length > 0) {
        console.log(`🎉 WIN CONDITION MET: ${player.name} has all diamonds!`);
      }
      return allDiamonds && player.hand.length > 0;
    }
    if (description.includes('all clubs') || description.includes('only clubs')) {
      const allClubs = player.hand.every(card => card.suit === 'clubs');
      if (allClubs && player.hand.length > 0) {
        console.log(`🎉 WIN CONDITION MET: ${player.name} has all clubs!`);
      }
      return allClubs && player.hand.length > 0;
    }
    if (description.includes('all spades') || description.includes('only spades')) {
      const allSpades = player.hand.every(card => card.suit === 'spades');
      if (allSpades && player.hand.length > 0) {
        console.log(`🎉 WIN CONDITION MET: ${player.name} has all spades!`);
      }
      return allSpades && player.hand.length > 0;
    }
    
    // Handle "have all of same rank" scenarios
    if (description.includes('all') && (description.includes('same') || description.includes('matching'))) {
      if (player.hand.length > 0) {
        const firstRank = player.hand[0].rank;
        const allSame = player.hand.every(card => card.rank === firstRank);
        if (allSame) {
          console.log(`🎉 WIN CONDITION MET: ${player.name} has all ${firstRank}s!`);
        }
        return allSame;
      }
    }
    
    console.log(`❌ No matching win condition pattern found for: "${description}"`);
    // Default: return false for unrecognized custom conditions
    return false;
  }
  
  private normalizeRank(rank: string): string {
    const normalized = rank.toLowerCase();
    if (normalized === 'ace') return 'A';
    if (normalized === 'king') return 'K';
    if (normalized === 'queen') return 'Q';
    if (normalized === 'jack') return 'J';
    return rank.toUpperCase();
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

  // ===== SEVENS GAME SPECIFIC METHODS =====
  
  private initializeSevensGame(): void {
    // Initialize the table structure for Sevens
    // Table will store cards organized by suit: { hearts: [], diamonds: [], clubs: [], spades: [] }
    (this.state as any).table = {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: []
    };
    
    // Find who has the 7 of diamonds to start first
    let startingPlayerIndex = 0;
    for (let i = 0; i < this.state.players.length; i++) {
      const has7OfDiamonds = this.state.players[i].hand.some(card => 
        card.rank === '7' && card.suit === 'clubs'
      );
      if (has7OfDiamonds) {
        startingPlayerIndex = i;
        break;
      }
    }
    
    // Set the player with 7 of diamonds as the current player
    this.state.players.forEach(p => p.isActive = false);
    this.state.players[startingPlayerIndex].isActive = true;
    this.state.currentPlayerIndex = startingPlayerIndex;
  }
  
  // Public method to check if a specific card can be played
  isValidPlay(cardId: string): boolean {
    if (this.state.rules.id === 'sevens') {
      return this.isValidSevensPlay(cardId);
    }
    // For other games, use general validation
    const player = this.getCurrentPlayer();
    if (!player) return false;
    return this.isValidAction(player.id, 'play', [cardId]);
  }

  private isValidSevensPlay(cardId: string): boolean {
    const card = this.state.players
      .flatMap(p => p.hand)
      .find(c => c.id === cardId);
    
    if (!card) return false;
    
    const table = (this.state as any).table || {};
    
    // Check if any cards have been played yet (is this the very first move?)
    const totalCardsOnTable = Object.values(table).reduce((sum: number, suitCards: any) => sum + suitCards.length, 0);
    
    // FIRST MOVE: Must be 7 of diamonds
    if (totalCardsOnTable === 0) {
      return card.rank === '7' && card.suit === 'diamonds';
    }
    
    // AFTER FIRST MOVE: Can play any 7 to start a new suit
    if (card.rank === '7') {
      return true;
    }
    
    // BUILDING: Can only play cards adjacent to existing cards in the same suit
    const suitCards = table[card.suit] || [];
    
    // If no 7 is played in this suit yet, can't play other cards
    if (suitCards.length === 0) return false;
    
    // Check if card can be played adjacent to existing cards
    const cardValue = this.getCardNumericValue(card.rank);
    const suitValues = suitCards.map((c: Card) => this.getCardNumericValue(c.rank)).sort((a: number, b: number) => a - b);
    
    // Can play if it's one higher than the highest or one lower than the lowest
    const minValue = Math.min(...suitValues);
    const maxValue = Math.max(...suitValues);
    
    return cardValue === minValue - 1 || cardValue === maxValue + 1;
  }
  
  private getCardNumericValue(rank: string): number {
    switch (rank) {
      case 'A': return 14; // Aces are high in Sevens
      case 'K': return 13;
      case 'Q': return 12;
      case 'J': return 11;
      default: return parseInt(rank);
    }
  }
  
  private executeSevensPlay(player: Player, cardId: string): string {
    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) {
      throw new Error(`Player doesn't have card ${cardId}`);
    }
    
    const card = player.hand.splice(cardIndex, 1)[0];
    const table = (this.state as any).table || {};
    
    if (!table[card.suit]) {
      table[card.suit] = [];
    }
    
    table[card.suit].push(card);
    
    // Sort the suit cards by value to maintain order
    table[card.suit].sort((a: Card, b: Card) => 
      this.getCardNumericValue(a.rank) - this.getCardNumericValue(b.rank)
    );
    
    return `${player.name} played ${card.rank}${this.getSuitSymbol(card.suit)}`;
  }

  // Helper method to check if a player has any valid Sevens moves
  hasValidSevensMove(playerId: string): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return false;
    
    // Check each card in hand
    for (const card of player.hand) {
      if (this.isValidSevensPlay(card.id)) {
        return true;
      }
    }
    return false;
  }

  // Enhanced method to get valid actions that considers game rules
  getValidActionsForCurrentPlayer(): GameAction[] {
    const player = this.getCurrentPlayer();
    if (!player || !player.isActive) return [];
    
    const currentPhase = this.state.currentPhase || 'playing';
    const phaseObj = this.state.rules.turnStructure?.phases?.find(phase => phase.name === currentPhase);
    const allowedActions = phaseObj?.actions || this.state.rules.actions;
    
    // For Sevens, be more intelligent about available actions
    if (this.state.rules.id === 'sevens') {
      const actions: GameAction[] = [];
      
      // Check if player can play any cards
      if (this.hasValidSevensMove(player.id)) {
        actions.push('play');
      }
      
      // Player can always pass (but shouldn't if they have valid moves)
      actions.push('pass');
      
      return actions as GameAction[];
    }
    
    // For other games, use original logic
    return (allowedActions as GameAction[]).filter(action => this.isValidAction(player.id, action));
  }
}
