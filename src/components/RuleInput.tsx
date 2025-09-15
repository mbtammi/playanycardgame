import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import SimpleGameCreator from './SimpleGameCreator';
import './RuleInput.css';
import { sanitizeUserIdea } from '../utils/sanitize';
import { isGenericPrompt, buildFallbackEnrichment } from '../utils/genericFallback';
import { analytics } from '../utils/analytics';

type CreationMode = 'simple' | 'advanced';

const defaultText = `Just a game where there is 3 players. The bots will have 10 cards and I will have 5. Now Every turn we must play a card that is either 3, 6, or 9 numbers bigger or smaller than the previous card that has been played on the table. This game goes until somebody has no cards in their hand. If you cannot play a card you lift 1 card from the deck.`;


const RuleInput: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreationMode>('simple');
  const [freeText, setFreeText] = useState(defaultText);
  const [loading, setLoading] = useState(false);
  const { setGameSchema } = useAppStore();

  // Call backend API to interpret rules and start game directly
  const handleStartGame = async () => {
    setLoading(true);
    try {
      // Sanitize user input first
      const { sanitized, flags } = sanitizeUserIdea(freeText);
      const generic = isGenericPrompt(sanitized);
      analytics.gameCreationAttempt(mode === 'simple' ? 'simple' : 'advanced', generic);
      if (flags.suspiciousTokens.length) {
        console.warn('Suspicious tokens detected in user idea:', flags.suspiciousTokens);
      }
      if (flags.removedScripts || flags.removedHtml) {
        console.log('Input contained HTML/script tags which were removed.');
      }
      if (sanitized !== freeText) {
        setFreeText(sanitized); // reflect sanitized text in UI (optional UX decision)
      }

      // Step 1: Generate initial game schema
      const baseSourceText = isGenericPrompt(sanitized) ? buildFallbackEnrichment(sanitized) : sanitized;
      const augmented = buildAugmentedIdea(baseSourceText);
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: augmented })
      });
      if (!response.ok) {
        throw new Error('Failed to contact backend.');
      }
      const data = await response.json();
      // Try to parse the first code block or the whole content as JSON
      const content = data.choices?.[0]?.message?.content || '';
      const match = content.match(/```json\s*([\s\S]*?)```/);
      const json = match ? match[1] : content;
      
      // Parse and validate the schema
      const parsed = JSON.parse(json);
      console.log('Generated schema from AI:', parsed);
      const filled = fillGameRulesDefaults(parsed);
      console.log('Schema after filling defaults:', filled);
      if (!isValidGameRules(filled)) {
        throw new Error('The AI generated an invalid game schema. Please try rephrasing your rules.');
      }

      // Step 2: AI GAME LOGIC VALIDATION - Check if game is actually playable
      console.log('🔍 Validating game logic with AI...');
      const validationResult = await validateGameLogicWithAI(filled, freeText);
      
      if (!validationResult.isValid) {
        // If game has logical issues, try to fix them with AI
        console.log('⚠️ Game has logical issues, attempting AI fix...');
        const fixedGame = await fixGameLogicWithAI(filled, freeText, validationResult.issues);
        if (fixedGame) {
          console.log('✅ Game logic fixed by AI');
          setGameSchema(fixedGame);
          analytics.gameCreationSuccess(fixedGame.id, fixedGame.name);
          navigate('/game');
        } else {
          throw new Error(`Game logic issues found: ${validationResult.issues.join(', ')}. Please adjust your rules and try again.`);
        }
      } else {
        console.log('✅ Game logic validation passed');
        // Start the game directly
        setGameSchema(filled);
        analytics.gameCreationSuccess(filled.id, filled.name);
        navigate('/game');
      }
    } catch (err: any) {
      analytics.gameCreationFailure(err?.message || 'unknown');
      alert('Error creating your game: ' + (err.message || 'Please try rephrasing your rules and try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Validate that the parsed schema matches the required GameRules structure
  function isValidGameRules(obj: any): boolean {
    return obj && typeof obj === 'object' &&
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.description === 'string' &&
      obj.players && typeof obj.players.min === 'number' && typeof obj.players.max === 'number' &&
      obj.setup && typeof obj.setup.cardsPerPlayer === 'number' && typeof obj.setup.deckSize === 'number' &&
      obj.objective && typeof obj.objective.type === 'string' &&
      obj.turnStructure && Array.isArray(obj.turnStructure.phases) &&
      Array.isArray(obj.actions) && Array.isArray(obj.winConditions);
  }

  // Fill missing fields in the parsed schema with defaults
  function fillGameRulesDefaults(obj: any): any {
    const filled = {
      id: obj.id || 'custom-game',
      name: obj.name || 'Custom Game',
      description: obj.description || 'A user-defined card game.',
      players: obj.players && typeof obj.players === 'object' ? {
        min: typeof obj.players.min === 'number' ? obj.players.min : 1,
        max: typeof obj.players.max === 'number' ? obj.players.max : 6,
        recommended: typeof obj.players.recommended === 'number' ? obj.players.recommended : 1,
      } : { min: 1, max: 6, recommended: 1 },
      setup: obj.setup && typeof obj.setup === 'object' ? {
        cardsPerPlayer: typeof obj.setup.cardsPerPlayer === 'number' ? obj.setup.cardsPerPlayer : 0,
        // IMPORTANT: preserve asymmetric dealing if provided by AI
        cardsPerPlayerPosition: Array.isArray(obj.setup.cardsPerPlayerPosition) ? obj.setup.cardsPerPlayerPosition : undefined,
        deckSize: typeof obj.setup.deckSize === 'number' ? obj.setup.deckSize : 52,
        specialCards: Array.isArray(obj.setup.specialCards) ? obj.setup.specialCards : [],
        keepDrawnCard: obj.setup.keepDrawnCard !== undefined ? obj.setup.keepDrawnCard : false,
        multipleDecks: obj.setup.multipleDecks !== undefined ? obj.setup.multipleDecks : false,
        numberOfDecks: typeof obj.setup.numberOfDecks === 'number' ? obj.setup.numberOfDecks : 1,
        tableLayout: obj.setup.tableLayout && typeof obj.setup.tableLayout === 'object' ? {
          type: obj.setup.tableLayout.type || 'centered',
          allowFlexiblePlacement: obj.setup.tableLayout.allowFlexiblePlacement !== undefined ? obj.setup.tableLayout.allowFlexiblePlacement : false,
          zones: Array.isArray(obj.setup.tableLayout.zones) ? obj.setup.tableLayout.zones : [],
          freeformPlacement: obj.setup.tableLayout.freeformPlacement !== undefined ? obj.setup.tableLayout.freeformPlacement : false,
        } : undefined,
      } : { cardsPerPlayer: 0, deckSize: 52, specialCards: [], keepDrawnCard: false },
      objective: obj.objective && typeof obj.objective === 'object' ? {
        type: obj.objective.type || 'custom',
        description: obj.objective.description || '',
        target: obj.objective.target,
      } : { type: 'custom', description: '' },
      turnStructure: obj.turnStructure && typeof obj.turnStructure === 'object' ? {
        order: obj.turnStructure.order || 'clockwise',
        phases: Array.isArray(obj.turnStructure.phases) ? obj.turnStructure.phases : [],
        timeLimit: obj.turnStructure.timeLimit,
      } : { order: 'clockwise', phases: [] },
      actions: Array.isArray(obj.actions) ? obj.actions : ['draw'],
      winConditions: Array.isArray(obj.winConditions) ? obj.winConditions : [],
      specialRules: Array.isArray(obj.specialRules) ? obj.specialRules : [],
      aiPrompt: typeof obj.aiPrompt === 'string' ? obj.aiPrompt : undefined,
    };
    return filled;
  }

  // Augment the idea with schema-specific instructions so the AI itself (not local heuristics) handles asymmetric dealing & robustness
  function buildAugmentedIdea(raw: string): string {
    return `${raw.trim()}

### CRITICAL SCHEMA REQUIREMENTS - READ CAREFULLY

You are creating a JSON schema for a card game. Follow these requirements EXACTLY:

**ASYMMETRIC DEALING DETECTION:**
- CAREFULLY analyze if different players get different card amounts
- Look for phrases like "I have 5", "bots have 10", "player gets X", "dealer gets Y"  
- If ANY player gets different amounts, use "cardsPerPlayerPosition": [5, 10, 10] and set "cardsPerPlayer": 0
- Player 1 is ALWAYS the human, others are bots
- If all players get same amount, just use "cardsPerPlayer": X

**TABLE LAYOUT - READ VERY CAREFULLY:**
- If cards are played to THE MIDDLE/CENTER (one shared pile), use: "type": "sequence"
- If cards are played by SUITS (hearts, diamonds, etc.), use: "type": "suit-based"  
- If no table needed, use: "type": "none"
- NEVER use suit-based for games that play to a central pile!

**GAME LOGIC REQUIREMENTS:**
- ALWAYS include "draw" in actions array if players can get stuck
- For sequence/building games, add setup.tableLayout with starting card
- For games comparing to previous card, ensure there's a starting card on table

**STARTING POSITION FIX:**
- If game requires playing relative to previous card, add this to setup.tableLayout:
  "initialCards": [{"rank": "7", "suit": "hearts"}]
- This prevents "no previous card" errors

**OUTPUT FORMAT:**
Return ONLY valid JSON matching GameRules interface. No explanations, no markdown.

**EXAMPLE for the described sequence game:**
{
  "id": "sequence-game",
  "name": "Number Sequence Game", 
  "setup": {
    "cardsPerPlayer": 0,
    "cardsPerPlayerPosition": [5, 10, 10],
    "tableLayout": {
      "type": "sequence", 
      "initialCards": [{"rank": "7", "suit": "hearts"}]
    }
  },
  "actions": ["play", "draw"],
  "winConditions": [{"type": "first_to_empty", "description": "First to play all cards wins"}]
}`;
  }

  // AI-powered game logic validation - checks if the game is actually playable
  async function validateGameLogicWithAI(gameRules: any, originalText: string): Promise<{isValid: boolean, issues: string[]}> {
    try {
      const validationPrompt = `You are a card game logic validator. Analyze this game schema and determine if it's logically playable.

GAME RULES TO VALIDATE:
${JSON.stringify(gameRules, null, 2)}

ORIGINAL USER DESCRIPTION:
"${originalText}"

VALIDATION CHECKLIST - Check for these critical issues ONLY:
1. STARTING POSITION: Does the game have a clear starting point? (e.g., starting card on table, dealer goes first, etc.)
2. PLAYABILITY: Can players actually make moves? Are there enough valid actions?
3. PROGRESSION: Can the game progress forward or will players get stuck?
4. DEADLOCK PREVENTION: Are there escape routes when players can't play (draw cards, skip turns, etc.)?

DO NOT "FIX" THESE - THEY ARE INTENTIONAL USER CHOICES:
- Asymmetric dealing (different players getting different card counts)
- Simple/silly game rules 
- Unusual win conditions
- Non-standard game mechanics
- Table layout preferences

OUTPUT FORMAT - Return ONLY a JSON object:
{
  "isValid": true/false,
  "issues": ["list of specific CRITICAL problems only", "only include issues that make the game literally unplayable"]
}

If the game can be played (even if it seems silly), return {"isValid": true, "issues": []}.
Only flag CRITICAL issues that prevent basic gameplay.`;

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idea: validationPrompt,
          temperature: 0.1 // Low temperature for consistent validation
        })
      });

      if (!response.ok) {
        console.warn('AI validation failed, proceeding without validation');
        return { isValid: true, issues: [] };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      try {
        const match = content.match(/```json\s*([\s\S]*?)```/);
        const json = match ? match[1] : content;
        return JSON.parse(json);
      } catch {
        // If we can't parse the response, assume valid but log warning
        console.warn('Could not parse AI validation response, proceeding');
        return { isValid: true, issues: [] };
      }
    } catch (error) {
      console.warn('AI validation error:', error);
      return { isValid: true, issues: [] }; // Fail open
    }
  }

  // AI-powered game logic fixing - attempts to fix logical issues
  async function fixGameLogicWithAI(gameRules: any, originalText: string, issues: string[]): Promise<any | null> {
    try {
      const fixPrompt = `You are a card game designer. Fix the logical issues in this game schema while staying true to the user's original intent.

ORIGINAL GAME SCHEMA (WITH ISSUES):
${JSON.stringify(gameRules, null, 2)}

ORIGINAL USER DESCRIPTION:
"${originalText}"

IDENTIFIED ISSUES TO FIX:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

FIXING GUIDELINES:
1. ALWAYS preserve the user's core game concept and intent
2. Fix ONLY the logical issues identified
3. For missing starting positions: Add appropriate setup (starting card on table, dealer logic, etc.)
4. For sequence games: Place a starting card on the table (usually a 7 or middle-value card)
5. For deadlock prevention: Ensure players can always draw cards or skip turns when stuck
6. For win conditions: Make sure they're achievable with the game rules
7. Add any missing actions that are implied by the description (especially 'draw' for stuck situations)
8. Maintain the original player counts, card distributions, and core mechanics
9. For games requiring table progression: Set up initial table cards or zones

OUTPUT FORMAT - Return ONLY a complete, fixed JSON game schema matching the GameRules interface.
No explanations, no markdown, just the corrected JSON object.`;

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idea: fixPrompt,
          temperature: 0.2 // Low temperature for consistent fixes
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      try {
        const match = content.match(/```json\s*([\s\S]*?)```/);
        const json = match ? match[1] : content;
        const fixedRules = JSON.parse(json);
        
        // Ensure the fixed rules are still valid
        const filledFixed = fillGameRulesDefaults(fixedRules);
        // Preserve asymmetric dealing if original had it and AI removed it inadvertently
        if (gameRules.setup?.cardsPerPlayerPosition && !filledFixed.setup.cardsPerPlayerPosition) {
          console.log('🛡 Restoring asymmetric dealing cardsPerPlayerPosition from original schema');
          filledFixed.setup.cardsPerPlayerPosition = gameRules.setup.cardsPerPlayerPosition;
          filledFixed.setup.cardsPerPlayer = 0;
        }
        // Preserve sequence layout if original requested center pile / sequence
        const originalType = gameRules.setup?.tableLayout?.type;
        if (originalType === 'sequence') {
          filledFixed.setup.tableLayout = filledFixed.setup.tableLayout || {};
            (filledFixed.setup.tableLayout as any).type = 'sequence';
        }
        if (isValidGameRules(filledFixed)) {
          return filledFixed;
        }
        return null;
      } catch {
        return null;
      }
    } catch (error) {
      console.warn('AI fix error:', error);
      return null;
    }
  }

  return (
    <div className="rule-input-container">
      {/* Mode Selection Header */}
      <div className="mode-selection">
        <h2 className="rule-input-title">Create Your Card Game</h2>
        <div className="mode-tabs">
          <button 
            className={`mode-tab ${mode === 'simple' ? 'active' : ''}`}
            onClick={() => setMode('simple')}
          >
            🎮 Quick Creator
          </button>
          <button 
            className={`mode-tab ${mode === 'advanced' ? 'active' : ''}`}
            onClick={() => setMode('advanced')}
          >
            ⚡ Type Your Rules
          </button>
        </div>
        <p className="mode-description">
          {mode === 'simple' 
            ? 'Choose from templates and customize quickly - perfect for getting started!'
            : 'Describe your game idea in detail and let AI create a complete, balanced game for you!'
          }
        </p>
      </div>

      {/* Render appropriate creator based on mode */}
      {mode === 'simple' ? (
        <SimpleGameCreator />
      ) : (
        <div className="advanced-creator">
          <textarea
            className="rule-input-textarea"
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            placeholder="Describe your card game in detail... Be creative! Include how many players, what cards go where on the table, how to win, and any special rules. The AI will make it fun and balanced!"
          />
          <div className="rule-input-buttons">
              <motion.button
                className={`btn-primary rule-input-start-button${loading ? ' loading' : ''}`}
                onClick={handleStartGame}
                disabled={loading}
                animate={loading ? { scale: [1, 1.08, 1], boxShadow: [
                  '0 0 0px #ffd700',
                  '0 0 16px #ffd700',
                  '0 0 0px #ffd700'
                ] } : { scale: 1, boxShadow: '0 0 0px #ffd700' }}
                transition={loading ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : {}}
              >
                {loading ? (
                  <span className="">Creating Your Game...</span>
                ) : 'Create with AI'}
              </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};


export default RuleInput;
