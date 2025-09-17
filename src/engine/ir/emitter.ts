// IR Emitter: converts normalized GameRules into IRSkeleton (v0 minimal)
import type { GameRules, WinCondition } from '../../types';
import type { IRSkeleton, PhaseSpec, ActionSpec, Effect, WinConditionIR, Effect as IREffect } from './schema';

interface EmitResult { ir: IRSkeleton; issues: string[]; }

export function emitIR(rules: GameRules): EmitResult {
  const issues: string[] = [];
  // Actions
  const actions: ActionSpec[] = [];
  // Action emission: we intentionally keep validation light; effects rely on runtime-provided selection bridging
  for (const name of rules.actions) {
    switch (name) {
      case 'draw':
        actions.push({ name, effects: [{ kind: 'draw', player: { type: 'current' }, count: 1 }] });
        break;
      case 'pass':
        actions.push({ name, effects: [{ kind: 'endTurn' }] });
        break;
      case 'play': {
        // Move provided (UI-selected) cards from current player's hand to the shared 'table' zone
        const effects: IREffect[] = [
          // selector.match left empty -> runtime will substitute explicit user-selected cards via providedSelection
          { kind: 'moveCard', selector: { source: 'hand', match: {} }, to: { destination: 'zone', zoneId: 'table', faceUp: true } }
        ];
        actions.push({ name, effects });
        break; }
      case 'discard': {
        const effects: IREffect[] = [
          // discard uses same providedSelection bridging pattern
          { kind: 'moveCard', selector: { source: 'hand', match: {} }, to: { destination: 'discard' } }
        ];
        actions.push({ name, effects });
        break; }
      default:
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
  // Ensure a generic 'table' zone exists if actions reference it (play action)
  if (rules.actions.includes('play')) {
    setupEffects.push({ kind: 'createZone', id: 'table', zoneType: 'sequence', faceDown: false });
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
        // Map each card pattern to a hasCard predicate; combine with AND
        const predicates = w.target.map((pattern: any, pi: number) => {
          const rank = pattern.rank || pattern.r || pattern.value; // allow loose forms
          const suit = pattern.suit || pattern.s;
          if (!rank && !suit) {
            issues.push(`specific_cards pattern ${pi} lacks rank/suit; using never predicate`);
            return { kind: 'never' } as any;
          }
          const selector: any = { source: 'hand', match: {} as any };
          if (rank) selector.match.rank = rank;
          if (suit) selector.match.suit = suit;
          return { kind: 'hasCard', player: { type: 'current' }, selector } as any;
        });
        const predicate = predicates.length === 1 ? predicates[0] : { kind: 'and', predicates } as any;
        return { id: `wc-${idx}`, description: w.description, predicate };
      }
      issues.push('specific_cards without target array');
      return { id: `wc-${idx}`, description: w.description, predicate: { kind: 'never' } };
    case 'custom':
    default:
      issues.push(`custom win condition '${w.description}' not yet mapped`);
      return { id: `wc-${idx}`, description: w.description, predicate: { kind: 'always' } };
  }
}
