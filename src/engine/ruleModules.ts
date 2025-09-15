import type { GameRules } from '../types';

/** A generic transformation module interface */
export type RuleTransform = (rules: GameRules) => GameRules;

// Utility: deep clone minimal (structuredClone if available)
function clone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }

// Helper: ensure actions array exists
function ensureActions(r: any) { r.actions = Array.isArray(r.actions) ? r.actions : []; return r; }

// Regex helpers kept generic
const rankTokens = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
// suit tokens not currently needed directly (suit mention handled inside regex)

// 1. Random hand range detection (pattern: "random" + "between X and Y")
export const randomHandRangeModule: RuleTransform = (rules) => {
  const r = clone(rules); ensureActions(r);
  const text = `${r.name} ${r.description} ${(r.specialRules||[]).join(' ')}`.toLowerCase();
  const m = text.match(/random[^\d]*(\d+)\D+(\d+)/);
  if (m) {
    const a = parseInt(m[1],10), b = parseInt(m[2],10);
    if (!isNaN(a) && !isNaN(b)) {
      const min = Math.min(a,b), max = Math.max(a,b);
      r.setup.randomHandRange = [min,max];
      r.setup.cardsPerPlayer = 0;
    }
  }
  return r;
};

// 2. Progressive deal (generic) if text suggests per-round accumulation until a condition on a rank
export const progressiveDealModule: RuleTransform = (rules) => {
  const r = clone(rules); ensureActions(r);
  const text = `${r.name} ${r.description} ${(r.specialRules||[]).join(' ')}`.toLowerCase();
  // Detect phrase like "each round" + any rank token
  const roundy = /each round|per round|one card at a time|one card per round/.test(text);
  if (roundy) {
    const mentionedRank = rankTokens.find(rt => new RegExp(`\\b${rt.toLowerCase()}\\b`).test(text));
    if (mentionedRank) {
  if (!r.setup.progressiveDeal) r.setup.progressiveDeal = { cardsPerRound: 1 } as any;
  (r.setup.progressiveDeal as any).rank = (r.setup.progressiveDeal as any).rank || mentionedRank;
      // Termination heuristic: if text implies everyone must obtain the rank ("everyone", "all players")
      if (/everyone|all players/.test(text)) {
  (r.setup.progressiveDeal as any).until = (r.setup.progressiveDeal as any).until || 'all_have_rank';
      } else {
  (r.setup.progressiveDeal as any).until = (r.setup.progressiveDeal as any).until || 'any_has_rank';
      }
      if (!r.actions.includes('draw')) r.actions.push('draw');
      if (!r.actions.includes('pass')) r.actions.push('pass');
    }
  }
  return r;
};

// 3. Central pile module (any language implying all cards together)
export const centralPileModule: RuleTransform = (rules) => {
  const r = clone(rules); ensureActions(r);
  const text = `${r.name} ${r.description} ${(r.specialRules||[]).join(' ')}`.toLowerCase();
  if (/(all|every) card(s)? (in|into) (a|one) pile|big pile|massive pile|pile on the table/.test(text)) {
    r.setup.allCardsStartInPile = true;
    r.setup.centralPileFaceUp = /face ?up|visible/.test(text) || true;
    if (!r.actions.includes('draw')) r.actions.push('draw');
  }
  return r;
};

// 4. Elimination on miss of a rank (generic) patterns: "must draw a X" "draw a X to stay" "get a X or" remove others
export const eliminationOnRankModule: RuleTransform = (rules) => {
  const r = clone(rules); ensureActions(r);
  const text = `${r.name} ${r.description} ${(r.specialRules||[]).join(' ')}`.toLowerCase();
  const eliminator = /(must|need to|have to) draw a ([2-9]|10|[ajqk])|draw a ([2-9]|10|[ajqk]) to stay|or go home|or be out|eliminated if not/;
  const m = text.match(eliminator);
  if (m) {
    const rankRaw = (m[2]||m[3]||'').toUpperCase();
    const rank = rankTokens.includes(rankRaw) ? rankRaw : 'K';
    r.setup.eliminateOnMissRank = r.setup.eliminateOnMissRank || { rank: rank as any, eliminateIfNotRank: true, winOnRank: true };
    if (!r.actions.includes('draw')) r.actions.push('draw');
    if (!r.actions.includes('pass')) r.actions.push('pass');
    // Provide a generic win condition wording if none mentions the target rank
    const hasRankWin = (r.winConditions||[]).some((w:any)=> new RegExp(rank,'i').test(w.description||''));
    if (!hasRankWin) {
      r.winConditions = r.winConditions || [];
      r.winConditions.push({ type: 'custom', description: `First player to reveal a ${rank} wins.` });
    }
  }
  return r;
};

// 5. Arithmetic target module (any number + phrase like equal / reach)
export const arithmeticTargetModule: RuleTransform = (rules) => {
  const r = clone(rules); ensureActions(r);
  const text = `${r.name} ${r.description} ${(r.specialRules||[]).join(' ')}`.toLowerCase();
  const match = text.match(/reach (\d+)|total (?:of )?(\d+)|make (\d+) exact|equal (?:to )?(\d+)/);
  if (match) {
    const val = parseInt(match[1]||match[2]||match[3]||match[4],10);
    if (!isNaN(val)) r.setup.arithmeticTarget = val;
    if (!r.actions.includes('play')) r.actions.push('play');
  }
  return r;
};

// 6. No-op sandbox
export const noopModule: RuleTransform = (rules) => {
  const r = clone(rules); ensureActions(r);
  const text = `${r.name} ${r.description} ${(r.specialRules||[]).join(' ')}`.toLowerCase();
  if (/nothing happens|do nothing|idle game|sandbox only/.test(text)) {
    r.setup.noopGame = true;
    if (!r.actions.includes('draw')) r.actions.push('draw');
    if (!r.actions.includes('pass')) r.actions.push('pass');
  }
  return r;
};

// 7. Bot-only indicator
export const botOnlyModule: RuleTransform = (rules) => {
  const r = clone(rules); ensureActions(r);
  const text = `${r.name} ${r.description} ${(r.specialRules||[]).join(' ')}`.toLowerCase();
  if (/only bots play|bot only|ai plays itself/.test(text)) {
    r.specialRules = r.specialRules || [];
    if (!r.specialRules.some((s:string)=>/bot-only/i.test(s))) r.specialRules.push('Bot-only mode');
    if (!r.actions.includes('draw')) r.actions.push('draw');
    if (!r.actions.includes('play')) r.actions.push('play');
  }
  return r;
};

// 8. Generic specific-card reveal win (any mention of a rank + suit together)
export const specificCardRevealWinModule: RuleTransform = (rules) => {
  const r = clone(rules); ensureActions(r);
  const text = `${r.name} ${r.description} ${(r.specialRules||[]).join(' ')}`.toLowerCase();
  // Detect patterns like "ace of spades", "queen of hearts" etc.
  const pattern = new RegExp(`(${rankTokens.join('|').replace(/\|10/,'|10')}) of (hearts|diamonds|clubs|spades)`,'gi');
  let foundAny = false;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    foundAny = true;
    const rank = match[1].toUpperCase();
    const suit = match[2].toLowerCase();
    const description = `Reveal the ${rank} of ${suit.charAt(0).toUpperCase()+suit.slice(1)} to win.`;
    if (!(r.winConditions||[]).some((w:any)=> w.description === description)) {
      r.winConditions = r.winConditions || [];
      r.winConditions.push({ type: 'custom', description });
    }
  }
  if (foundAny && !r.actions.includes('draw')) r.actions.push('draw');
  return r;
};

// Pipeline
export const RULE_TRANSFORMS: RuleTransform[] = [
  randomHandRangeModule,
  progressiveDealModule,
  centralPileModule,
  eliminationOnRankModule,
  arithmeticTargetModule,
  noopModule,
  botOnlyModule,
  specificCardRevealWinModule,
];

export function applyRuleTransforms(rules: GameRules): GameRules {
  return RULE_TRANSFORMS.reduce((acc, mod) => mod(acc), rules);
}
