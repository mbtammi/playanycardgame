import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppStore, GameState, GameRules, PredefinedGame, Notification, GameMode, RuleBuilderState } from '../types';

const initialRuleBuilderState: RuleBuilderState = {
  currentStep: 0,
  steps: [
    {
      id: 'basic-info',
      title: 'Game Basics',
      description: 'Name your game and set player count',
      component: 'BasicInfoStep',
      completed: false,
    },
    {
      id: 'setup',
      title: 'Game Setup',
      description: 'Define how the game starts',
      component: 'SetupStep',
      completed: false,
    },
    {
      id: 'objective',
      title: 'Win Condition',
      description: 'How does a player win?',
      component: 'ObjectiveStep',
      completed: false,
    },
    {
      id: 'turns',
      title: 'Turn Structure',
      description: 'What happens on each turn?',
      component: 'TurnStep',
      completed: false,
    },
    {
      id: 'review',
      title: 'Review & Generate',
      description: 'Review rules and let AI create your game',
      component: 'ReviewStep',
      completed: false,
    },
  ],
  gameData: {},
  isValidating: false,
  errors: [],
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Navigation state
      currentPage: 'landing',
      gameMode: 'create',

      // Game state
      currentGame: null,
      availableGames: [],

      // Rule builder state
      ruleBuilder: initialRuleBuilderState,

      // UI state
      isLoading: false,
      notifications: [],

      // Navigation actions
      setCurrentPage: (page: string) => {
        set({ currentPage: page });
      },

      setGameMode: (mode: GameMode) => {
        set({ gameMode: mode });
      },


      // Game actions
      createNewGame: (rules: GameRules) => {
        // Auto-populate demo players if none exist
        const minPlayers = rules.players.min || 2;
        const demoPlayers = [
          { id: 'player-1', name: 'You', type: 'human' as 'human', hand: [], isActive: false, score: 0, position: 0 },
          ...Array.from({ length: minPlayers - 1 }, (_, i) => ({
            id: `player-${i + 2}`,
            name: `Bot ${i + 1}`,
            type: 'bot' as 'bot',
            hand: [],
            isActive: false,
            score: 0,
            position: i + 1
          }))
        ];
        const newGame: GameState = {
          id: `game-${Date.now()}`,
          rules,
          players: demoPlayers,
          deck: [],
          discardPile: [],
          communityCards: [],
          currentPlayerIndex: 0,
          currentPhase: 'setup',
          turn: 1,
          round: 1,
          scores: Object.fromEntries(demoPlayers.map(p => [p.id, 0])),
          gameStatus: 'waiting',
        };
        set({ currentGame: newGame, currentPage: 'game' });
      },

      // Set game schema and launch game (for Rule Builder/AI)
      setGameSchema: (schema: any) => {
        // Accepts a GameRules object or plain object, creates a new game using createNewGame
        try {
          const rules: GameRules = schema;
          get().createNewGame(rules);
        } catch (e) {
          // fallback: do nothing or notify error
        }
      },

      updateGameState: (updates: Partial<GameState>) => {
        const currentGame = get().currentGame;
        if (currentGame) {
          set({
            currentGame: { ...currentGame, ...updates }
          });
        }
      },

      // Rule builder actions
      updateRuleBuilder: (updates: Partial<RuleBuilderState>) => {
        set({
          ruleBuilder: { ...get().ruleBuilder, ...updates }
        });
      },

      updateRuleBuilderStep: (stepIndex: number, data: any) => {
        const ruleBuilder = get().ruleBuilder;
        const updatedSteps = [...ruleBuilder.steps];
        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          completed: true,
          data,
        };

        set({
          ruleBuilder: {
            ...ruleBuilder,
            steps: updatedSteps,
            gameData: { ...ruleBuilder.gameData, ...data },
          }
        });
      },

      nextRuleBuilderStep: () => {
        const ruleBuilder = get().ruleBuilder;
        if (ruleBuilder.currentStep < ruleBuilder.steps.length - 1) {
          set({
            ruleBuilder: {
              ...ruleBuilder,
              currentStep: ruleBuilder.currentStep + 1,
            }
          });
        }
      },

      previousRuleBuilderStep: () => {
        const ruleBuilder = get().ruleBuilder;
        if (ruleBuilder.currentStep > 0) {
          set({
            ruleBuilder: {
              ...ruleBuilder,
              currentStep: ruleBuilder.currentStep - 1,
            }
          });
        }
      },

      resetRuleBuilder: () => {
        set({ ruleBuilder: initialRuleBuilderState });
      },

      // Notification actions
      addNotification: (notification: Notification) => {
        const notifications = get().notifications;
        const newNotification = { ...notification, id: `notif-${Date.now()}` };
        set({
          notifications: [...notifications, newNotification]
        });

        // Auto-remove notification after duration
        if (notification.duration) {
          setTimeout(() => {
            const currentNotifications = get().notifications;
            set({
              notifications: currentNotifications.filter(n => n.id !== newNotification.id)
            });
          }, notification.duration);
        }
      },

      removeNotification: (id: string) => {
        const notifications = get().notifications;
        set({
          notifications: notifications.filter(n => n.id !== id)
        });
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      // Loading state
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      // Predefined games
      loadPredefinedGames: (games: PredefinedGame[]) => {
        set({ availableGames: games });
      },
    }),
    {
      name: 'play-any-card-game-store', // For Redux DevTools
    }
  )
);

// Selector hooks for better performance
export const useCurrentPage = () => useAppStore(state => state.currentPage);
export const useGameMode = () => useAppStore(state => state.gameMode);
export const useCurrentGame = () => useAppStore(state => state.currentGame);
export const useRuleBuilder = () => useAppStore(state => state.ruleBuilder);
export const useNotifications = () => useAppStore(state => state.notifications);
export const useIsLoading = () => useAppStore(state => state.isLoading);
