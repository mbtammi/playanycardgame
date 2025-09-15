// IR v0 Schema: foundational types for universal card game expression
// Keep minimal but extensible; versioned for forward compatibility

export const IR_VERSION = 0 as const;

// Basic identifiers
export type PlayerRef = { type: 'player'; id: string } | { type: 'current' } | { type: 'all' } | { type: 'others' };
export type ZoneId = string;
export type FlagName = string;

// Card selector (abstract reference)
export interface CardSelector {
  source: 'hand' | 'zone' | 'deck' | 'discard' | 'table';
  zoneId?: ZoneId; // required if source === 'zone'
  match?: {
    rank?: string | string[];
    suit?: string | string[];
    tag?: string | string[]; // future extensibility
  };
  quantity?: number | { min?: number; max?: number };
  /** whether selection is random when multiple match */
  random?: boolean;
}

// Predicates
export type Predicate =
  | { kind: 'handCount'; player: PlayerRef; op: Op; value: number }
  | { kind: 'zoneCount'; zone: ZoneId; op: Op; value: number }
  | { kind: 'hasCard'; player?: PlayerRef; zone?: ZoneId; selector: CardSelector }
  | { kind: 'scoreCompare'; player: PlayerRef; op: Op; value: number }
  | { kind: 'flag'; name: FlagName; equals?: any }
  | { kind: 'phaseIs'; phase: string }
  | { kind: 'not'; predicate: Predicate }
  | { kind: 'and'; predicates: Predicate[] }
  | { kind: 'or'; predicates: Predicate[] }
  | { kind: 'winnerExists' }
  | { kind: 'always' }
  | { kind: 'never' };

export type Op = '==' | '!=' | '<' | '<=' | '>' | '>=';

// Effects (atomic or composite). All are side-effect descriptions only.
export type Effect =
  | { kind: 'moveCard'; selector: CardSelector; to: { destination: 'hand' | 'discard' | 'zone' | 'eliminate'; zoneId?: ZoneId; faceUp?: boolean } }
  | { kind: 'draw'; player: PlayerRef; count: number; to?: 'hand' | 'discard'; faceUp?: boolean }
  | { kind: 'reveal'; selector: CardSelector }
  | { kind: 'modifyScore'; player: PlayerRef; delta: number }
  | { kind: 'setFlag'; name: FlagName; value: any }
  | { kind: 'eliminatePlayer'; player: PlayerRef }
  | { kind: 'createZone'; id: ZoneId; zoneType: 'pile' | 'sequence' | 'grid' | 'custom'; faceDown?: boolean }
  | { kind: 'conditional'; if: Predicate; then: Effect[]; else?: Effect[] }
  | { kind: 'loop'; while: Predicate; body: Effect[]; max?: number }
  | { kind: 'composite'; effects: Effect[] }
  | { kind: 'endTurn' }
  | { kind: 'endGame'; reason?: string };

// Action specification (player-invoked)
export interface ActionSpec {
  name: string; // e.g., 'play', 'draw', 'pass', 'bid'
  description?: string;
  validate?: Predicate[]; // all must be true
  effects: Effect[]; // executed if validation passes
  hidden?: boolean; // not shown in UI
}

export interface PhaseSpec {
  name: string;
  actions: string[]; // list of action names allowed
  entryEffects?: Effect[];
  exitCondition?: Predicate; // when satisfied, phase ends
  nextPhase?: string; // default transition
}

export interface WinConditionIR {
  id: string;
  description: string;
  predicate: Predicate;
  ranking?: 'highestScore' | 'lowestScore'; // for tie resolution modes later
}

export interface IRSkeleton {
  version: number;
  phases: PhaseSpec[];
  actions: ActionSpec[];
  setupEffects: Effect[];
  winConditions: WinConditionIR[];
  // optional meta / diagnostics
  meta?: { sourceTransforms?: string[]; notes?: string[] };
}

// Validation result
export interface IRValidationIssue {
  level: 'error' | 'warning';
  message: string;
  context?: any;
}

export interface IRValidationResult {
  valid: boolean;
  issues: IRValidationIssue[];
}

// Utility guards
export function isPredicate(obj: any): obj is Predicate { return obj && typeof obj === 'object' && 'kind' in obj; }
export function isEffect(obj: any): obj is Effect { return obj && typeof obj === 'object' && 'kind' in obj; }
