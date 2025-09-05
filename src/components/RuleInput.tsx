import React, { useState } from 'react';
import { useAppStore } from '../store';
import SimpleGameCreator from './SimpleGameCreator';
import './RuleInput.css';

type CreationMode = 'simple' | 'advanced';

const defaultText = `Create a strategic card game called "Memory Palace" for 2-4 players. Each player starts with 5 cards. Place 16 cards face-down in a 4x4 grid on the table. Players take turns flipping 2 cards to find matches. If they match, the player keeps the pair and scores 2 points. If not, the cards flip back face-down. Players can also play cards from their hand to create sequences (consecutive ranks) in the center area for 3 points per sequence. The game ends when all grid cards are claimed. Highest score wins! Add strategic elements like peek cards that let you see any face-down card for 1 turn.`;


const RuleInput: React.FC = () => {
  const [mode, setMode] = useState<CreationMode>('simple');
  const [freeText, setFreeText] = useState(defaultText);
  const [loading, setLoading] = useState(false);
  const { setCurrentPage, setGameSchema } = useAppStore();

  // Call backend API to interpret rules and start game directly
  const handleStartGame = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: freeText })
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
      
      // Start the game directly
      setGameSchema(filled);
      setCurrentPage('game');
    } catch (err: any) {
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
    return {
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
            <button
              className="btn-primary rule-input-start-button"
              onClick={handleStartGame}
              disabled={loading}
            >
              {loading ? 'Creating Your Game...' : 'Create with AI'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleInput;
