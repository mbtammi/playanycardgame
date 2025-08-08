
import { useEffect, useRef, useState } from 'react';
import { getBotAction } from '../engine/bot';
import { motion } from 'framer-motion';
import { useCurrentGame, useAppStore } from '../store';
import { ArrowLeft, Users, Target, Shuffle } from 'lucide-react';
import PlayerHand from '../components/game/PlayerHand';
import Card from '../components/game/Card';
import GameTable from '../components/game/GameTable';
import { GameEngine } from '../engine/gameEngine';


const GamePage = () => {
  const currentGame = useCurrentGame();
  const { setCurrentPage, updateGameState } = useAppStore();
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [message, setMessage] = useState<React.ReactNode>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initialize GameEngine instance on mount or when rules change
  // Only re-initialize engine if rules or player list change
  useEffect(() => {
    if (currentGame) {
      engineRef.current = new GameEngine(currentGame.rules);
      currentGame.players.forEach(p => {
        engineRef.current?.addPlayer(p.name, p.type, p.avatar);
      });
      // Start game if not started
      const state = engineRef.current.getGameState();
      if (state.gameStatus !== 'active') {
        try {
          engineRef.current.startGame();
        } catch {}
      }
      // Always update global state after (re)initialization
      updateGameState(engineRef.current.getGameState());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame?.rules, JSON.stringify(currentGame?.players)]);

  // Handle custom actions (fallback for unknown action types)

  // Helper: get current player
  const getCurrentPlayer = () => {
    if (!currentGame) return null;
    return currentGame.players[currentGame.currentPlayerIndex];
  };

  // Handle custom actions (fallback for unknown action types)
  function handleCustomAction(action: string) {
    if (!engineRef.current || !isUserTurn()) return;
    const current = getCurrentPlayer();
    if (!current) return;
    engineRef.current.executeAction(current.id, action as any, selectedCards);
    updateGameState(engineRef.current.getGameState());
    setSelectedCards([]);
  }

  // Bot turn effect
  useEffect(() => {
    if (!currentGame || !engineRef.current) return;
    const current = getCurrentPlayer();
    if (!current || current.type !== 'bot' || currentGame.gameStatus !== 'active') return;
    // Add a small delay for realism
    const timeout = setTimeout(() => {
      const { action, cardIds } = getBotAction(currentGame, currentGame.rules, current.id);
      if (engineRef.current) {
        engineRef.current.executeAction(current.id, action, cardIds);
        updateGameState(engineRef.current.getGameState());
      }
    }, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame]);

  // Blackjack helpers
  const isBlackjack = currentGame?.rules.id === 'blackjack' || currentGame?.rules.name.toLowerCase().includes('blackjack');
  const handValues = (currentGame as any)?.handValues || {};
  const busted = (currentGame as any)?.busted || {};

  // Helper: is it this user's turn? (assume player-1 is always the user for now)
  const isUserTurn = () => {
    if (!currentGame) return false;
    const current = getCurrentPlayer();
    return current && current.type === 'human' && current.id === 'player-1';
  };

  const handleBack = () => {
    setCurrentPage('examples');
  };

  // Action handlers
  // Helper to get suit symbol and color
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return { symbol: '♥', color: 'text-red-600' };
      case 'diamonds': return { symbol: '♦', color: 'text-red-600' };
      case 'clubs': return { symbol: '♣', color: 'text-black' };
      case 'spades': return { symbol: '♠', color: 'text-black' };
      default: return { symbol: '', color: 'text-black' };
    }
  };

  const handleDraw = () => {
    if (!engineRef.current || !currentGame) return;
    const player = getCurrentPlayer();
    if (!player) return;
    const result = engineRef.current.executeAction(player.id, 'draw');
    // Show the last drawn card if available
    const nextState = engineRef.current.getGameState();
    const lastDrawn = (nextState as any).lastDrawnCard;
    let msg: React.ReactNode = result.message;
    if (lastDrawn) {
      const { symbol, color } = getSuitSymbol(lastDrawn.suit);
      msg = (
        <span>
          You drew: <span style={{ color: (lastDrawn.suit === 'hearts' || lastDrawn.suit === 'diamonds') ? '#dc2626' : '#222' }}>{lastDrawn.rank}{symbol}</span>.
        </span>
      );
    }
    setMessage(msg);
    updateGameState(nextState);
  };

  // Dynamically determine the play action name (default 'play', fallback to first valid action that isn't draw/discard/pass)
  const getPlayActionName = () => {
    if (!engineRef.current) return 'play';
    const validActions = engineRef.current.getValidActionsForCurrentPlayer();
    // Prefer 'play', else first custom action that isn't draw/discard/pass
    if (validActions.includes('play')) return 'play';
    return validActions.find(a => !['draw', 'discard', 'pass'].includes(a)) || 'play';
  };

  const handlePlay = () => {
    if (!engineRef.current || !currentGame) return;
    const player = getCurrentPlayer();
    const isBlackjack = currentGame?.rules.id === 'blackjack' || currentGame?.rules.name.toLowerCase().includes('blackjack');
    if (!player) return;
    if (!isBlackjack && selectedCards.length === 0) return;
    const playAction = getPlayActionName();
    const result = engineRef.current.executeAction(player.id, playAction, isBlackjack ? undefined : selectedCards);
    setMessage(result.message);
    setSelectedCards([]);
    updateGameState(engineRef.current.getGameState());
  };

  const handleDiscard = () => {
    if (!engineRef.current || !currentGame) return;
    const player = getCurrentPlayer();
    if (!player || selectedCards.length !== 1) return;
    const result = engineRef.current.executeAction(player.id, 'discard', selectedCards);
    setMessage(result.message);
    setSelectedCards([]);
    updateGameState(engineRef.current.getGameState());
  };

  const handlePass = () => {
    if (!engineRef.current || !currentGame) return;
    const player = getCurrentPlayer();
    if (!player) return;
    const result = engineRef.current.executeAction(player.id, 'pass');
    setMessage(result.message);
    updateGameState(engineRef.current.getGameState());
  };

  // Card selection
  const toggleCardSelect = (cardId: string) => {
    setSelectedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  if (!currentGame) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="card p-12 lg:p-16 shadow-2xl max-w-md mx-auto">
            <div className="text-6xl mb-8">🎯</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">No Game Selected</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              It looks like you haven't selected a game to play. Let's get you back to the examples!
            </p>
            <motion.button
              onClick={handleBack}
              className="btn-primary text-lg px-8 py-4 shadow-lg"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Go Back to Examples
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold group transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Examples
          </button>
          
          <div className="text-right">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{currentGame.rules.name}</h1>
            <p className="text-xl text-gray-600 font-medium">Turn {currentGame.turn} • Round {currentGame.round}</p>
          </div>
        </motion.div>

        {/* Game Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8 lg:p-10 mb-12 shadow-xl"
        >
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Players</h3>
                <p className="text-gray-600 font-medium">{currentGame.players.length} / {currentGame.rules.players.max}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Objective</h3>
                <p className="text-gray-600">{currentGame.rules.objective.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shuffle className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Status</h3>
                <p className="text-gray-600 capitalize font-medium">{currentGame.gameStatus}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Game Area - Interactive */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="game-table min-h-[500px] flex flex-col items-center justify-center mb-12 shadow-2xl"
        >
          <GameTable>
            {/* Turn feedback */}
            <div className="mb-4 text-center">
              <span className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-semibold text-lg shadow">
                {isUserTurn()
                  ? "Your turn!"
                  : `${getCurrentPlayer()?.name}'s turn`}
              </span>
            </div>

            {/* Player hands */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              {currentGame.players.map((player, idx) => {
                const isCurrent = currentGame.currentPlayerIndex === idx;
                // Hide hand for human if keepDrawnCard is false (draw-and-reveal games)
                const keepDrawn = currentGame.rules?.setup?.keepDrawnCard !== false;
                if (player.type === 'human' && !keepDrawn) {
                  return null;
                }
                return (
                  <div key={player.id} className="flex flex-col items-center">
                    <PlayerHand
                      playerName={player.name}
                      isCurrent={isCurrent}
                      cards={player.hand.map(card => (
                        <Card
                          key={card.id}
                          suit={card.suit}
                          rank={card.rank}
                          faceDown={player.type === 'bot' && !player.isActive}
                          onClick={
                            isCurrent && player.type === 'human' && isUserTurn()
                              ? () => toggleCardSelect(card.id)
                              : undefined
                          }
                          selected={selectedCards.includes(card.id)}
                        />
                      ))}
                    />
                    {/* Blackjack: show hand value and bust status */}
                    {isBlackjack && (
                      <div className="mt-2 text-center">
                        <span className="inline-block px-3 py-1 rounded bg-gray-100 text-gray-800 text-sm font-semibold">
                          Hand: {handValues[player.id] ?? 0}
                          {busted[player.id] && (
                            <span className="ml-2 text-red-600 font-bold">BUSTED</span>
                          )}
                          {currentGame.winner === player.id && currentGame.gameStatus === 'finished' && !busted[player.id] && (
                            <span className="ml-2 text-green-600 font-bold">WINNER</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Card stack (discard pile) for draw-and-reveal games */}
            {currentGame.discardPile && currentGame.discardPile.length > 0 && (
              <div className="flex flex-col items-center mb-8">
                <div className="font-semibold text-gray-700 mb-2">Drawn Cards</div>
                <div className="flex flex-row items-end justify-center" style={{ minHeight: 60 }}>
                  {currentGame.discardPile.map((card, i) => (
                    <div
                      key={card.id}
                      style={{
                        marginLeft: i === 0 ? 0 : -32, // overlap
                        zIndex: i,
                        position: 'relative',
                        boxShadow: i === currentGame.discardPile.length - 1 ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      <Card suit={card.suit} rank={card.rank} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons for current player */}
            <div className="flex flex-wrap gap-4 justify-center mb-4">
            {engineRef.current && isUserTurn() && currentGame.gameStatus === 'active' && (
                engineRef.current.getValidActionsForCurrentPlayer().map(action => {
                  switch (action) {
                    case 'draw':
                      return (
                        <button key="draw" className="btn-primary px-6 py-2" onClick={handleDraw}>Draw</button>
                      );
                    case 'discard':
                      return (
                        <button key="discard" className="btn-primary px-6 py-2" onClick={handleDiscard} disabled={selectedCards.length !== 1}>Discard</button>
                      );
                    case 'pass':
                      return (
                        <button key="pass" className="btn-secondary px-6 py-2" onClick={handlePass}>Pass</button>
                      );
                    default:
                      // If this is the play action, show as Play button
                      if (action === getPlayActionName()) {
                        return (
                          <button key={action} className="btn-primary px-6 py-2" onClick={handlePlay} disabled={selectedCards.length === 0}>Play</button>
                        );
                      }
                      // Otherwise, show as generic custom action
                      return (
                        <button key={action} className="btn-primary px-6 py-2" onClick={() => handleCustomAction(action)}>{action}</button>
                      );
                  }
                })
              )}
            </div>

            {/* Game message */}
            {message && <div className="text-center text-lg text-green-700 font-semibold mb-2">{message}</div>}
            {/* Win/Lose message for any game */}
            {currentGame.gameStatus === 'finished' && (
              <div className="text-center text-2xl font-bold my-4">
                {currentGame.winner === 'player-1' ? (
                  <span className="text-green-700">You win! 🎉</span>
                ) : currentGame.winner ? (
                  <span className="text-red-700">You lose! {currentGame.players.find(p => p.id === currentGame.winner)?.name || 'A player'} wins.</span>
                ) : (
                  <span className="text-gray-700">No winner</span>
                )}
              </div>
            )}


            {/* Deck and discard info */}
            <div className="flex flex-row gap-8 justify-center mt-4">
              <div className="bg-white rounded-lg shadow px-4 py-2">
                <span className="font-bold">Deck:</span> {currentGame.deck.length} cards
              </div>
              <div className="bg-white rounded-lg shadow px-4 py-2">
                <span className="font-bold">Discard:</span> {currentGame.discardPile.length} cards
              </div>
            </div>
          </GameTable>
        </motion.div>

        {/* Game Rules */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Game Rules</h3>
          <div className="card p-8 lg:p-12 shadow-xl">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                    Setup
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Cards per player:</span>
                    <span className="font-semibold text-gray-900">{currentGame.rules.setup.cardsPerPlayer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Number of players:</span>
                      <span className="font-semibold text-gray-900">{currentGame.rules.players.min}-{currentGame.rules.players.max}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Deck size:</span>
                      <span className="font-semibold text-gray-900">{currentGame.rules.setup.deckSize} cards</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                    Actions
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {currentGame.rules.actions.map((action, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        {action}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {currentGame.rules.specialRules && currentGame.rules.specialRules.length > 0 && (
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                  Special Rules
                </h4>
                <div className="grid gap-4">
                  {currentGame.rules.specialRules.map((rule, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl border border-primary-100"
                    >
                      <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 leading-relaxed">{rule}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GamePage;
