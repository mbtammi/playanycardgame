import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameRules } from '../types';
import { useAppStore } from '../store';
import './SimpleGameCreator.css';

interface GameTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseRules: Partial<GameRules>;
}

const gameTemplates: GameTemplate[] = [
  {
    id: 'memory',
    name: 'Memory Match',
    description: 'Classic memory game with card matching',
    icon: '🧠',
    baseRules: {
      name: 'Memory Match',
      objective: { type: 'highest_score', description: 'Get the most points by matching pairs' },
      actions: ['flip', 'pass'],
      setup: {
        cardsPerPlayer: 0,
        deckSize: 52,
        tableLayout: {
          type: 'grid',
          allowFlexiblePlacement: false,
          zones: [
            {
              id: 'memory-grid',
              type: 'grid',
              initialCards: 16,
              faceDown: true,
              position: { x: 0, y: 0 }
            }
          ]
        }
      }
    }
  },
  {
    id: 'shedding',
    name: 'Card Shedding',
    description: 'Be the first to get rid of all your cards',
    icon: '🎯',
    baseRules: {
      name: 'Card Shedding',
      objective: { type: 'empty_hand', description: 'Be the first to play all your cards' },
      actions: ['play', 'draw', 'pass'],
      setup: {
        cardsPerPlayer: 7,
        deckSize: 52
      }
    }
  },
  {
    id: 'collection',
    name: 'Card Collection',
    description: 'Collect specific cards or sets to win',
    icon: '🃏',
    baseRules: {
      name: 'Card Collection',
      objective: { type: 'collect_sets', description: 'Collect the most valuable sets' },
      actions: ['draw', 'play', 'discard', 'pass'],
      setup: {
        cardsPerPlayer: 5,
        deckSize: 52
      }
    }
  },
  {
    id: 'blackjack',
    name: 'Blackjack Style',
    description: 'Get close to a target value without going over',
    icon: '🎲',
    baseRules: {
      name: 'Blackjack Style',
      objective: { type: 'custom', description: 'Get as close to 21 as possible without going over' },
      actions: ['play', 'pass'],
      setup: {
        cardsPerPlayer: 2,
        deckSize: 52
      },
      players: {
        min: 2,
        max: 6,
        recommended: 2,
        requiresDealer: true,
        dealerConfig: {
          isBot: true,
          mustHitOn: 16,
          mustStandOn: 17
        }
      }
    }
  },
  {
    id: 'sequence',
    name: 'Sequence Building',
    description: 'Build sequences with your cards',
    icon: '📈',
    baseRules: {
      name: 'Sequence Building',
      objective: { type: 'highest_score', description: 'Build the longest sequences' },
      actions: ['play', 'draw', 'pass'],
      setup: {
        cardsPerPlayer: 7,
        deckSize: 52,
        tableLayout: {
          type: 'sequence',
          allowFlexiblePlacement: true
        }
      }
    }
  },
  {
    id: 'custom',
    name: 'Custom Game',
    description: 'Create your own unique game',
    icon: '⚡',
    baseRules: {
      name: 'Custom Game',
      objective: { type: 'custom', description: 'Your custom objective' },
      actions: ['play', 'draw', 'pass'],
      setup: {
        cardsPerPlayer: 5,
        deckSize: 52
      }
    }
  }
];

const SimpleGameCreator: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setGameSchema } = useAppStore();

  const handleTemplateSelect = (template: GameTemplate) => {
    setSelectedTemplate(template);
    setCustomName(template.baseRules.name || template.name);
  };

  const createGame = () => {
    if (!selectedTemplate) return;

    setLoading(true);
    
    try {
      // Build complete game rules from template
      const gameRules: GameRules = {
        id: `${selectedTemplate.id}-${Date.now()}`,
        name: customName || selectedTemplate.name,
        description: selectedTemplate.description,
        players: {
          min: Math.max(1, playerCount - 1),
          max: playerCount + 2,
          recommended: playerCount,
          ...(selectedTemplate.baseRules.players || {})
        },
        setup: {
          cardsPerPlayer: selectedTemplate.baseRules.setup?.cardsPerPlayer || 5,
          deckSize: 52,
          specialCards: [],
          keepDrawnCard: true,
          ...selectedTemplate.baseRules.setup
        },
        objective: selectedTemplate.baseRules.objective || {
          type: 'custom',
          description: 'Win the game!'
        },
        turnStructure: {
          order: 'clockwise',
          phases: [
            {
              name: 'playing',
              required: true,
              actions: selectedTemplate.baseRules.actions || ['play', 'pass']
            }
          ]
        },
        actions: selectedTemplate.baseRules.actions || ['play', 'draw', 'pass'],
        winConditions: [
          {
            type: selectedTemplate.baseRules.objective?.type === 'empty_hand' ? 'first_to_empty' : 'highest_score',
            description: selectedTemplate.baseRules.objective?.description || 'Win the game!'
          }
        ],
        specialRules: [],
        tableLayout: selectedTemplate.baseRules.setup?.tableLayout ? {
          preferred: selectedTemplate.baseRules.setup.tableLayout.type as any,
          allowFlexiblePlacement: selectedTemplate.baseRules.setup.tableLayout.allowFlexiblePlacement
        } : undefined
      };

      // Adjust difficulty
      if (difficulty === 'easy') {
        gameRules.setup.cardsPerPlayer = Math.max(3, (gameRules.setup.cardsPerPlayer || 5) - 2);
        gameRules.players.recommended = Math.max(2, playerCount - 1);
      } else if (difficulty === 'hard') {
        gameRules.setup.cardsPerPlayer = (gameRules.setup.cardsPerPlayer || 5) + 2;
        gameRules.players.recommended = Math.min(6, playerCount + 1);
        gameRules.actions.push('discard', 'attack');
      }

      console.log('Created simple game:', gameRules);
      setGameSchema(gameRules);
      navigate('/game');
    } catch (error) {
      console.error('Error creating simple game:', error);
      alert('Error creating game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-game-creator">
      <div className="creator-header">
        <h2>🎮 Quick Game Creator</h2>
        <p>Choose a template and customize your game in seconds!</p>
      </div>

      <div className="template-grid">
        {gameTemplates.map(template => (
          <div 
            key={template.id}
            className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="template-icon">{template.icon}</div>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="customization-panel">
          <h3>Customize Your Game</h3>
          
          <div className="setting-group">
            <label htmlFor="game-name">Game Name:</label>
            <input
              id="game-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter custom name"
            />
          </div>

          <div className="setting-group">
            <label htmlFor="player-count">Number of Players:</label>
            <select 
              id="player-count"
              value={playerCount} 
              onChange={(e) => setPlayerCount(parseInt(e.target.value))}
            >
              <option value={2}>2 Players</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
              <option value={5}>5 Players</option>
              <option value={6}>6 Players</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="difficulty">Difficulty:</label>
            <select 
              id="difficulty"
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            >
              <option value="easy">Easy (Fewer cards, simpler rules)</option>
              <option value="medium">Medium (Balanced gameplay)</option>
              <option value="hard">Hard (More cards, complex actions)</option>
            </select>
          </div>

          <div className="creator-actions">
            <button 
              className="btn-secondary"
              onClick={() => setSelectedTemplate(null)}
            >
              Back to Templates
            </button>
            <button 
              className="btn-primary"
              onClick={createGame}
              disabled={loading || !customName.trim()}
            >
              {loading ? 'Creating Game...' : 'Create & Play!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleGameCreator;
