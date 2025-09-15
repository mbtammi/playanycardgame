// Detect overly generic or vague user prompts and provide a richer fallback or enrichment.

const GENERIC_PATTERNS: RegExp[] = [
  /^\s*make (me )?a (card )?game\s*$/i,
  /^\s*create (a )?(fun )?(card )?game\s*$/i,
  /^\s*any game\s*$/i,
  /just (make|create) (a )?game/i,
  /surprise me/i,
  /random game/i,
  /^\s*card game idea\s*$/i
];

export function isGenericPrompt(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.split(/\s+/).length < 5) return true; // extremely short
  return GENERIC_PATTERNS.some(r => r.test(trimmed));
}

// Provide enrichment instructions that guide AI to produce a balanced, interesting default.
export function buildFallbackEnrichment(original: string): string {
  return `User prompt was too vague or generic ("${original.slice(0,60)}"). You must design a fresh, engaging but simple-to-understand card game.

REQUIREMENTS:
- 3 to 4 players (support min 2, max 6)
- Each player gets 7 cards initially
- Central sequence pile where players play cards relative to previous (match suit OR be exactly 1 rank higher or lower)
- Always include actions: play, draw, pass
- Win condition: First to empty their hand
- Add one special rule using a specific rank (like 8s are wild to change suit OR 7 reverses turn order) — pick one, not both.
- Provide tableLayout.type = "sequence" with a starting card so gameplay begins
- Ensure deadlock prevention: if a player cannot play they draw exactly 1 card, then may pass
- Keep overall description concise and clear.

Return only JSON schema (GameRules).`;
}
