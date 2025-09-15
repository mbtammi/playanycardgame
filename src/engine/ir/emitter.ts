// IR Emitter: converts normalized GameRules into IRSkeleton (v0 minimal)
import type { GameRules, WinCondition } from '../../types';
import type { IRSkeleton, PhaseSpec, ActionSpec, Effect, WinConditionIR } from './schema';

interface EmitResult { ir: IRSkeleton; issues: string[]; }

export function emitIR(rules: GameRules): EmitResult {
  const issues: string[] = [];
  // Actions
  const actions: ActionSpec[] = [];
  for (const name of rules.actions) {
    if (name === 'draw') {
      actions.push({ name, effects: [{ kind: 'draw', player: { type: 'current' }, count: 1 }] });
    } else if (name === 'pass') {
      actions.push({ name, effects: [{ kind: 'endTurn' }] });
    } else if (name === 'play') {
      // Placeholder: real logic will be predicate + moveCard effects in future
      actions.push({ name, effects: [] });
    } else if (name === 'discard') {
      actions.push({ name, effects: [] });
    } else {
      actions.push({ name, effects: [] });
    }
  }

  // Phases
  const phases: PhaseSpec[] = (rules.turnStructure?.phases || []).map(p => ({
    name: p.name,
    actions: p.actions.slice(),
  }));
  if (phases.length === 0) {
    phases.push({ name: 'playing', actions: rules.actions.slice() });
  }

  // Setup effects (progressiveDeal & central pile minimal flags)
  const setupEffects: Effect[] = [];
  if (rules.setup.progressiveDeal) {
    setupEffects.push({ kind: 'setFlag', name: 'progressiveDeal', value: rules.setup.progressiveDeal });
  }
  if ((rules.setup as any).allCardsStartInPile) {
    setupEffects.push({ kind: 'createZone', id: 'central-pile', zoneType: 'pile', faceDown: !(rules.setup as any).centralPileFaceUp });
  }

  // WinConditions -> IR
  const winConditions: WinConditionIR[] = rules.winConditions.map((w, idx) => mapWinCondition(w, idx, issues));
  if (winConditions.length === 0) {
    winConditions.push({ id: 'fallback-empty-hand', description: 'First to empty hand', predicate: { kind: 'handCount', player: { type: 'current' }, op: '==', value: 0 } });
  }

  const ir: IRSkeleton = {
    version: 0,
    phases,
    actions,
    setupEffects,
    winConditions,
    meta: { sourceTransforms: ['emitter-v0'], notes: issues }
  };
  return { ir, issues };
}

function mapWinCondition(w: WinCondition, idx: number, issues: string[]): WinConditionIR {
  switch (w.type) {
    case 'first_to_empty':
      return { id: `wc-${idx}`, description: w.description, predicate: { kind: 'handCount', player: { type: 'current' }, op: '==', value: 0 } };
    case 'highest_score':
      if (typeof w.target === 'number') {
        return { id: `wc-${idx}`, description: w.description, predicate: { kind: 'scoreCompare', player: { type: 'current' }, op: '>=', value: w.target } };
      }
      return { id: `wc-${idx}`, description: w.description, predicate: { kind: 'always' } };
    case 'lowest_score':
      // No direct lowest comparator yet; placeholder predicate
      issues.push('lowest_score win condition currently non-deterministic in IR v0');
      return { id: `wc-${idx}`, description: w.description, predicate: { kind: 'always' } };
    case 'specific_cards':
      if (Array.isArray(w.target) && w.target.length) {
        // Simplify: require handCount == number of patterns as proxy (placeholder until card match predicates exist)
        return { id: `wc-${idx}`, description: w.description, predicate: { kind: 'handCount', player: { type: 'current' }, op: '>=', value: w.target.length } };
      }
      issues.push('specific_cards without target array');
      return { id: `wc-${idx}`, description: w.description, predicate: { kind: 'never' } };
    case 'custom':
    default:
      issues.push(`custom win condition '${w.description}' not yet mapped`);
      return { id: `wc-${idx}`, description: w.description, predicate: { kind: 'always' } };
  }
}
