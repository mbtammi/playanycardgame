// Lightweight runtime adapter to bridge existing GameEngine state with IR executor
import type { IRSkeleton } from './schema';
import { PredicateEngine, EffectExecutor, validateIR, legacyWrapToIR } from './registry';

export interface IRExecutionContext {
  ir: IRSkeleton;
  // adaptor functions and state slices; kept generic to avoid tight coupling
  currentPlayerId: string;
  playerStates: Record<string, any>;
  zones: Record<string, any[]>; // zoneId -> cards
  flags: Record<string, any>;
  phase: string;
  winner?: string;
  endTurnFlag?: boolean;
  endGameFlag?: string;
  providedSelection?: any[]; // transient cards explicitly chosen by user for current action
  // required operations wired from GameEngine
  drawCardToPlayer: (playerId: string, dest: 'hand' | 'discard', faceUp: boolean) => void;
  selectCards: (selector: any, playerRef?: any, zoneId?: string) => any[];
  moveCardTo: (card: any, to: { destination: string; zoneId?: string; faceUp?: boolean }) => void;
}

export class IRRuntime {
  private predicateEngine: PredicateEngine;
  private effectExecutor: EffectExecutor;
  private ctx: IRExecutionContext;

  constructor(ctx: IRExecutionContext) {
    this.ctx = ctx;
    this.predicateEngine = new PredicateEngine(() => this.ctx);
    this.effectExecutor = new EffectExecutor(() => this.ctx, this.predicateEngine);
  }

  static fromLegacy(actions: string[]): IRRuntime {
    const ir = legacyWrapToIR(actions);
    const runtime = new IRRuntime({
      ir,
      currentPlayerId: '',
      playerStates: {},
      zones: {},
      flags: {},
      phase: 'playing',
      drawCardToPlayer: () => {},
      selectCards: () => [],
      moveCardTo: () => {},
    });
    return runtime;
  }

  validate() { return validateIR(this.ctx.ir); }

  runSetup() { this.effectExecutor.run(this.ctx.ir.setupEffects); }

  // Expose internal context for adapter synchronization (kept lightweight; future: provide setters)
  getContext() { return this.ctx; }

  executeAction(name: string) {
    const spec = this.ctx.ir.actions.find(a => a.name === name);
    if (!spec) return { success: false, message: `Unknown action ${name}` };
    if (spec.validate && !spec.validate.every(p => this.predicateEngine.evaluate(p))) {
      return { success: false, message: 'Validation failed' };
    }
    this.effectExecutor.run(spec.effects);
    return { success: true, message: 'OK', endTurn: !!this.ctx.endTurnFlag, endGame: this.ctx.endGameFlag };
  }
}
