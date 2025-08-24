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
  };
  objective: GameObjective;
  turnStructure: TurnStructure;
  actions: GameAction[];
  winConditions: WinCondition[];
  specialRules?: string[];
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
  currentPlayerIndex: number;
  currentPhase: string;
  turn: number;
  round: number;
  scores: Record<string, number>;
  gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
  winner?: string;
  lastAction?: GameActionResult;
}

export interface Player {
  id: string;
  name: string;
  type: 'human' | 'bot';
  hand: Card[];
  isActive: boolean;
  score: number;
  position: number;
  avatar?: string;
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
