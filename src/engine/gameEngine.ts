
import type { GameState, GameRules, Player, Card, GameAction, GameActionResult } from '../types';
import { CardDeck, CardUtils } from './deck';
import { AIActionTemplateEngine, type ActionTemplate } from './aiActionTemplateEngine';

export class GameEngine {

  private state: GameState;
  private deck: CardDeck;
  private additionalDecks: CardDeck[]; // Support for multiple decks
  private blackjackMode: boolean = false;
  private aiActionEngine?: AIActionTemplateEngine; // AI-powered custom actions

  constructor(rules: GameRules) {
    // Initialize primary deck
    this.deck = new CardDeck();
    this.additionalDecks = [];
    
    // Initialize additional decks if needed
    const numberOfDecks = rules.setup.numberOfDecks || (rules.setup.multipleDecks ? 2 : 1);
    for (let i = 1; i < numberOfDecks; i++) {
      this.additionalDecks.push(new CardDeck());
    }
    
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
      table: {}, // Flexible table: supports any structure the AI wants
      currentPlayerIndex: 0,
      currentPhase: 'setup',
      turn: 1,
      round: 1,
      scores: {},
      gameStatus: 'waiting',
      // Enhanced table state for unlimited flexibility
      tableZones: rules.setup.tableLayout?.zones?.map(zone => ({
        ...zone,
        cards: []
      })) || [],
      // Multiple deck support
      additionalDecks: [],
      // Blackjack-specific state
      handValues: {}, // playerId -> hand value
      busted: {}, // playerId -> boolean
    } as GameState & { 
      handValues?: Record<string, number>, 
      busted?: Record<string, boolean>, 
      table?: any,
      tableZones?: Array<{
        id: string;
        type: string;
        cards: Card[];
        faceDown?: boolean;
        position?: { x: number; y: number };
      }>,
      additionalDecks?: Card[][]
    };
  }

  addPlayer(name: string, type: 'human' | 'bot' | 'dealer', avatar?: string): void {
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
      isDealer: type === 'dealer',
    };

    // Configure dealer-specific properties
    if (type === 'dealer') {
      const dealerConfig = this.state.rules.players.dealerConfig;
      player.dealerRules = {
        mustHitOn: dealerConfig?.mustHitOn || 16,
        mustStandOn: dealerConfig?.mustStandOn || 17,
        revealsCardAt: dealerConfig?.revealsCardAt || 'end',
        playsAfterAllPlayers: dealerConfig?.playsAfterAllPlayers !== false,
      };
    }

    // Initialize chips for betting games
    const bettingConfig = this.state.rules.players.bettingConfig;
    if (bettingConfig && type !== 'dealer') {
      player.chips = bettingConfig.initialChips;
      player.currentBet = 0;
      player.status = 'active';
    }

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

    // Auto-create dealer if the game requires one and none exists
    const hasDealer = this.state.players.some(p => p.isDealer);
    if (this.state.rules.players.requiresDealer && !hasDealer) {
      const dealerConfig = this.state.rules.players.dealerConfig;
      this.addPlayer(
        dealerConfig?.name || 'Dealer', 
        'dealer'
      );
    }

    // Combine all decks if using multiple decks
    const allDecks = [this.deck, ...this.additionalDecks];
    allDecks.forEach(deck => deck.shuffle());
    
    // If using multiple decks, combine them into the main deck
    if (this.additionalDecks.length > 0) {
      const combinedCards = allDecks.flatMap(deck => deck.getCards());
      this.deck = new (this.deck.constructor as any)();
      combinedCards.forEach(card => {
        // Update card IDs to ensure uniqueness across decks
        card.id = `${card.id}-deck${allDecks.findIndex(deck => deck.getCards().includes(card))}`;
      });
      this.deck.setCards(combinedCards);
      this.deck.shuffle();
    } else {
      this.deck.shuffle();
    }

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
      console.log('🂡 Asymmetric dealing applied (cardsPerPlayerPosition):', this.state.rules.setup.cardsPerPlayerPosition, '=> dealt hand sizes:', hands.map(h => h.length));
    } else {
      // Deal specific number of cards per player (symmetric)
      const cardsToDealer = this.state.rules.setup.cardsPerPlayer || 0;
      if (cardsToDealer === 0) {
        // Players start with empty hands - don't deal any cards
        hands = this.state.players.map(() => []);
      } else {
        // Deal specific number of cards per player
        hands = this.deck.dealHand(
          this.state.players.length,
          cardsToDealer
        );
      }
    }

    // Assign hands to players
    this.state.players.forEach((player, index) => {
      player.hand = hands[index] || [];
      if (this.blackjackMode) {
        (this.state as any).handValues[player.id] = CardUtils.calculateHandValue(player.hand, 'blackjack');
      }
    });

    // ENHANCED: Initialize table zones and community cards for sequence games
  if (this.state.rules.setup.tableLayout?.zones) {
      const tableZones = (this.state as any).tableZones || [];
      
      // Ensure tableZones array is properly initialized
      this.state.rules.setup.tableLayout.zones.forEach((zoneConfig, index) => {
        // Initialize zone if it doesn't exist
        if (!tableZones[index]) {
          tableZones[index] = {
            id: zoneConfig.id,
            type: zoneConfig.type,
            cards: [],
            faceDown: zoneConfig.faceDown,
            position: zoneConfig.position,
          };
        }
        
        // Deal initial cards to this zone
        if (zoneConfig.initialCards && zoneConfig.initialCards > 0) {
          const zoneCards = this.deck.deal(zoneConfig.initialCards);
          tableZones[index].cards = zoneCards;
          
          // Set face down if specified (default true for face-down zones)
          const shouldBeFaceDown = zoneConfig.faceDown !== undefined ? zoneConfig.faceDown : true;
          if (shouldBeFaceDown) {
            zoneCards.forEach(card => card.faceUp = false);
          } else {
            zoneCards.forEach(card => card.faceUp = true);
          }
          
          console.log(`✅ Initialized zone "${zoneConfig.id}" with ${zoneCards.length} cards, faceDown: ${shouldBeFaceDown}`);
        }
      });
      
      // Store the tableZones in state
      (this.state as any).tableZones = tableZones;
      console.log(`🎮 Total zones initialized: ${tableZones.length}`);
      console.log('🔍 Zones data:', tableZones.map((z: any) => ({ id: z.id, cardCount: z.cards?.length || 0, faceDown: z.faceDown })));
    }

    // Ensure we have a central play-area for sequence style games even if zones weren't provided
    const layoutType = this.state.rules.setup.tableLayout?.type;
    if (layoutType === 'sequence' && (!(this.state as any).tableZones || (this.state as any).tableZones.length === 0)) {
      (this.state as any).tableZones = [{ id: 'play-area', type: 'sequence', cards: [] }];
      console.log('🛠 Added default play-area zone for sequence game');
    }

    // ENHANCED: Handle initial cards for sequence games (like the user's example)
    const tableLayout = this.state.rules.setup.tableLayout as any;
    if (tableLayout?.initialCards) {
      const initialCards = tableLayout.initialCards;
      console.log(`🃏 Setting up initial table cards:`, initialCards);
      
      // Create the initial cards and add to community cards
      initialCards.forEach((cardSpec: any) => {
        const card = {
          id: `initial-${cardSpec.rank}-${cardSpec.suit}-${Date.now()}`,
          rank: cardSpec.rank,
          suit: cardSpec.suit,
          value: this.getCardNumericValue(cardSpec.rank),
          faceUp: true,
          selected: false
        };
        this.state.communityCards.push(card);
        console.log(`✅ Added initial card: ${card.rank} of ${card.suit}`);
      });
    }

    // BACKUP: If no initial setup but description suggests sequence game, add a default starting card
    const description = this.state.rules.description?.toLowerCase() || '';
    const needsStartingCard = (
      description.includes('previous card') || 
      description.includes('last card') ||
      description.includes('build') ||
      description.includes('sequence')
    ) && this.state.communityCards.length === 0;
    
    if (needsStartingCard) {
      console.log(`🔄 Auto-adding starting card for sequence game`);
      const startingCard = {
        id: `auto-start-${Date.now()}`,
        rank: '7' as const,
        suit: 'hearts' as const,
        value: 7,
        faceUp: true,
        selected: false
      };
      this.state.communityCards.push(startingCard);
      
      // CRITICAL: Also add to table zones for display
      const playArea = this.state.tableZones?.find(zone => zone.id === 'play-area');
      if (playArea) {
        playArea.cards.push(startingCard);
      }
      
      console.log(`✅ Auto-added starting card: 7 of hearts to community cards and table`);
    }

    // Game-specific initialization can be handled by AI rules
    // No hardcoded game initialization needed

    // Set first player as active
    this.state.players[0].isActive = true;
    this.state.currentPlayerIndex = 0;
    this.state.gameStatus = 'active';
    this.state.currentPhase = 'playing';

    // Store remaining deck and additional decks
    this.state.deck = this.deck.getCards();
    if (this.additionalDecks.length > 0) {
      (this.state as any).additionalDecks = this.additionalDecks.map(deck => deck.getCards());
    }
  }

  getCurrentPlayer(): Player | null {
    return this.state.players[this.state.currentPlayerIndex] || null;
  }

  getGameState(): GameState {
    // Always return up-to-date deck and discardPile arrays
    const state = {
      ...this.state,
      deck: [...this.state.deck],
      discardPile: [...this.state.discardPile],
    };
    
    // Debug table zones for development
    const tableZones = (this.state as any).tableZones;
    if (tableZones && tableZones.length > 0) {
      console.log(`🎮 GameState tableZones: ${tableZones.length} zones`);
      tableZones.forEach((zone: any, index: number) => {
        console.log(`  Zone ${index}: ${zone.id} (${zone.type}) - ${zone.cards?.length || 0} cards`);
      });
    }
    
    return state;
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
    if (action === 'lift') {
      // Lift is similar to draw but might have different rules
      return this.state.deck.length > 0;
    }
    if (action === 'play') {
      // Intelligent play action validation based on game context
      if (this.isCardRequestGame()) {
        // In card request games like Blackjack, "play" means "hit" - no cards from hand needed
        return true;
      } else {
        // In most card games, "play" means "play cards from hand"
        if (!cards || cards.length === 0) {
          return false; // Need cards to play
        }
        const hasCards = cards.every(cardId => player.hand.some(card => card.id === cardId));
        if (!hasCards) return false;
        
        // General play validation - let AI rules handle game-specific logic
        return true;
      }
    }
    if (action === 'playToTable') {
      if (!cards || cards.length !== 1) return false;
      return player.hand.some(card => card.id === cards[0]);
    }
    if (action === 'discard') {
      if (!cards || cards.length !== 1) return false;
      return player.hand.some(card => card.id === cards[0]);
    }
    if (action === 'flip') {
      if (!cards || cards.length !== 1) return false;
      // Check if card exists in table zones
      return this.state.tableZones?.some(zone => 
        zone.cards.some(card => card.id === cards[0])
      ) || false;
    }
    if (action === 'peek') {
      if (!cards || cards.length !== 1) return false;
      // Check if card exists in table zones and player has enough points
      const cardExists = this.state.tableZones?.some(zone => 
        zone.cards.some(card => card.id === cards[0])
      ) || false;
      const hasPoints = (this.state.scores[player.id] || 0) > 0;
      return cardExists && hasPoints;
    }
    if (action === 'pass') {
      return true; // Pass is always valid
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
      // === INTELLIGENT ACTION INTERPRETATION ===
      // The same action word can mean different things in different games
      
      if (action === 'play') {
        // Interpret "play" action based on game context
        if (this.isCardRequestGame()) {
          // In games like Blackjack, "play" means "request another card"
          this.handleDrawAction(player);
          message = `${player.name} hits (requests another card)`;
        } else if (cardIds && cardIds.length > 0) {
          // ENHANCED: Validate card play for sequence games
          const cardsToPlay = cardIds.map(id => {
            const cardIndex = player.hand.findIndex(card => card.id === id);
            if (cardIndex === -1) {
              throw new Error(`Player doesn't have card ${id}`);
            }
            return player.hand[cardIndex]; // Don't remove yet, just validate
          });

          // Check if the cards can be played based on game rules
          let canPlay = true;
          let validationMessage = '';

          // For sequence games, check if card follows the sequence rule
          if (this.state.communityCards.length > 0) {
            const lastCard = this.state.communityCards[this.state.communityCards.length - 1];
            const cardToPlay = cardsToPlay[0]; // Assume single card for now
            
            const description = this.state.rules.description?.toLowerCase() || '';
            
            // Enhanced sequence validation for the user's game type
            if (description.includes('3, 6, or 9') || description.includes('3,6,or 9')) {
              const lastValue = this.getCardNumericValue(lastCard.rank);
              const playValue = this.getCardNumericValue(cardToPlay.rank);
              const diff = Math.abs(playValue - lastValue);
              
              if (![3, 6, 9].includes(diff)) {
                canPlay = false;
                validationMessage = `Card ${cardToPlay.rank} cannot be played. Must be 3, 6, or 9 different from ${lastCard.rank}`;
              }
            }
            // Add more sequence validation patterns here as needed
          }

          if (canPlay) {
            // Now actually remove the cards from hand
            const actualCardsToPlay = cardIds.map(id => {
              const cardIndex = player.hand.findIndex(card => card.id === id);
              return player.hand.splice(cardIndex, 1)[0];
            });
            
            this.state.communityCards.push(...actualCardsToPlay);
            
            // CRITICAL: Also add to table zones for display
            const playArea = this.state.tableZones?.find(zone => zone.id === 'play-area');
            if (playArea) {
              playArea.cards.push(...actualCardsToPlay);
            }
            
            const cardNames = actualCardsToPlay.map(c => `${c.rank} of ${c.suit}`).join(', ');
            message = `${player.name} played ${cardNames}`;
          } else {
            throw new Error(validationMessage || 'Invalid card play');
          }
        } else {
          // No cards specified, treat as a generic play action
          message = `${player.name} performed ${action}`;
        }
      }
      // === SPECIAL ACTION HANDLING ===
      else if (action === 'flip' && cardIds && cardIds.length === 1) {
        // Handle flip action for memory games
        const result = this.handleFlipAction(player, cardIds[0]);
        message = result.message;
      } else if (action === 'peek' && cardIds && cardIds.length === 1) {
        // Handle peek action for memory games
        const result = this.handlePeekAction(player, cardIds[0]);
        message = result.message;
      } 
      // === STANDARD ACTION HANDLING ===
      else if (action.toLowerCase().includes('draw') || action.toLowerCase().includes('lift')) {
        this.handleDrawAction(player);
        message = `${player.name} ${action === 'lift' ? 'lifted' : 'drew'} a card`;
      } else if (action.toLowerCase().includes('discard') && cardIds && cardIds.length === 1) {
        this.handleDiscardAction(player, cardIds[0]);
        message = `${player.name} discarded a card`;
      } else if (action.toLowerCase().includes('pass') || action.toLowerCase().includes('stand') || action.toLowerCase().includes('stay')) {
        message = `${player.name} ${this.getPassActionName()}`;
      } 
      // === AI-GENERATED CUSTOM ACTIONS ===
      else if (this.isAIGeneratedAction(action)) {
        // Handle AI-generated custom actions (safe template-based approach)
        message = this.executeAIAction(action, player, cardIds, target);
      }
      // === UNIVERSAL HANDLING ===
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
      } else {
        // Custom action without cards
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
   * Draw a card. ENHANCED: Never fails - creates new cards if deck is empty
   * By default, drawn cards go to discard pile (not hand), unless rules specify otherwise.
   * For games like "draw_black_card", the card is revealed and discarded.
   * If rules.setup.keepDrawnCard === true, add to hand; else, discard.
   */
  private handleDrawAction(player: Player): void {
    // CRITICAL ENHANCEMENT: Prevent "No cards left in deck" errors
    if (this.state.deck.length === 0) {
      console.warn(`⚠️ Deck empty! Reshuffling discard pile or creating emergency cards for player ${player.name}`);
      
      // Try to reshuffle discard pile back into deck
      if (this.state.discardPile.length > 0) {
        console.log('🔄 Reshuffling discard pile back into deck');
        this.state.deck = [...this.state.discardPile];
        this.state.discardPile = [];
        
        // Shuffle the deck
        for (let i = this.state.deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.state.deck[i], this.state.deck[j]] = [this.state.deck[j], this.state.deck[i]];
        }
      } else {
        // Emergency: Create a new card to prevent bot getting stuck
        console.log('🚨 Creating emergency card to prevent game from breaking');
        const suits: ("hearts" | "diamonds" | "clubs" | "spades")[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks: ("2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A")[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
        
        const emergencyCard: Card = {
          id: `emergency-${Date.now()}-${Math.random()}`,
          suit: randomSuit,
          rank: randomRank,
          value: randomRank === 'A' ? 1 : (randomRank === 'J' || randomRank === 'Q' || randomRank === 'K' ? 10 : parseInt(randomRank)),
          faceUp: true,
          selected: false
        };
        this.state.deck.push(emergencyCard);
      }
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
    // Store last revealed card for UI and win checking
    (this.state as any).lastDrawnCard = drawnCard;
    
    // IMPORTANT: Check win condition immediately after draw for draw-based games
    this.checkWinCondition();
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

  /**
   * Handle flipping a card in a table zone (like memory games)
   */
  private handleFlipAction(player: Player, cardId: string): { message: string } {
    // Find the card in table zones
    const zone = this.state.tableZones?.find(zone => 
      zone.cards.some(card => card.id === cardId)
    );
    
    if (!zone) {
      throw new Error(`Card ${cardId} not found in any table zone`);
    }
    
    const card = zone.cards.find(c => c.id === cardId);
    if (!card) {
      throw new Error(`Card ${cardId} not found`);
    }
    
    // Flip the card (toggle faceUp)
    card.faceUp = !card.faceUp;
    
    // Store flipped card for memory game logic
    if (!this.state.flippedCards) {
      (this.state as any).flippedCards = [];
    }
    
    if (card.faceUp) {
      (this.state as any).flippedCards.push(card);
      
      // Check for matching pairs in memory games
      if ((this.state as any).flippedCards.length === 2) {
        const [first, second] = (this.state as any).flippedCards;
        if (first.rank === second.rank) {
          // Match! Remove cards from grid and score points
          this.updateScore(player.id, 2);
          // Remove matched cards from their zones
          this.removeCardsFromZones([first.id, second.id]);
          (this.state as any).flippedCards = [];
          return { message: `${player.name} found a matching pair! ${first.rank}s` };
        } else {
          // No match - cards will flip back after a delay
          setTimeout(() => {
            first.faceUp = false;
            second.faceUp = false;
            (this.state as any).flippedCards = [];
          }, 2000);
          return { message: `${player.name} flipped ${card.rank} ${card.suit}. No match, cards will flip back.` };
        }
      }
      
      return { message: `${player.name} flipped ${card.rank} ${card.suit}` };
    } else {
      // Card flipped back down
      const flippedIndex = (this.state as any).flippedCards?.findIndex((c: any) => c.id === card.id);
      if (flippedIndex !== -1) {
        (this.state as any).flippedCards.splice(flippedIndex, 1);
      }
      return { message: `${player.name} flipped card face down` };
    }
  }

  /**
   * Handle peeking at a card (shows it temporarily)
   */
  private handlePeekAction(player: Player, cardId: string): { message: string } {
    // Find the card in table zones
    const zone = this.state.tableZones?.find(zone => 
      zone.cards.some(card => card.id === cardId)
    );
    
    if (!zone) {
      throw new Error(`Card ${cardId} not found in any table zone`);
    }
    
    const card = zone.cards.find(c => c.id === cardId);
    if (!card) {
      throw new Error(`Card ${cardId} not found`);
    }
    
    // Temporarily show the card (costs 1 point)
    this.updateScore(player.id, -1);
    card.faceUp = true;
    
    // Set it to flip back after 3 seconds
    setTimeout(() => {
      card.faceUp = false;
    }, 3000);
    
    return { message: `${player.name} peeked at ${card.rank} ${card.suit} (-1 point)` };
  }

  /**
   * Intelligent game type detection: Does this game involve requesting cards rather than playing from hand?
   */
  private isCardRequestGame(): boolean {
    const { name, description, specialRules, objective } = this.state.rules;
    const allText = [name, description, ...(specialRules || []), objective?.description || ''].join(' ').toLowerCase();
    
    // Blackjack-style games where "play" means "hit" (request card)
    if (allText.includes('blackjack') || allText.includes('21')) return true;
    if (allText.includes('hit') && allText.includes('stand')) return true;
    if (allText.includes('bust') || allText.includes('over 21')) return true;
    
    // Other card-request games
    if (allText.includes('request card') || allText.includes('ask for card')) return true;
    if (allText.includes('dealer gives') || allText.includes('receive card')) return true;
    
    // Games where you don't play from hand but accumulate cards
    if (this.state.rules.setup.cardsPerPlayer === 0 && allText.includes('draw')) return true;
    
    return false;
  }

  /**
   * Get contextual name for pass action based on game type
   */
  private getPassActionName(): string {
    const { name, description, specialRules } = this.state.rules;
    const allText = [name, description, ...(specialRules || [])].join(' ').toLowerCase();
    
    // Blackjack and similar games
    if (allText.includes('blackjack') || allText.includes('21')) return 'stands';
    if (allText.includes('hit') && allText.includes('stand')) return 'stands';
    
    // Poker-style games
    if (allText.includes('poker') || allText.includes('fold')) return 'folds';
    
    // General games
    if (allText.includes('skip')) return 'skips their turn';
    if (allText.includes('wait')) return 'waits';
    
    return 'passes their turn';
  }

  /**
   * Remove cards from table zones (for matched pairs)
   */
  private removeCardsFromZones(cardIds: string[]): void {
    if (!this.state.tableZones) return;
    
    for (const zone of this.state.tableZones) {
      zone.cards = zone.cards.filter(card => !cardIds.includes(card.id));
    }
  }

  private nextTurn(): void {
    // Set all players as inactive
    this.state.players.forEach(p => p.isActive = false);

    // For dealer games, handle special turn order
    if (this.state.rules.players.requiresDealer) {
      this.handleDealerTurnOrder();
    } else {
      // Standard turn progression
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    }

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

    // Handle automatic dealer actions if it's dealer's turn
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.isDealer && currentPlayer.type === 'dealer') {
      this.handleAutomaticDealerAction();
    }
  }

  /**
   * Handle turn order for dealer games (dealers typically go last)
   */
  private handleDealerTurnOrder(): void {
    const nonDealerPlayers = this.state.players.filter(p => !p.isDealer);
    const dealerPlayers = this.state.players.filter(p => p.isDealer);
    
    // If dealer should play after all players
    const dealerConfig = this.state.rules.players.dealerConfig;
    if (dealerConfig?.playsAfterAllPlayers !== false) {
      // Check if all non-dealers have finished their turns
      const allNonDealersFinished = this.checkIfAllNonDealersFinished();
      
      if (allNonDealersFinished && dealerPlayers.length > 0) {
        // Switch to dealer
        this.state.currentPlayerIndex = this.state.players.findIndex(p => p.isDealer);
      } else {
        // Continue with non-dealer players
        const currentNonDealerIndex = nonDealerPlayers.findIndex(p => 
          p.id === this.state.players[this.state.currentPlayerIndex].id
        );
        const nextNonDealerIndex = (currentNonDealerIndex + 1) % nonDealerPlayers.length;
        this.state.currentPlayerIndex = this.state.players.findIndex(p => 
          p.id === nonDealerPlayers[nextNonDealerIndex].id
        );
      }
    } else {
      // Standard turn progression including dealer
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    }
  }

  /**
   * Check if all non-dealer players have finished their actions (e.g., busted or standing)
   */
  private checkIfAllNonDealersFinished(): boolean {
    const nonDealers = this.state.players.filter(p => !p.isDealer);
    
    // For Blackjack-style games, check if all are busted or standing
    if (this.blackjackMode) {
      const busted = (this.state as any).busted || {};
      const standing = (this.state as any).standing || {};
      
      return nonDealers.every(player => 
        busted[player.id] || standing[player.id]
      );
    }
    
    // For other games, implement specific logic as needed
    return false;
  }

  /**
   * Handle automatic dealer actions (e.g., dealer hits/stands based on rules)
   */
  private handleAutomaticDealerAction(): void {
    const dealer = this.state.players.find(p => p.isDealer);
    if (!dealer || !dealer.dealerRules) return;

    // For Blackjack-style games
    if (this.blackjackMode) {
      this.handleBlackjackDealerAction(dealer);
      return;
    }

    // For other dealer games, implement specific logic
    // This keeps the engine flexible for various dealer games
  }

  /**
   * Handle Blackjack dealer automatic actions
   */
  private handleBlackjackDealerAction(dealer: Player): void {
    const handValues = (this.state as any).handValues || {};
    const dealerValue = handValues[dealer.id] || 0;
    const { mustHitOn = 16, mustStandOn = 17 } = dealer.dealerRules || {};

    if (dealerValue <= mustHitOn) {
      // Dealer must hit
      this.executeAction(dealer.id, 'play');
    } else if (dealerValue >= mustStandOn) {
      // Dealer must stand
      this.executeAction(dealer.id, 'pass');
    }
  }

  private checkWinCondition(): void {
    console.log('Checking win conditions...');
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

  // Helper method for card rank numeric values (needed for sorting/comparison)
  private getCardNumericValue(rank: string): number {
    switch (rank) {
      case 'A': return 1;
      case 'K': return 13;
      case 'Q': return 12;
      case 'J': return 11;
      default: return parseInt(rank) || 0;
    }
  }

  // General method to check if a specific card can be played (used by UI)
  isValidPlay(cardId: string): boolean {
    const player = this.getCurrentPlayer();
    if (!player) return false;
    return this.isValidAction(player.id, 'play', [cardId]);
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
      type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard' | 'grid' | 'center-area' | 'player-zone';
      cards: Card[];
      position?: { x: number; y: number };
      allowDrop?: boolean;
      allowFlip?: boolean;
      faceDown?: boolean;
      label?: string;
      gridSize?: { rows: number; cols: number };
      maxCards?: number;
      playerIndex?: number;
    }>;
    metadata: {
      gameType: string;
      needsTable: boolean;
      centerCard?: Card;
      validDropZones?: string[];
      playerCount: number;
      flexiblePlacement: boolean;
      multipleDecks: boolean;
      tableLayout?: any;
      supportsFlipping: boolean;
      supportsPeeking: boolean;
      hasPlayerZones: boolean;
      hasGridLayout: boolean;
      hasCenterArea: boolean;
    };
  } {
    const rules = this.state.rules;
    const table = (this.state as any).table || {};
    const tableZones = (this.state as any).tableZones || [];
    const layout = this.getOptimalTableLayout();
    
    // Check if rules specify table layout
    const rulesLayout = rules.setup.tableLayout;
    
    // Use rules-based zones if available
    let zones;
    if (rulesLayout?.zones && rulesLayout.zones.length > 0) {
      zones = rulesLayout.zones.map((zoneConfig: any) => {
        const zoneState = tableZones.find((z: any) => z.id === zoneConfig.id);
        return {
          id: zoneConfig.id,
          type: zoneConfig.type,
          cards: zoneState?.cards || [],
          position: zoneConfig.position,
          allowDrop: zoneConfig.allowDrop !== false,
          label: zoneConfig.id,
          faceDown: zoneConfig.faceDown,
          maxCards: zoneConfig.maxCards,
          acceptedSuits: zoneConfig.acceptedSuits,
          acceptedRanks: zoneConfig.acceptedRanks,
          buildDirection: zoneConfig.buildDirection,
        };
      });
    } else {
      zones = this.generateTableZones(table, rules, this.detectTableType(table, rules));
    }
    
    // Determine if game needs a table at all
    const needsTable = this.analyzeTableNeed();
    const tableType = rulesLayout?.type ? this.mapLayoutTypeToTableType(rulesLayout.type) : this.detectTableType(table, rules);
    
    // AI-driven metadata analysis
    const allText = `${rules.name} ${rules.description} ${rules.specialRules?.join(' ')}`.toLowerCase();
    const supportsFlipping = allText.includes('flip') || allText.includes('face-down') || allText.includes('memory');
    const supportsPeeking = allText.includes('peek') || allText.includes('look') || allText.includes('spy');
    const hasPlayerZones = zones.some(z => z.type === 'player-zone');
    const hasGridLayout = allText.includes('grid') || allText.includes('4x4') || zones.some(z => z.type === 'grid');
    const hasCenterArea = allText.includes('center') || zones.some(z => z.type === 'center-area');
    
    return {
      tableType,
      table: needsTable ? table : {},
      layout: rulesLayout?.type || (needsTable ? layout : 'centered'),
      zones,
      metadata: {
        gameType: rules.id,
        needsTable,
        centerCard: this.getCenterCard(),
        validDropZones: this.getValidDropZones(),
        playerCount: this.state.players.length,
        flexiblePlacement: rulesLayout?.allowFlexiblePlacement || this.supportsFlexiblePlacement(),
        multipleDecks: rules.setup.multipleDecks || false,
        tableLayout: rulesLayout,
        supportsFlipping,
        supportsPeeking,
        hasPlayerZones,
        hasGridLayout,
        hasCenterArea,
      }
    };
  }

  /**
   * Map layout type from rules to table type
   */
  private mapLayoutTypeToTableType(layoutType: string): 'none' | 'suit-based' | 'pile-based' | 'sequence' | 'scattered' | 'custom' {
    switch (layoutType) {
      case 'grid': return 'custom'; // Grid layouts should use zone-based rendering
      case 'sequence': return 'sequence';
      case 'scattered': return 'scattered';
      case 'custom': return 'custom';
      case 'centered': return 'pile-based';
      default: return 'custom'; // Default to custom for zone-based games
    }
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
    
    const { name, description, specialRules } = rules;
    const lowerName = name.toLowerCase();
    const lowerDesc = description?.toLowerCase() || '';
    const lowerSpecial = specialRules?.join(' ').toLowerCase() || '';
    const allText = `${lowerName} ${lowerDesc} ${lowerSpecial}`;
    
    // AI-enhanced detection for Memory Palace and similar games
    const hasMemoryElements = allText.includes('memory') || allText.includes('flip') || allText.includes('match');
    const hasGridLayout = allText.includes('grid') || allText.includes('4x4') || allText.includes('3x3') || allText.includes('16 cards');
    const hasCenterArea = allText.includes('center') || allText.includes('sequence') || allText.includes('build sequences');
    
    // Memory Palace detection
    if (hasMemoryElements && (hasGridLayout || hasCenterArea)) {
      return 'custom'; // Memory Palace uses custom layout
    }
    
    // PRIORITY 1: Check for sequence games - these should take precedence!
    const hasSequenceRules = allText.includes('sequence') || 
                             allText.includes('previous card') ||
                             allText.includes('last card') ||
                             allText.includes('numbers') ||
                             allText.includes('different from') ||
                             allText.includes('3, 6, or 9') ||
                             allText.includes('consecutive') ||
                             allText.includes('build') ||
                             rules.setup.tableLayout?.type === 'sequence';
    
    if (hasSequenceRules) {
      console.log('🎯 Detected SEQUENCE game type from:', allText);
      return 'sequence';
    }
    
    // PRIORITY 2: Only check suit-based if explicitly mentioned
    const hasSuitKeys = Object.keys(table).some(key => 
      ['hearts', 'diamonds', 'clubs', 'spades'].includes(key)
    );
    const explicitlySuitBased = allText.includes('suit') || 
                                allText.includes('hearts') || 
                                allText.includes('diamonds') ||
                                allText.includes('clubs') ||
                                allText.includes('spades');
    
    if (hasSuitKeys && explicitlySuitBased) {
      console.log('🃏 Detected SUIT-BASED game type');
      return 'suit-based';
    }
    
    // PRIORITY 3: Check for pile-based games
    const hasPileRules = allText.includes('pile') || allText.includes('stack');
    
    if (hasPileRules) return 'pile-based';
    
    // PRIORITY 4: Check for scattered/search games
    const hasScatteredRules = allText.includes('scatter') || 
                             allText.includes('find') || 
                             allText.includes('search');
    
    if (hasScatteredRules) return 'scattered';
    
    // DEFAULT: If playing cards to table/center, assume sequence
    if (allText.includes('play') && (allText.includes('table') || allText.includes('center'))) {
      console.log('🎯 Defaulting to SEQUENCE game type (play to table/center)');
      return 'sequence';
    }
    
    return 'sequence'; // Default to sequence instead of custom
  }

  /**
   * Generate table zones based on game type and AI analysis
   */
  private generateTableZones(table: any, rules: GameRules, tableType: string): Array<{
    id: string;
    type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard' | 'grid' | 'center-area' | 'player-zone';
    cards: Card[];
    position?: { x: number; y: number };
    allowDrop?: boolean;
    allowFlip?: boolean;
    faceDown?: boolean;
    label?: string;
    gridSize?: { rows: number; cols: number };
    maxCards?: number;
    playerIndex?: number;
  }> {
    const zones: Array<{
      id: string;
      type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard' | 'grid' | 'center-area' | 'player-zone';
      cards: Card[];
      position?: { x: number; y: number };
      allowDrop?: boolean;
      allowFlip?: boolean;
      faceDown?: boolean;
      label?: string;
      gridSize?: { rows: number; cols: number };
      maxCards?: number;
      playerIndex?: number;
    }> = [];
    
    const { name, description, specialRules } = rules;
    const allText = `${name} ${description} ${specialRules?.join(' ')}`.toLowerCase();
    
  switch (tableType) {
      case 'none':
        // No table zones needed
        break;
        
      case 'custom':
        // AI-driven custom zone generation for games like Memory Palace
        return this.generateCustomZones(table, rules, allText);
        
      case 'suit-based':
        // For broad compatibility we no longer auto-create 4 suit columns unless explicitly required.
        // Instead collapse into a single play-area unless table explicitly contains suit arrays.
        if (table && ['hearts','diamonds','clubs','spades'].some(k => Array.isArray(table[k]) && table[k].length)) {
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
        } else {
          zones.push({ id: 'play-area', type: 'sequence', cards: [], allowDrop: true, label: 'Play Area' });
        }
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
        
      case 'sequence':
        zones.push({ id: 'play-area', type: 'sequence', cards: Object.values(table).flat() as Card[] || [], allowDrop: true, label: 'Play Area' });
        break;

      default:
        zones.push({ id: 'main-area', type: 'pile', cards: Object.values(table).flat() as Card[] || [], allowDrop: true, label: 'Game Area' });
    }
    
    return zones;
  }

  /**
   * Generate custom zones for complex games like Memory Palace
   */
  private generateCustomZones(_table: any, _rules: GameRules, allText: string): Array<{
    id: string;
    type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard' | 'grid' | 'center-area' | 'player-zone';
    cards: Card[];
    position?: { x: number; y: number };
    allowDrop?: boolean;
    allowFlip?: boolean;
    faceDown?: boolean;
    label?: string;
    gridSize?: { rows: number; cols: number };
    maxCards?: number;
    playerIndex?: number;
  }> {
    const zones: Array<{
      id: string;
      type: 'pile' | 'sequence' | 'drop-zone' | 'deck' | 'discard' | 'grid' | 'center-area' | 'player-zone';
      cards: Card[];
      position?: { x: number; y: number };
      allowDrop?: boolean;
      allowFlip?: boolean;
      faceDown?: boolean;
      label?: string;
      gridSize?: { rows: number; cols: number };
      maxCards?: number;
      playerIndex?: number;
    }> = [];

    // Detect Memory Palace type games
    const hasMemoryElements = allText.includes('memory') || allText.includes('flip') || allText.includes('match');
    const hasGridLayout = allText.includes('grid') || allText.includes('4x4') || allText.includes('16 cards');
    const hasCenterArea = allText.includes('center') || allText.includes('sequence') || allText.includes('build sequences');
    
    if (hasMemoryElements && hasGridLayout) {
      // Create memory grid zone
      zones.push({
        id: 'memory-grid',
        type: 'grid',
        cards: this.state.tableZones?.find(z => z.id === 'memory-grid')?.cards || [],
        allowFlip: true,
        faceDown: true,
        label: 'Memory Grid',
        gridSize: { rows: 4, cols: 4 },
        position: { x: 50, y: 50 }
      });
    }
    
    if (hasCenterArea) {
      // Create center area for building sequences
      zones.push({
        id: 'center-area',
        type: 'center-area',
        cards: this.state.tableZones?.find(z => z.id === 'center-area')?.cards || [],
        allowDrop: true,
        label: 'Center Area',
        position: { x: 400, y: 300 }
      });
    }
    
    // Always add deck and discard zones for card games
    zones.push({
      id: 'deck',
      type: 'deck',
      cards: [],
      allowDrop: false,
      label: 'Deck',
      position: { x: 50, y: 400 }
    });
    
    zones.push({
      id: 'discard',
      type: 'discard',
      cards: [],
      allowDrop: true,
      label: 'Discard',
      position: { x: 150, y: 400 }
    });
    
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

  // Enhanced method to get valid actions that considers game rules
  getValidActionsForCurrentPlayer(): GameAction[] {
    const player = this.getCurrentPlayer();
    if (!player || !player.isActive) return [];
    
    const currentPhase = this.state.currentPhase || 'playing';
    const phaseObj = this.state.rules.turnStructure?.phases?.find(phase => phase.name === currentPhase);
    const allowedActions = phaseObj?.actions || this.state.rules.actions;
    
    // General validation for all games
    const validActions: GameAction[] = [];
    
    for (const action of allowedActions) {
      if (this.isValidAction(player.id, action)) {
        validActions.push(action);
      }
    }
    
    return validActions;
  }

  /**
   * Initialize AI action engine with API key
   */
  initializeAIActions(apiKey: string): void {
    this.aiActionEngine = new AIActionTemplateEngine(apiKey);
    
    // Register complex action templates for testing
    this.registerComplexActionTemplates();
  }

  /**
   * Register pre-built complex action templates for advanced gameplay
   */
  private registerComplexActionTemplates(): void {
    if (!this.aiActionEngine) return;

    // Import and register complex templates
    import('../utils/complexTestGames').then(({ complexActionTemplates }) => {
      for (const template of complexActionTemplates) {
        this.aiActionEngine!.getAvailableTemplates().set(template.id, template);
      }
      console.log(`🎮 Registered ${complexActionTemplates.length} complex AI action templates`);
    }).catch(error => {
      console.warn('Failed to load complex action templates:', error);
    });
  }

  /**
   * Check if an action is AI-generated (using templates)
   */
  private isAIGeneratedAction(action: string): boolean {
    return this.aiActionEngine?.getTemplate(action) !== undefined;
  }

  /**
   * Execute an AI-generated action using templates
   */
  private executeAIAction(
    action: string,
    player: Player,
    cardIds?: string[],
    target?: string
  ): string {
    if (!this.aiActionEngine) {
      throw new Error('AI Action Engine not initialized');
    }

    try {
      return this.aiActionEngine.executeTemplateAction(
        action,
        this.state,
        this.state.rules,
        player.id,
        {}, // parameters - could be extracted from UI or rules
        cardIds,
        target
      );
    } catch (error) {
      throw new Error(`Failed to execute AI action ${action}: ${error}`);
    }
  }

  /**
   * Generate a new custom action using AI
   */
  async generateCustomAction(
    actionName: string,
    description: string,
    apiKey?: string
  ): Promise<ActionTemplate | null> {
    if (!this.aiActionEngine && apiKey) {
      this.initializeAIActions(apiKey);
    }

    if (!this.aiActionEngine) {
      console.warn('AI Action Engine not available');
      return null;
    }

    try {
      return await this.aiActionEngine.generateCustomAction(
        actionName,
        description,
        { state: this.state, rules: this.state.rules }
      );
    } catch (error) {
      console.error('Failed to generate custom action:', error);
      return null;
    }
  }

  /**
   * Get all available AI-generated actions
   */
  getAvailableAIActions(): string[] {
    if (!this.aiActionEngine) return [];
    
    return Array.from(this.aiActionEngine.getAvailableTemplates().keys());
  }
}
