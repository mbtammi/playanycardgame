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
  const [isEngineInitialized, setIsEngineInitialized] = useState(false);
  const engineRef = useRef<GameEngine | null>(null);

  // Only initialize engine when game ID or rules change (not every state update)
  useEffect(() => {
    if (currentGame && !isEngineInitialized) {
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
      // Only update if this is the first initialization
      updateGameState(engineRef.current.getGameState());
      setIsEngineInitialized(true);
    }
    
    // Reset when game changes
    if (!currentGame) {
      setIsEngineInitialized(false);
      engineRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame?.id]);

  // Helper: get current player
  const getCurrentPlayer = () => {
    if (!currentGame) return null;
    return currentGame.players[currentGame.currentPlayerIndex];
  };

  // Bot turn effect: triggers after every turn change (currentPlayerIndex)
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
  }, [currentGame?.currentPlayerIndex, currentGame?.gameStatus]);

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
      const { symbol } = getSuitSymbol(lastDrawn.suit);
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

  // Handle custom actions (fallback for unknown action types)
  const handleCustomAction = (action: string) => {
    if (!engineRef.current) return;
    const current = getCurrentPlayer();
    // Only allow human to act on their turn
    if (!current || current.type !== 'human' || !isUserTurn()) return;
    engineRef.current.executeAction(current.id, action as any, selectedCards);
    updateGameState(engineRef.current.getGameState());
    setSelectedCards([]);
  };

  // Card selection
  const toggleCardSelect = (cardId: string) => {
    setSelectedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  if (!currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="w-4/5 mx-auto"> {/* 80% width container */}
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-32 left-16 w-24 h-24 bg-green-200/30 rounded-full blur-xl"
          />
          <motion.div
            animate={{ 
              y: [0, 30, 0],
              x: [0, 10, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-40 right-20 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl"
          />
        </div>

        <div className="text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 lg:p-16 shadow-2xl max-w-md mx-auto border border-green-100/50"
          >
            <motion.div 
              className="text-6xl mb-8"
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🎯
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">No Game Selected</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              It looks like you haven't selected a game to play. Let's get you back to the examples!
            </p>
            <motion.button
              onClick={handleBack}
              className="btn-primary text-lg px-8 py-4 shadow-xl hover:shadow-2xl"
              whileHover={{ 
                scale: 1.05, 
                y: -3,
                boxShadow: "0 25px 50px -12px rgba(34, 197, 94, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              Go Back to Examples
            </motion.button>
          </motion.div>
        </div>
        </div> {/* Close 80% width container */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="w-4/5 mx-auto py-8"> {/* 80% width container */}
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -25, 0],
            rotate: [0, 8, 0]
          }}
          transition={{ 
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-12 w-28 h-28 bg-blue-200/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [0, 35, 0],
            x: [0, -20, 0]
          }}
          transition={{ 
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-32 left-16 w-36 h-36 bg-green-200/15 rounded-full blur-2xl"
        />
      </div>

      <div className="max-w-3xl mx-auto relative">{/* Reduced from max-w-5xl */}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            onClick={handleBack}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold group transition-colors bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-green-200/50 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Examples
          </motion.button>
          
          <motion.div 
            className="text-right"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{currentGame.rules.name}</h1>
            <p className="text-xl text-gray-600 font-medium">Turn {currentGame.turn} • Round {currentGame.round}</p>
          </motion.div>
        </motion.div>

        {/* Game Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          whileHover={{ y: -3 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 mb-12 shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-500"
        >
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="flex items-center gap-4 group"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Users className="w-6 h-6 text-green-600" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Players</h3>
                <p className="text-gray-600 font-medium">
                  {currentGame.players.length} / {currentGame.rules.players.max}
                  {currentGame.players.length > 1 && (
                    <span className="ml-2 text-sm">
                      ({currentGame.players.filter(p => p.type === 'human').length} human, {currentGame.players.filter(p => p.type === 'bot').length} bot)
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-4 group"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Target className="w-6 h-6 text-blue-600" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Objective</h3>
                <p className="text-gray-600">{currentGame.rules.objective.description}</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-4 group"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Shuffle className="w-6 h-6 text-purple-600" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Status</h3>
                <p className="text-gray-600 capitalize font-medium">{currentGame.gameStatus}</p>
              </div>
            </motion.div>
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
            {/* Turn feedback - Enhanced for multiplayer */}
            <div className="mb-6 text-center">
              <div className="inline-block">
                <span className="px-6 py-3 rounded-full bg-primary-100 text-primary-700 font-bold text-xl shadow-lg">
                  {isUserTurn()
                    ? "🎯 Your turn!"
                    : `⏳ ${getCurrentPlayer()?.name}'s turn`}
                </span>
                {currentGame.players.length > 1 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Turn {currentGame.turn} • Round {currentGame.round}
                  </div>
                )}
              </div>
            </div>

            {/* All Players Display */}
            <div className="w-full mb-8">
              {/* Current player indicator for multiplayer */}
              {currentGame.players.length > 1 && (
                <div className="mb-6 text-center">
                  <div className="flex justify-center items-center gap-4 flex-wrap">
                    {currentGame.players.map((player, idx) => (
                      <div 
                        key={player.id} 
                        className={`px-4 py-2 rounded-full transition-all ${
                          idx === currentGame.currentPlayerIndex 
                            ? 'bg-primary-600 text-white shadow-lg scale-110' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="font-semibold">{player.name}</span>
                        <span className="ml-2 text-sm">({player.hand.length} cards)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player hands layout */}
              <div className="flex flex-wrap justify-center gap-8">
                {currentGame.players.map((player, idx) => {
                  const isCurrent = currentGame.currentPlayerIndex === idx;
                  // Show all players for multiplayer games
                  const isMultiplayer = currentGame.players.length > 1;
                  const keepDrawn = currentGame.rules?.setup?.keepDrawnCard !== false;
                  
                  // For single player games, hide human hand if keepDrawnCard is false
                  if (!isMultiplayer && player.type === 'human' && !keepDrawn) {
                    return null;
                  }

                  return (
                    <div key={player.id} className="flex flex-col items-center">
                      <PlayerHand
                        playerName={player.name}
                        isCurrent={isCurrent}
                        cards={player.hand.map(card => {
                          // Check if this card is playable
                          const isPlayable = isCurrent && 
                                           player.type === 'human' && 
                                           isUserTurn() && 
                                           engineRef.current?.isValidPlay?.(card.id);
                          
                          return (
                            <div key={card.id} className="relative">
                              <Card
                                suit={card.suit}
                                rank={card.rank}
                                faceDown={player.type === 'bot' && !isCurrent}
                                onClick={
                                  isCurrent && player.type === 'human' && isUserTurn()
                                    ? () => toggleCardSelect(card.id)
                                    : undefined
                                }
                                selected={selectedCards.includes(card.id)}
                              />
                              {/* Show playability indicator for Sevens */}
                              {isPlayable && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">✓</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
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
                      {/* Show card count for multiplayer */}
                      {isMultiplayer && (
                        <div className="mt-2 text-center">
                          <span className="text-sm text-gray-600">
                            {player.hand.length} cards
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Community Cards/Table Area */}
            {(currentGame.rules.id === 'sevens') || 
             (currentGame.communityCards && currentGame.communityCards.length > 0) ? (
              <div className="flex flex-col items-center mb-12"> {/* Increased bottom margin */}
                <div className="font-semibold text-gray-700 mb-4 text-lg">Table</div>
                <div className="bg-green-100 rounded-xl p-8 min-w-96 min-h-40"> {/* Increased padding */}
                  <div className="grid grid-cols-4 gap-6 justify-items-center"> {/* Increased gap */}
                    {/* Sevens-specific table display */}
                    {currentGame.rules.id === 'sevens' && (currentGame as any).table ? (
                      ['hearts', 'diamonds', 'clubs', 'spades'].map(suit => {
                        const suitCards = (currentGame as any).table[suit] || [];
                        const { symbol, color } = getSuitSymbol(suit);
                        return (
                          <div key={suit} className="flex flex-col items-center">
                            <div className={`text-sm font-medium mb-2 capitalize ${color}`}>
                              {suit} {symbol}
                            </div>
                            <div className="flex flex-wrap justify-center gap-1">
                              {suitCards.length > 0 ? (
                                (() => {
                                  // Calculate required width and height for the stack
                                  const cardWidth = 64; // Standard card width
                                  const cardHeight = 96; // Standard card height
                                  const stackWidth = cardWidth + (suitCards.length - 1) * 12; // Base width + spacing
                                  const stackHeight = cardHeight + (suitCards.length - 1) * 2; // Base height + depth
                                  
                                  return (
                                    <div 
                                      className="relative"
                                      style={{ 
                                        width: `${stackWidth}px`, 
                                        height: `${stackHeight}px`,
                                        minHeight: '96px', // Ensure minimum card height
                                        minWidth: '64px'   // Ensure minimum card width
                                      }}
                                    >
                                      {/* Clean sequence stack for Sevens - cards in a neat line */}
                                      {suitCards
                                        .sort((a: any, b: any) => {
                                          const getValue = (rank: string) => {
                                            switch (rank) {
                                              case 'A': return 14;
                                              case 'K': return 13;
                                              case 'Q': return 12;
                                              case 'J': return 11;
                                              default: return parseInt(rank);
                                            }
                                          };
                                          return getValue(a.rank) - getValue(b.rank);
                                        })
                                        .map((card: any, index: number) => (
                                          <div 
                                            key={card.id} 
                                            className="absolute transition-all duration-300 hover:z-50 hover:scale-110"
                                            style={{ 
                                              left: `${index * 12}px`, // Clean horizontal spacing
                                              top: `${index * 2}px`,   // Slight vertical offset for depth
                                              zIndex: index + 1,
                                              transform: `rotate(${index * 0.5}deg)` // Very subtle rotation for realism
                                            }}
                                          >
                                            <Card suit={card.suit} rank={card.rank} />
                                          </div>
                                        ))}
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="w-16 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
                                  Empty
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* Generic community cards display for other games - messy pile style */
                      ['hearts', 'diamonds', 'clubs', 'spades'].map(suit => {
                        const suitCards = currentGame.communityCards.filter(card => card.suit === suit);
                        return (
                          <div key={suit} className="flex flex-col items-center">
                            <div className="text-sm font-medium text-gray-600 mb-2 capitalize">{suit}</div>
                            <div className="flex flex-wrap justify-center gap-1">
                              {suitCards.length > 0 ? (
                                (() => {
                                  // Calculate required size for messy pile (more generous for random positioning)
                                  const cardWidth = 64;
                                  const cardHeight = 96;
                                  const pileWidth = cardWidth + 40; // Extra space for random positioning
                                  const pileHeight = cardHeight + (suitCards.length * 3) + 16; // Stack height + random offset
                                  
                                  return (
                                    <div 
                                      className="relative flex justify-center"
                                      style={{ 
                                        width: `${pileWidth}px`, 
                                        height: `${pileHeight}px`,
                                        minHeight: '96px',
                                        minWidth: '80px'
                                      }}
                                    >
                                      {/* Messy pile stack - random positioning for casual games */}
                                      {suitCards
                                        .sort((a, b) => {
                                          const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                                          return ranks.indexOf(a.rank) - ranks.indexOf(b.rank);
                                        })
                                        .map((card, index) => {
                                          // Create controlled "randomness" based on card ID for consistency
                                          const seed = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                          const randomX = (seed % 20) - 10; // -10 to +10 px
                                          const randomY = (seed % 16) - 8;  // -8 to +8 px
                                          const randomRotation = (seed % 30) - 15; // -15 to +15 degrees
                                          
                                          return (
                                            <div 
                                              key={card.id} 
                                              className="absolute transition-all duration-300 hover:z-50 hover:scale-110"
                                              style={{ 
                                                left: `${20 + randomX}px`, // Center + random offset
                                                top: `${index * 3 + randomY}px`, // Stack height + random offset
                                                zIndex: index + 1,
                                                transform: `rotate(${randomRotation}deg)`
                                              }}
                                            >
                                              <Card suit={card.suit} rank={card.rank} />
                                            </div>
                                          );
                                        })}
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="w-16 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
                                  Empty
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Card stack (discard pile) for draw-and-reveal games */}
            {currentGame.discardPile && currentGame.discardPile.length > 0 && !currentGame.communityCards?.length && (
              <div className="flex flex-col items-center mb-8">
                <div className="font-semibold text-gray-700 mb-2">Drawn Cards</div>
                <div 
                  className="relative flex justify-center" 
                  style={{ 
                    width: '128px', // Fixed width to contain the messy pile
                    height: `${96 + currentGame.discardPile.length * 2 + 16}px`, // Card height + stack + random offset space
                    minHeight: '96px' // Minimum card height
                  }}
                >
                  {/* Messy pile for discard - only top card matters */}
                  {currentGame.discardPile.map((card, i) => {
                    // Create controlled "randomness" for messy pile effect
                    const seed = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const randomX = (seed % 24) - 12; // -12 to +12 px
                    const randomY = (seed % 16) - 8;  // -8 to +8 px
                    const randomRotation = (seed % 40) - 20; // -20 to +20 degrees (more chaotic)
                    
                    return (
                      <div
                        key={card.id}
                        className="absolute transition-all duration-300"
                        style={{
                          left: `${64 + randomX}px`, // Center (64px from left) + random offset
                          top: `${i * 2 + randomY}px`, // Small stack height + random
                          zIndex: i + 1,
                          transform: `rotate(${randomRotation}deg)`,
                          boxShadow: i === currentGame.discardPile.length - 1 ? '0 8px 24px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Card suit={card.suit} rank={card.rank} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons for current player (only show for human's turn) */}
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              {engineRef.current && isUserTurn() && currentGame.gameStatus === 'active' && (
                <>
                  {/* Show intelligent hints for Sevens */}
                  {currentGame.rules.id === 'sevens' && (
                    <div className="w-full text-center mb-2">
                      {(() => {
                        const table = (currentGame as any).table || {};
                        const totalCardsOnTable = Object.values(table).reduce((sum: number, suitCards: any) => sum + suitCards.length, 0);
                        
                        if (totalCardsOnTable === 0) {
                          return (
                            <span className="text-sm text-gray-600 bg-red-50 px-3 py-1 rounded-full">
                              🎯 First move: Play the 7 of diamonds to start!
                            </span>
                          );
                        } else {
                          const currentPlayer = getCurrentPlayer();
                          const hasValidMove = currentPlayer && engineRef.current?.hasValidSevensMove?.(currentPlayer.id);
                          
                          if (hasValidMove) {
                            return (
                              <span className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full">
                                💡 You can play a 7 or build up/down from existing cards
                              </span>
                            );
                          } else {
                            return (
                              <span className="text-sm text-gray-600 bg-yellow-50 px-3 py-1 rounded-full">
                                ⚠️ No valid moves - you must pass
                              </span>
                            );
                          }
                        }
                      })()}
                    </div>
                  )}
                  
                  {engineRef.current.getValidActionsForCurrentPlayer().map(action => {
                    switch (action) {
                      case 'draw':
                        return (
                          <button key="draw" className="btn-primary px-8 py-3 text-lg font-semibold" onClick={handleDraw}>
                            🃏 Draw Card
                          </button>
                        );
                      case 'discard':
                        return (
                          <button 
                            key="discard" 
                            className="btn-primary px-8 py-3 text-lg font-semibold" 
                            onClick={handleDiscard} 
                            disabled={selectedCards.length !== 1}
                          >
                            🗑️ Discard ({selectedCards.length}/1)
                          </button>
                        );
                      case 'pass':
                        return (
                          <button key="pass" className="btn-secondary px-8 py-3 text-lg font-semibold" onClick={handlePass}>
                            ⏭️ Pass Turn
                          </button>
                        );
                      default:
                        // If this is the play action, show as Play button
                        if (action === getPlayActionName()) {
                          return (
                            <button 
                              key={action} 
                              className="btn-primary px-8 py-3 text-lg font-semibold" 
                              onClick={handlePlay} 
                              disabled={selectedCards.length === 0}
                            >
                              🎴 Play Cards ({selectedCards.length})
                            </button>
                          );
                        }
                        // Otherwise, show as generic custom action
                        return (
                          <button 
                            key={action} 
                            className="btn-primary px-8 py-3 text-lg font-semibold" 
                            onClick={() => handleCustomAction(action)}
                          >
                            ⚡ {action}
                          </button>
                        );
                    }
                  })}
                </>
              )}
              
              {/* Show waiting message for non-current players */}
              {!isUserTurn() && currentGame.gameStatus === 'active' && currentGame.players.length > 1 && (
                <div className="text-center">
                  <span className="px-6 py-3 rounded-full bg-gray-100 text-gray-600 font-medium">
                    ⏳ Waiting for {getCurrentPlayer()?.name}...
                  </span>
                </div>
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
      </div> {/* Close 80% width container */}
    </div>
  );
};

export default GamePage;
