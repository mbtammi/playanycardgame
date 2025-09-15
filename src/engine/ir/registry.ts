import type { Effect, Predicate, IRSkeleton, IRValidationResult, IRValidationIssue, PhaseSpec, ActionSpec } from './schema';

// Basic predicate evaluator (pure, side-effect free)
export class PredicateEngine {
  private ctx: () => any;
  constructor(ctx: () => any) { this.ctx = ctx; }

  evaluate(p: Predicate): boolean {
    switch (p.kind) {
      case 'always': return true;
      case 'never': return false;
      case 'not': return !this.evaluate(p.predicate);
      case 'and': return p.predicates.every(pr => this.evaluate(pr));
      case 'or': return p.predicates.some(pr => this.evaluate(pr));
      case 'handCount': {
        const { playerStates } = this.ctx();
        const playerIds = this.resolvePlayers(p.player, playerStates);
        return playerIds.every(id => this.compare(playerStates[id].hand.length, p.op, p.value));
      }
      case 'zoneCount': {
        const { zones } = this.ctx();
        const z = zones[p.zone] || [];
        return this.compare(z.length, p.op, p.value);
      }
      case 'scoreCompare': {
        const { playerStates } = this.ctx();
        const ids = this.resolvePlayers(p.player, playerStates);
        return ids.every(id => this.compare(playerStates[id].score || 0, p.op, p.value));
      }
      case 'flag': {
        const { flags } = this.ctx();
        if (p.equals === undefined) return !!flags[p.name];
        return flags[p.name] === p.equals;
      }
      case 'phaseIs': {
        const { phase } = this.ctx();
        return phase === p.phase;
      }
      case 'winnerExists': {
        const { winner } = this.ctx();
        return !!winner;
      }
      case 'hasCard': {
        const { selectCards } = this.ctx();
        const cards = selectCards(p.selector, p.player, p.zone);
        return cards.length > 0;
      }
      default:
        return false;
    }
  }

  private compare(a: number, op: any, b: number): boolean {
    switch (op) {
      case '==': return a === b;
      case '!=': return a !== b;
      case '<': return a < b;
      case '<=': return a <= b;
      case '>': return a > b;
      case '>=': return a >= b;
      default: return false;
    }
  }

  private resolvePlayers(ref: any, playerStates: Record<string, any>): string[] {
    const ids = Object.keys(playerStates);
    if (ref.type === 'current') return [this.ctx().currentPlayerId];
    if (ref.type === 'all') return ids;
    if (ref.type === 'others') return ids.filter(id => id !== this.ctx().currentPlayerId);
    if (ref.type === 'player') return [ref.id];
    return [];
  }
}

// Effect executor applies a list of effects atomically.
export class EffectExecutor {
  private ctx: () => any;
  private predicateEngine: PredicateEngine;
  constructor(ctx: () => any, predicateEngine: PredicateEngine) { this.ctx = ctx; this.predicateEngine = predicateEngine; }

  run(effects: Effect[]): void {
    for (const eff of effects) {
      if (!eff) continue;
      switch (eff.kind) {
        case 'draw': this.execDraw(eff); break;
        case 'modifyScore': this.execModifyScore(eff); break;
        case 'setFlag': this.execSetFlag(eff); break;
        case 'eliminatePlayer': this.execEliminate(eff); break;
        case 'moveCard': this.execMoveCard(eff); break;
        case 'conditional': this.execConditional(eff); break;
        case 'loop': this.execLoop(eff); break;
        case 'createZone': this.execCreateZone(eff); break;
        case 'endTurn': this.ctx().endTurnFlag = true; break;
        case 'endGame': this.ctx().endGameFlag = eff.reason || 'ended'; break;
        case 'composite': this.run(eff.effects); break;
        case 'reveal': /* placeholder */ break;
      }
      if (this.ctx().endGameFlag) break; // hard stop
      if (this.ctx().endTurnFlag) break; // stop further effects in action
    }
  }

  private execDraw(eff: any) {
    const { drawCardToPlayer } = this.ctx();
    const targets = this.resolvePlayers(eff.player);
    targets.forEach(pid => {
      for (let i = 0; i < eff.count; i++) drawCardToPlayer(pid, eff.to || 'hand', eff.faceUp !== false);
    });
  }

  private execModifyScore(eff: any) {
    const { playerStates } = this.ctx();
    this.resolvePlayers(eff.player).forEach(pid => {
      playerStates[pid].score = (playerStates[pid].score || 0) + eff.delta;
    });
  }

  private execSetFlag(eff: any) { this.ctx().flags[eff.name] = eff.value; }
  private execEliminate(eff: any) {
    const { playerStates } = this.ctx();
    this.resolvePlayers(eff.player).forEach(pid => { playerStates[pid].eliminated = true; });
  }

  private execMoveCard(eff: any) {
    const { selectCards, moveCardTo } = this.ctx();
    const cards = selectCards(eff.selector);
  cards.forEach((c: any) => moveCardTo(c, eff.to));
  }

  private execConditional(eff: any) {
    if (this.predicateEngine.evaluate(eff.if)) this.run(eff.then);
    else if (eff.else) this.run(eff.else);
  }

  private execLoop(eff: any) {
    let steps = 0;
    while (this.predicateEngine.evaluate(eff.while)) {
      if (eff.max && steps >= eff.max) break;
      this.run(eff.body);
      steps++;
      if (this.ctx().endTurnFlag || this.ctx().endGameFlag) break;
    }
  }

  private execCreateZone(eff: any) {
    const { zones } = this.ctx();
    if (!zones[eff.id]) zones[eff.id] = [];
  }

  private resolvePlayers(ref: any): string[] {
    const { playerStates, currentPlayerId } = this.ctx();
    const ids = Object.keys(playerStates);
    if (ref.type === 'current') return [currentPlayerId];
    if (ref.type === 'all') return ids;
    if (ref.type === 'others') return ids.filter(i => i !== currentPlayerId);
    if (ref.type === 'player') return [ref.id];
    return [];
  }
}

// IR static validation
export function validateIR(ir: IRSkeleton): IRValidationResult {
  const issues: IRValidationIssue[] = [];
  const actionNames = new Set(ir.actions.map(a => a.name));
  // Phase references check
  ir.phases.forEach(p => {
    p.actions.forEach(a => { if (!actionNames.has(a)) issues.push({ level: 'error', message: `Phase '${p.name}' references unknown action '${a}'` }); });
    if (p.nextPhase && !ir.phases.find(ph => ph.name === p.nextPhase)) {
      issues.push({ level: 'error', message: `Phase '${p.name}' nextPhase '${p.nextPhase}' not defined` });
    }
  });
  if (ir.winConditions.length === 0) issues.push({ level: 'warning', message: 'No win conditions defined' });
  return { valid: !issues.some(i => i.level === 'error'), issues };
}

// Minimal factory to wrap legacy actions into IR skeleton automatically
export function legacyWrapToIR(actions: string[]): IRSkeleton {
  const defaultPhase: PhaseSpec = { name: 'playing', actions: actions.slice() };
  const ir: IRSkeleton = {
    version: 0,
    phases: [defaultPhase],
    actions: actions.map(a => wrapAction(a)),
    setupEffects: [],
    winConditions: [{ id: 'empty-hand', description: 'First to empty hand', predicate: { kind: 'handCount', player: { type: 'current' }, op: '==', value: 0 } }]
  };
  return ir;
}

function wrapAction(name: string): ActionSpec {
  if (name === 'draw') {
    return { name, effects: [{ kind: 'draw', player: { type: 'current' }, count: 1 }] };
  }
  if (name === 'pass') {
    return { name, effects: [{ kind: 'endTurn' }] };
  }
  // placeholder for others
  return { name, effects: [] };
}
