// Card and Deck Types
export interface Card {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number; // For blackjack-style games
  faceUp: boolean;
  selected: boolean;
}

export type Suit = Card['suit'];
export type Rank = Card['rank'];

// Game Rule Types
export interface GameRules {
  id: string;
  name: string;
  description: string;
  players: {
    min: number;
    max: number;
    recommended: number;
    /**
     * Whether this game requires a dealer
     */
    requiresDealer?: boolean;
    /**
     * Dealer configuration for dealer games
     */
    dealerConfig?: {
      isBot: boolean; // Whether dealer is AI-controlled
      name?: string; // Custom dealer name
      mustHitOn?: number; // Dealer hits on this value or below
      mustStandOn?: number; // Dealer stands on this value or above
      revealsCardAt?: 'start' | 'end' | 'never'; // When to reveal hole card
      playsAfterAllPlayers?: boolean; // Dealer acts last
    };
    /**
     * For betting/poker games
     */
    bettingConfig?: {
      initialChips: number;
      blinds?: { small: number; big: number };
      ante?: number;
      maxBet?: number;
      bettingRounds?: Array<{
        name: string;
        actions: ('bet' | 'call' | 'raise' | 'fold' | 'check' | 'all-in')[];
      }>;
    };
  };
  setup: {
    cardsPerPlayer: number;
    /**
     * Alternative to cardsPerPlayer for asymmetric dealing.
     * Array where each index corresponds to player position.
     * If provided, overrides cardsPerPlayer.
     * Example: [3, 7, 7, 7] means player 0 gets 3 cards, others get 7.
     */
    cardsPerPlayerPosition?: number[];
    deckSize: number;
    specialCards?: string[];
    /**
     * If true, drawn cards go to the player's hand (default for most games).
     * If false, drawn cards go to the discard pile (for draw-and-reveal games).
     */
    keepDrawnCard?: boolean;
    /**
     * If true, game uses multiple decks for enhanced gameplay
     */
    multipleDecks?: boolean;
    /**
     * Number of decks to use (defaults to 1)
     */
    numberOfDecks?: number;
    /**
     * Advanced table layout configuration for unlimited flexibility
     */
    tableLayout?: {
      type: 'grid' | 'centered' | 'sequence' | 'scattered' | 'custom';
      allowFlexiblePlacement: boolean;
      zones?: Array<{
        id: string;
        type: 'pile' | 'sequence' | 'grid' | 'deck' | 'discard' | 'foundation' | 'tableau';
        initialCards?: number;
        faceDown?: boolean;
        position?: { x: number; y: number };
        maxCards?: number;
        acceptedSuits?: string[];
        acceptedRanks?: string[];
        buildDirection?: 'up' | 'down' | 'both';
      }>;
      /**
       * Allow cards to be placed anywhere on the table
       */
      freeformPlacement?: boolean;
      /**
       * Maximum number of separate card areas on table
       */
      maxTableAreas?: number;
    };
    /**
     * Optional random hand size range (e.g., [3,10]) – each player is dealt random number in range.
     * Takes precedence over cardsPerPlayer/cardsPerPlayerPosition when present.
     */
    randomHandRange?: [number, number];
    /**
     * Progressive per-round dealing configuration (e.g., one card per round until condition met)
     */
    progressiveDeal?: {
      cardsPerRound: number; // typically 1
      until?: 'all_have_rank' | 'any_has_rank' | 'target_value_reached';
      rank?: Rank; // e.g., 'K' for king games
      maxRounds?: number; // safety cap
    };
    /**
     * Arithmetic combination target for games where players combine card values to reach / diff to target.
     * Example: targetValue = 10 means players can play a single card of value 10 OR combination where sums or differences produce 10.
     */
    arithmeticTarget?: number;
    /**
     * Whether the game is explicitly a no-op sandbox (engine supplies minimal actions).
     */
    noopGame?: boolean;
    /**
     * Single-player draw-until condition (e.g., get rank '10' or any suit). If rank provided, stop when drawn.
     */
    singlePlayerDrawUntil?: {
      rank?: Rank; // if omitted, any occurrence of numeric value in arithmeticTarget or 10-of-any-suit logic
      suit?: Suit; // optional suit restriction
    };
    /** All cards begin face-up in a single central pile (no hands dealt initially) */
    allCardsStartInPile?: boolean;
    /** If true central pile cards are face up */
    centralPileFaceUp?: boolean;
    /** Elimination mode: players drawing but must find specific rank or be eliminated */
    eliminateOnMissRank?: {
      rank: Rank; // e.g. 'K' for king-or-go-home
      eliminateIfNotRank?: boolean; // default true
      winOnRank?: boolean; // default true (first to get rank wins)
    };
  };
  objective: GameObjective;
  turnStructure: TurnStructure;
  actions: GameAction[];
  winConditions: WinCondition[];
  specialRules?: string[];
  /**
   * Optional table layout preference for the UI.
   * If not specified, the engine will determine the optimal layout.
   */
  tableLayout?: {
    preferred?: 'grid' | 'centered' | 'sequence';
    allowFlexiblePlacement?: boolean;
    centerCard?: string; // e.g., "7" for games that center around sevens
  };
  aiPrompt?: string; // For GPT-generated rules
}

export interface GameObjective {
  type: 'match_pairs' | 'highest_score' | 'empty_hand' | 'collect_sets' | 'avoid_points' | 'custom';
  description: string;
  target?: number;
}

export interface TurnStructure {
  order: 'clockwise' | 'counterclockwise' | 'free';
  phases: TurnPhase[];
  timeLimit?: number;
}

export interface TurnPhase {
  name: string;
  required: boolean;
  actions: string[];
}

export type GameAction = string;

export interface WinCondition {
  type: 'first_to_empty' | 'highest_score' | 'lowest_score' | 'specific_cards' | 'custom';
  description: string;
  target?: number | string[];
}

// Game State Types
export interface GameState {
  id: string;
  rules: GameRules;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  communityCards: Card[];
  /**
   * Flexible table structure for games like Sevens, Solitaire, etc.
   * Can be suit -> Card[] or any other structure as needed by the game.
   */
  table?: Record<string, Card[]> | any;
  /**
   * Advanced table zones for complex layouts (memory games, solitaire, etc.)
   */
  tableZones?: Array<{
    id: string;
    type: 'pile' | 'sequence' | 'grid' | 'deck' | 'discard';
    cards: Card[];
    position?: { x: number; y: number };
    faceDown?: boolean;
    allowDrop?: boolean;
    label?: string;
  }>;
  /**
   * Flipped cards for memory games
   */
  flippedCards?: Card[];
  currentPlayerIndex: number;
  currentPhase: string;
  turn: number;
  round: number;
  scores: Record<string, number>;
  gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
  winner?: string;
  lastAction?: GameActionResult;
  /**
   * Dynamic target value for arithmetic combination games (can be set from rules.setup.arithmeticTarget)
   */
  targetValue?: number;
  /**
   * Tracks rounds of progressive dealing already executed.
   */
  progressiveRounds?: number;
  /**
   * Cached flag when progressive deal completion achieved.
   */
  progressiveComplete?: boolean;
}

export interface Player {
  id: string;
  name: string;
  type: 'human' | 'bot' | 'dealer';
  hand: Card[];
  isActive: boolean;
  score: number;
  position: number;
  avatar?: string;
  /** Player eliminated (cannot take further turns) */
  eliminated?: boolean;
  /**
   * Dealer-specific properties
   */
  isDealer?: boolean;
  /**
   * For games with dealers - whether dealer follows special rules
   */
  dealerRules?: {
    mustHitOn?: number; // e.g., 16 for Blackjack
    mustStandOn?: number; // e.g., 17 for Blackjack
    revealsCardAt?: 'start' | 'end' | 'never'; // When dealer shows hole card
    playsAfterAllPlayers?: boolean; // Dealer goes last
  };
  /**
   * For poker-style games with chips/betting
   */
  chips?: number;
  /**
   * Current bet amount for betting games
   */
  currentBet?: number;
  /**
   * Player status in betting games
   */
  status?: 'active' | 'folded' | 'all-in' | 'busted';
}

export interface GameActionResult {
  playerId: string;
  action: GameAction;
  cards?: string[]; // Card IDs, not full Card objects
  target?: string;
  success: boolean;
  message: string;
  timestamp: number;
}

// UI and Navigation Types
export type GameMode = 'create' | 'play' | 'examples' | 'tutorial';

export interface PredefinedGame {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  difficulty: 'easy' | 'medium' | 'hard';
  playerCount: string;
  duration: string;
  rules: GameRules;
  featured?: boolean;
}

// Rule Builder Types
export interface RuleBuilderStep {
  id: string;
  title: string;
  description: string;
  component: string;
  completed: boolean;
  data?: any;
}

export interface RuleBuilderState {
  currentStep: number;
  steps: RuleBuilderStep[];
  gameData: Partial<GameRules>;
  aiInterpretation?: GameRules;
  isValidating: boolean;
  errors: string[];
}

// AI Integration Types
export interface AIRuleRequest {
  userInput: string;
  structuredData: Partial<GameRules>;
  context?: string;
}

export interface AIRuleResponse {
  rules: GameRules;
  confidence: number;
  suggestions?: string[];
  warnings?: string[];
  clarificationNeeded?: string[];
}

export interface AIBotMove {
  action: GameAction;
  cards?: string[];
  reasoning: string;
  confidence: number;
}

// Animation and UI Types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface CardAnimation {
  type: 'deal' | 'flip' | 'move' | 'highlight' | 'shuffle';
  config: AnimationConfig;
  target?: { x: number; y: number };
}

// Store Types (Zustand)
export interface AppStore {
  // Navigation
  currentPage: string;
  gameMode: GameMode;
  
  // Game State
  currentGame: GameState | null;
  availableGames: PredefinedGame[];
  
  // Rule Builder
  ruleBuilder: RuleBuilderState;
  
  // UI State
  isLoading: boolean;
  notifications: Notification[];
  
  // Actions
  setCurrentPage: (page: string) => void;
  setGameMode: (mode: GameMode) => void;
  createNewGame: (rules: GameRules) => void;
  setGameSchema: (schema: any) => void;
  updateGameState: (state: Partial<GameState>) => void;
  
  // Rule Builder Actions
  updateRuleBuilder: (updates: Partial<RuleBuilderState>) => void;
  updateRuleBuilderStep: (stepIndex: number, data: any) => void;
  nextRuleBuilderStep: () => void;
  previousRuleBuilderStep: () => void;
  resetRuleBuilder: () => void;
  
  // Notification Actions
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading and Games
  setLoading: (isLoading: boolean) => void;
  loadPredefinedGames: (games: PredefinedGame[]) => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}
