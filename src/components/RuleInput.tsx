import React, { useState } from 'react';
import { useAppStore } from '../store';
import './RuleInput.css';

const defaultText = `I will lift cards from the deck, if the card is black I will win.`;


const RuleInput: React.FC = () => {
  const [freeText, setFreeText] = useState(defaultText);
  const [schema, setSchema] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { setCurrentPage, setGameSchema } = useAppStore();

  // Call backend API to interpret rules using OpenAI
  const interpretRules = async () => {
    setLoading(true);
    setSchema('');
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
      setSchema(json);
    } catch (err: any) {
      setSchema('');
      alert('Error: ' + (err.message || 'Failed to interpret rules.'));
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
        min: typeof obj.players.min === 'number' ? obj.players.min : 2,
        max: typeof obj.players.max === 'number' ? obj.players.max : 6,
        recommended: typeof obj.players.recommended === 'number' ? obj.players.recommended : 4,
      } : { min: 2, max: 6, recommended: 4 },
      setup: obj.setup && typeof obj.setup === 'object' ? {
        cardsPerPlayer: typeof obj.setup.cardsPerPlayer === 'number' ? obj.setup.cardsPerPlayer : 7,
        deckSize: typeof obj.setup.deckSize === 'number' ? obj.setup.deckSize : 52,
        specialCards: Array.isArray(obj.setup.specialCards) ? obj.setup.specialCards : [],
      } : { cardsPerPlayer: 7, deckSize: 52, specialCards: [] },
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
      actions: Array.isArray(obj.actions) ? obj.actions : [],
      winConditions: Array.isArray(obj.winConditions) ? obj.winConditions : [],
      specialRules: Array.isArray(obj.specialRules) ? obj.specialRules : [],
      aiPrompt: typeof obj.aiPrompt === 'string' ? obj.aiPrompt : undefined,
    };
  }

  const handleStartGame = () => {
    if (schema) {
      try {
        // Log the schema for debugging
        console.log('Schema to parse:', schema);
        // Parse schema as GameRules and create a new game
        const parsed = JSON.parse(schema);
        const filled = fillGameRulesDefaults(parsed);
        if (!isValidGameRules(filled)) {
          alert('The generated schema is missing required fields or is not in the correct format. Please edit or try again.');
          return;
        }
        setGameSchema(filled);
        setCurrentPage('game');
      } catch (e: any) {
        alert('Invalid schema: ' + (e.message || e));
      }
    }
  };

  return (
    <div className="rule-input-container">
      <h2 className="rule-input-title">Define Your Game Rules</h2>
      <textarea
        className="rule-input-textarea"
        value={freeText}
        onChange={e => setFreeText(e.target.value)}
        placeholder="Describe your card game rules in plain English..."
      />
      <div className="rule-input-buttons">
        <button
          className="btn-primary rule-input-interpret-button"
          onClick={interpretRules}
          disabled={loading}
        >
          {loading ? 'Interpreting...' : 'Interpret Rules'}
        </button>
        <button
          className="btn-secondary rule-input-start-button"
          onClick={handleStartGame}
          disabled={!schema}
        >
          Start Game
        </button>
      </div>
      <h3 className="rule-input-schema-title">Generated Game Schema</h3>
      <pre className="rule-input-schema">
        {schema || 'Schema will appear here.'}
      </pre>
    </div>
  );
};

export default RuleInput;
