
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
        model: 'gpt-4o-mini',
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
    
    // Check the condition type for specific win conditions
    if (condition.type === 'black_card') {
      return this.checkBlackCardWin(player);
    }
    
    if (condition.type === 'red_card') {
      return this.checkRedCardWin(player);
    }
    
    // Handle "draw/lift black card to win" scenarios
    if (description.includes('black') && description.includes('win')) {
      return this.checkBlackCardWin(player);
    }
    
    // Handle "draw/lift red card to win" scenarios
    if (description.includes('red') && description.includes('win')) {
      return this.checkRedCardWin(player);
    }
    
    // Handle "draw specific rank to win" scenarios
    const rankMatches = description.match(/(?:draw|lift).*?([akqj]|ace|king|queen|jack|\d+).*?win/);
    if (rankMatches) {
      const targetRank = this.normalizeRank(rankMatches[1]);
      return this.checkSpecificRankWin(player, targetRank);
    }
    
    // Handle "collect X cards to win" scenarios
    const collectMatches = description.match(/collect.*?(\d+).*?cards?.*?win/);
    if (collectMatches) {
      const targetCount = parseInt(collectMatches[1]);
      return player.hand.length >= targetCount;
    }
    
    // Handle "reach X points to win" scenarios
    const pointMatches = description.match(/reach.*?(\d+).*?points?.*?win/);
    if (pointMatches) {
      const targetPoints = parseInt(pointMatches[1]);
      return (this.state.scores[player.id] || 0) >= targetPoints;
    }
    
    // Handle "empty hand to win" scenarios
    if (description.includes('empty hand') || description.includes('no cards')) {
      return player.hand.length === 0;
    }
    
    // Handle suit-based win conditions
    if (description.includes('all hearts') || description.includes('only hearts')) {
      return player.hand.length > 0 && player.hand.every(card => card.suit === 'hearts');
    }
    if (description.includes('all diamonds') || description.includes('only diamonds')) {
      return player.hand.length > 0 && player.hand.every(card => card.suit === 'diamonds');
    }
    if (description.includes('all clubs') || description.includes('only clubs')) {
      return player.hand.length > 0 && player.hand.every(card => card.suit === 'clubs');
    }
    if (description.includes('all spades') || description.includes('only spades')) {
      return player.hand.length > 0 && player.hand.every(card => card.suit === 'spades');
    }
    
    // Handle "have all of same rank" scenarios
    if (description.includes('all') && (description.includes('same') || description.includes('matching'))) {
      if (player.hand.length === 0) return false;
      const firstRank = player.hand[0].rank;
      return player.hand.every(card => card.rank === firstRank);
    }
    
    console.log(`❌ No matching win condition pattern found for: "${description}"`);
    // Default: return false for unrecognized custom conditions
    return false;
  }

  private checkBlackCardWin(player: Player): boolean {
    // Check if the last drawn card (in discard pile) is black
    const lastDrawnCard = (this.state as any).lastDrawnCard;
    if (lastDrawnCard) {
      const isBlack = lastDrawnCard.suit === 'clubs' || lastDrawnCard.suit === 'spades';
      console.log(`🃏 Last drawn card: ${lastDrawnCard.rank} of ${lastDrawnCard.suit} (${isBlack ? 'BLACK' : 'RED'})`);
      return isBlack;
    }
    
    // Fallback: check if player has any black cards
    return player.hand.some(card => card.suit === 'clubs' || card.suit === 'spades');
  }

  private checkRedCardWin(player: Player): boolean {
    // Check if the last drawn card (in discard pile) is red
    const lastDrawnCard = (this.state as any).lastDrawnCard;
    if (lastDrawnCard) {
      const isRed = lastDrawnCard.suit === 'hearts' || lastDrawnCard.suit === 'diamonds';
      console.log(`🃏 Last drawn card: ${lastDrawnCard.rank} of ${lastDrawnCard.suit} (${isRed ? 'RED' : 'BLACK'})`);
      return isRed;
    }
    
    // Fallback: check if player has any red cards
    return player.hand.some(card => card.suit === 'hearts' || card.suit === 'diamonds');
  }

  private checkSpecificRankWin(player: Player, targetRank: string): boolean {
    // Check if the last drawn card matches the target rank
    const lastDrawnCard = (this.state as any).lastDrawnCard;
    if (lastDrawnCard) {
      const matches = lastDrawnCard.rank === targetRank;
      console.log(`🃏 Last drawn card: ${lastDrawnCard.rank} (looking for ${targetRank}) - ${matches ? 'MATCH!' : 'no match'}`);
      return matches;
    }
    
    // Fallback: check if player has the target rank
    return player.hand.some(card => card.rank === targetRank);
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

  // ===== ENHANCED TABLE MANAGEMENT =====
  
  /**
   * Auto-determine optimal table layout based on game rules and current state
   */
  getOptimalTableLayout(): 'grid' | 'centered' | 'sequence' {
    // Analyze game rules to determine layout
    const rules = this.state.rules;
    const table = (this.state as any).table || {};
    
    // 1. Check for explicit layout preference in rules
    if (rules.tableLayout?.preferred) {
      return rules.tableLayout.preferred;
    }
    
    // 2. Check if this is a pure deck-drawing game (no table play)
    const onlyDrawActions = rules.actions.every(action => 
      ['draw', 'pass'].includes(action) && !['play', 'discard', 'playToTable'].includes(action)
    );
    
    if (onlyDrawActions && Object.keys(table).length === 0) {
      return 'centered'; // Simple layout for deck-only games
    }
    
    // 3. Check for sequence-building indicators in rules
    const hasSequenceRules = rules.specialRules?.some(rule => 
      rule.toLowerCase().includes('build') || 
      rule.toLowerCase().includes('sequence') ||
      rule.toLowerCase().includes('up') && rule.toLowerCase().includes('down') ||
      rule.toLowerCase().includes('consecutive')
    );
    
    // 4. Check actual table state for sequences
    const hasLongSequences = Object.values(table).some((cards: any) => 
      Array.isArray(cards) && cards.length > 5
    );
    
    // 5. Check for suit-based organization
    const hasSuitBasedTable = Object.keys(table).some(key => 
      ['hearts', 'diamonds', 'clubs', 'spades'].includes(key)
    );
    
    // Layout decision logic
    if (hasSequenceRules || hasLongSequences) {
      return 'sequence';
    }
    
    if (hasSuitBasedTable && Object.keys(table).length > 2) {
      return 'grid';
    }
    
    // Default to centered layout for most card games
    return 'centered';
  }

  /**
   * Get enhanced table display data with AI-driven layout detection
   */
  getTableDisplayData(): {
    tableType: 'none' | 'suit-based' | 'pile-based' | 'sequence' | 'scattered' | 'custom';
    table: Record<string, Card[]> | Card[] | any;
    layout: 'grid' | 'centered' | 'sequence' | 'scattered' | 'custom';
    zones: Array<{
      id: string;
      type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard';
      cards: Card[];
      position?: { x: number; y: number };
      allowDrop?: boolean;
      label?: string;
    }>;
    metadata: {
      gameType: string;
      needsTable: boolean;
      centerCard?: Card;
      validDropZones?: string[];
      playerCount: number;
      flexiblePlacement: boolean;
    };
  } {
    const rules = this.state.rules;
    const table = (this.state as any).table || {};
    const layout = this.getOptimalTableLayout();
    
    // Determine if game needs a table at all
    const needsTable = this.analyzeTableNeed();
    const tableType = this.detectTableType(table, rules);
    const zones = this.generateTableZones(table, rules, tableType);
    
    return {
      tableType,
      table: needsTable ? table : {},
      layout: needsTable ? layout : 'centered',
      zones,
      metadata: {
        gameType: rules.id,
        needsTable,
        centerCard: this.getCenterCard(),
        validDropZones: this.getValidDropZones(),
        playerCount: this.state.players.length,
        flexiblePlacement: this.supportsFlexiblePlacement(),
      }
    };
  }

  /**
   * AI-driven analysis: Does this game need a table display?
   */
  private analyzeTableNeed(): boolean {
    const rules = this.state.rules;
    const table = (this.state as any).table || {};
    
    // 1. If table has cards, it's needed
    if (Object.keys(table).length > 0 && Object.values(table).some((cards: any) => Array.isArray(cards) && cards.length > 0)) {
      return true;
    }
    
    // 2. Check if game rules suggest table play
    const hasTableActions = rules.actions.some(action => 
      ['play', 'playToTable', 'discard'].includes(action)
    );
    
    const hasTableRules = rules.specialRules?.some(rule => 
      rule.toLowerCase().includes('table') ||
      rule.toLowerCase().includes('pile') ||
      rule.toLowerCase().includes('center') ||
      rule.toLowerCase().includes('build')
    );
    
    // 3. Pure draw games typically don't need tables
    const onlyDrawActions = rules.actions.every(action => 
      ['draw', 'pass'].includes(action)
    );
    
    if (onlyDrawActions && !hasTableRules) {
      return false;
    }
    
    return (hasTableActions || hasTableRules) ?? false;
  }

  /**
   * AI-driven table type detection
   */
  private detectTableType(table: any, rules: GameRules): 'none' | 'suit-based' | 'pile-based' | 'sequence' | 'scattered' | 'custom' {
    if (!this.analyzeTableNeed()) return 'none';
    
    // Check if explicitly suit-based
    const hasSuitKeys = Object.keys(table).some(key => 
      ['hearts', 'diamonds', 'clubs', 'spades'].includes(key)
    );
    
    if (hasSuitKeys) return 'suit-based';
    
    // Check for sequence building
    const hasSequenceRules = rules.specialRules?.some(rule => 
      rule.toLowerCase().includes('build') ||
      rule.toLowerCase().includes('sequence') ||
      rule.toLowerCase().includes('consecutive')
    );
    
    if (hasSequenceRules) return 'sequence';
    
    // Check for pile-based games
    const hasPileRules = rules.specialRules?.some(rule => 
      rule.toLowerCase().includes('pile') ||
      rule.toLowerCase().includes('stack')
    );
    
    if (hasPileRules) return 'pile-based';
    
    // Check for scattered/search games
    const hasScatteredRules = rules.specialRules?.some(rule => 
      rule.toLowerCase().includes('scatter') ||
      rule.toLowerCase().includes('find') ||
      rule.toLowerCase().includes('search')
    );
    
    if (hasScatteredRules) return 'scattered';
    
    return 'custom';
  }

  /**
   * Generate table zones based on game type and AI analysis
   */
  private generateTableZones(table: any, _rules: GameRules, tableType: string): Array<{
    id: string;
    type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard';
    cards: Card[];
    position?: { x: number; y: number };
    allowDrop?: boolean;
    label?: string;
  }> {
    const zones: Array<{
      id: string;
      type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard';
      cards: Card[];
      position?: { x: number; y: number };
      allowDrop?: boolean;
      label?: string;
    }> = [];
    
    switch (tableType) {
      case 'none':
        // No table zones needed
        break;
        
      case 'suit-based':
        // Create suit-based zones
        ['hearts', 'diamonds', 'clubs', 'spades'].forEach((suit, index) => {
          zones.push({
            id: suit,
            type: 'sequence' as const,
            cards: table[suit] || [],
            allowDrop: true,
            label: suit,
            position: { x: index * 200, y: 0 }
          });
        });
        break;
        
      case 'pile-based':
        // Create pile zones
        Object.keys(table).forEach((key, index) => {
          zones.push({
            id: key,
            type: 'pile' as const,
            cards: table[key] || [],
            allowDrop: true,
            label: key,
            position: { x: index * 150, y: 0 }
          });
        });
        break;
        
      case 'scattered':
        // Create scattered card positions (AI-generated)
        const allCards = Object.values(table).flat() as Card[];
        allCards.forEach((card, index) => {
          zones.push({
            id: `card-${index}`,
            type: 'pile' as const,
            cards: [card],
            allowDrop: false,
            position: {
              x: Math.random() * 800,
              y: Math.random() * 400
            }
          });
        });
        break;
        
      default:
        // Custom layout - let AI decide
        break;
    }
    
    return zones;
  }

  /**
   * Check if the current game supports flexible card placement
   */
  private supportsFlexiblePlacement(): boolean {
    // Games with 1-8 players that allow free-form placement
    const flexibleGames = ['sevens', 'solitaire', 'patience', 'spider'];
    return (
      this.state.players.length >= 1 && 
      this.state.players.length <= 8 &&
      (flexibleGames.includes(this.state.rules.id) || 
       this.state.rules.turnStructure?.order === 'free')
    );
  }

  /**
   * Enhanced method to validate card placement for flexible games
   */
  canPlaceCardAt(cardId: string, targetSuit: string, position?: 'before' | 'after' | 'center'): boolean {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) return false;

    const card = currentPlayer.hand.find(c => c.id === cardId);
    if (!card) return false;

    // For Sevens, use existing validation
    if (this.state.rules.id === 'sevens') {
      return this.canPlayCardToSuit(card, targetSuit, ((this.state as any).table || {})[targetSuit] || []);
    }

    // For flexible placement games, allow more freedom
    if (this.supportsFlexiblePlacement()) {
      // Basic suit matching for most games
      if (card.suit !== targetSuit) return false;
      
      const table = (this.state as any).table || {};
      const suitCards = table[targetSuit] || [];
      
      // If no cards in suit, allow any card
      if (suitCards.length === 0) return true;
      
      // For positioned placement, check adjacency
      if (position) {
        return this.isValidAdjacentPlacement(card, suitCards, position);
      }
      
      return true; // Allow free placement
    }

    return false;
  }

  private isValidAdjacentPlacement(card: Card, existingCards: Card[], position: 'before' | 'after' | 'center'): boolean {
    if (existingCards.length === 0) return true;

    const cardValue = this.getCardNumericValue(card.rank);
    const existingValues = existingCards.map(c => this.getCardNumericValue(c.rank)).sort((a, b) => a - b);
    
    switch (position) {
      case 'before':
        return cardValue === existingValues[0] - 1;
      case 'after':
        return cardValue === existingValues[existingValues.length - 1] + 1;
      case 'center':
        // Allow insertion if it creates a valid sequence
        return existingValues.some((val, idx) => 
          idx > 0 && cardValue > existingValues[idx - 1] && cardValue < val
        );
      default:
        return false;
    }
  }

  private getCenterCard(): Card | undefined {
    // For Sevens, find the center card (7) of each suit to highlight the starting point
    if (this.state.rules.id === 'sevens') {
      const table = (this.state as any).table || {};
      for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
        const suitCards = table[suit] || [];
        const sevenCard = suitCards.find((card: Card) => card.rank === '7');
        if (sevenCard) return sevenCard;
      }
    }
    return undefined;
  }

  private getValidDropZones(): string[] {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) return [];
    
    // For Sevens, return suits where the current player can place cards
    if (this.state.rules.id === 'sevens') {
      const validSuits: string[] = [];
      const table = (this.state as any).table || {};
      
      for (const card of currentPlayer.hand) {
        for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
          if (this.canPlayCardToSuit(card, suit, table[suit] || [])) {
            if (!validSuits.includes(suit)) validSuits.push(suit);
          }
        }
      }
      return validSuits;
    }
    
    return [];
  }

  private canPlayCardToSuit(card: Card, suit: string, suitCards: Card[]): boolean {
    if (card.suit !== suit) return false;
    
    // If no cards in suit, can only play 7
    if (suitCards.length === 0) {
      return card.rank === '7';
    }
    
    // Find the range of cards already played
    const ranks = suitCards.map(c => this.getCardNumericValue(c.rank)).sort((a, b) => a - b);
    const minRank = ranks[0];
    const maxRank = ranks[ranks.length - 1];
    
    const cardValue = this.getCardNumericValue(card.rank);
    
    // Can play if adjacent to existing cards
    return cardValue === minRank - 1 || cardValue === maxRank + 1;
  }

  // ===== SEVENS GAME SPECIFIC METHODS =====
  
  private initializeSevensGame(): void {
    // Initialize the table structure for Sevens with enhanced centering
    // Table will store cards organized by suit: { hearts: [], diamonds: [], clubs: [], spades: [] }
    (this.state as any).table = {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: []
    };
    
    // Find who has the 7 of diamonds to start first (traditional Sevens start)
    let startingPlayerIndex = 0;
    for (let i = 0; i < this.state.players.length; i++) {
      const player = this.state.players[i];
      const hasSevenOfDiamonds = player.hand.some(card => 
        card.rank === '7' && card.suit === 'diamonds'
      );
      if (hasSevenOfDiamonds) {
        startingPlayerIndex = i;
        break;
      }
    }
    
    // If no 7 of diamonds found (shouldn't happen), find any 7
    if (startingPlayerIndex === 0) {
      for (let i = 0; i < this.state.players.length; i++) {
        const player = this.state.players[i];
        const hasSeven = player.hand.some(card => card.rank === '7');
        if (hasSeven) {
          startingPlayerIndex = i;
          break;
        }
      }
    }
    
    // Set the player with starting 7 as the current player
    this.state.players.forEach(p => p.isActive = false);
    this.state.players[startingPlayerIndex].isActive = true;
    this.state.currentPlayerIndex = startingPlayerIndex;
    
    // Store metadata for enhanced table display
    (this.state as any).gameMetadata = {
      centeringStrategy: 'start_with_seven',
      primarySuit: 'diamonds',
      tableLayout: 'sequence'
    };
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
