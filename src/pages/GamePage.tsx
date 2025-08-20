import { useEffect, useRef, useState } from 'react';
import { getBotAction } from '../engine/bot';
import { motion } from 'framer-motion';
import { useCurrentGame, useAppStore } from '../store';
import { ArrowLeft, Users, Target, Shuffle } from 'lucide-react';
import PlayerHand from '../components/game/PlayerHand';
import Card from '../components/game/Card';
import GameTable from '../components/game/GameTable';
import { GameEngine } from '../engine/gameEngine';
import './GamePage.css';


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
      case 'hearts': return { symbol: '♥', color: 'text-red' };
      case 'diamonds': return { symbol: '♦', color: 'text-red' };
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

  // Helper: should a hand be compact (many cards)?
  const isHandCompact = (hand: any[]) => hand.length > 7;

  if (!currentGame) {
    return (
      <div className="no-game-container">
        <div className="no-game-wrapper">
          <div className="no-game-content">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="no-game-card"
            >
              <div className="no-game-icon">🎯</div>
              <h2 className="no-game-title">No Game Selected</h2>
              <p className="no-game-description">
                It looks like you haven't selected a game to play. Let's get you back to the examples!
              </p>
              <motion.button
                onClick={handleBack}
                className="btn-primary text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Go Back to Examples
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-container">
        <div className="game-content">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="game-header"
          >
            <motion.button
              onClick={handleBack}
              className="back-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="back-icon" />
              Back to Examples
            </motion.button>
            
            <motion.div 
              className="game-info"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="game-title">{currentGame.rules.name}</h1>
              <p className="game-meta">Turn {currentGame.turn} • Round {currentGame.round}</p>
            </motion.div>
          </motion.div>

          {/* Game Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="game-stats"
          >
            <div className="stats-grid">
                            <div className="stat-item">
                <div className="stat-icon players">
                  <Users className="icon-small icon-blue" />
                </div>
                <div className="stat-text">
                  <div className="stat-label">Players</div>
                  <div className="stat-value">
                    {currentGame.players.length}
                    {currentGame.players.length > 1 && (
                      <span className="margin-left-small text-small">
                        ({currentGame.players.filter(p => p.type === 'human').length} human, {currentGame.players.filter(p => p.type === 'bot').length} bot)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon turn">
                  <Target className="icon-small icon-green" />
                </div>
                <div className="stat-text">
                  <div className="stat-label">Objective</div>
                  <div className="stat-value">{currentGame.rules.objective.description}</div>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon deck">
                  <Shuffle className="icon-small icon-purple" />
                </div>
                <div className="stat-text">
                  <div className="stat-label">Status</div>
                  <div className="stat-value" style={{ textTransform: 'capitalize' }}>{currentGame.gameStatus}</div>
                </div>
              </div>
            </div>
          </motion.div>

        {/* Game Area - Interactive */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="game-table"
        >
          <GameTable>
            {/* Turn feedback - Enhanced for multiplayer */}
            <div className="turn-indicator">
              <div className="inline-block">
                <span className="turn-badge-new">
                  {isUserTurn()
                    ? "🎯 Your turn!"
                    : `⏳ ${getCurrentPlayer()?.name}'s turn`}
                </span>
                {currentGame.players.length > 1 && (
                  <div className="turn-meta-new">
                    Turn {currentGame.turn} • Round {currentGame.round}
                  </div>
                )}
              </div>
            </div>

            {/* All Players Display */}
            <div className="w-full mb-8">
              {/* Current player indicator for multiplayer */}
              {currentGame.players.length > 1 && (
                <div className="player-management">
                  <div className="player-list-container">
                    {currentGame.players.map((player, idx) => (
                      <div 
                        key={player.id} 
                        className={`player-chip ${
                          idx === currentGame.currentPlayerIndex 
                            ? 'active' 
                            : 'inactive'
                        }`}
                      >
                        <span className="font-semibold">{player.name}</span>
                        <span className="player-chip-count">({player.hand.length} cards)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player hands layout */}
              <div className="players-display">
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
                    <div key={player.id} className="player-display">
                      <PlayerHand
                        playerName={player.name}
                        isCurrent={isCurrent}
                        cards={player.hand.map((card, idx) => {
                          const isPlayable = isCurrent && player.type === 'human' && isUserTurn() && engineRef.current?.isValidPlay?.(card.id);
                          return (
                            <div key={card.id} className="card-container">
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
                                <div className="check-indicator-small">
                                  <span className="check-text">✓</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        // Add compact class if hand is large
                        className={isHandCompact(player.hand) ? 'compact' : ''}
                      />
                      {/* Blackjack: show hand value and bust status */}
                      {isBlackjack && (
                        <div className="hand-status">
                          <span className="hand-value-badge">
                            Hand: {handValues[player.id] ?? 0}
                            {busted[player.id] && (
                              <span className="bust-indicator">BUSTED</span>
                            )}
                            {currentGame.winner === player.id && currentGame.gameStatus === 'finished' && !busted[player.id] && (
                              <span className="winner-indicator">WINNER</span>
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
                                  const stackWidth = cardWidth + (suitCards.length - 1) * 8; // Reduced spacing to match positioning
                                  const stackHeight = cardHeight + (suitCards.length - 1) * 1; // Reduced height to match positioning
                                  
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
                                            className="card-in-stack"
                                            style={{ 
                                              left: `${index * 8}px`, // Reduced horizontal spacing for tighter stack
                                              top: `${index * 1}px`,   // Reduced vertical offset for tighter stack
                                              zIndex: index + 1,
                                              transform: `rotate(${index * 0.3}deg)` // Reduced rotation for subtlety
                                            }}
                                          >
                                            <Card suit={card.suit} rank={card.rank} />
                                          </div>
                                        ))}
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="card-stack-empty">
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
                                  // No extra space needed - cards stack exactly on top
                                  const cardWidth = 64;
                                  const cardHeight = 96;
                                  
                                  return (
                                    <div 
                                      className="card-stack-messy"
                                      style={{ 
                                        width: `${cardWidth}px`, 
                                        height: `${cardHeight}px`,
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
                                          // Create controlled "randomness" for rotation only
                                          const seed = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                          const randomRotation = (seed % 20) - 10; // Only rotation varies
                                          
                                          return (
                                            <div 
                                              key={card.id} 
                                              className="card-in-stack"
                                              style={{ 
                                                left: '0px', // Always at left edge
                                                top: '0px', // Always at top
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
                                <div className="card-stack-empty">
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
                  className="card-stack-messy" 
                  style={{ 
                    width: '64px', // Just card width, no extra space needed
                    height: '96px', // Just card height, no stacking height needed
                    minHeight: '96px' // Minimum card height
                  }}
                >
                  {/* Messy pile for discard - cards stack directly on top */}
                  {currentGame.discardPile.map((card, i) => {
                    // Create controlled "randomness" for rotation only
                    const seed = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const randomRotation = (seed % 20) - 10; // Only rotation varies
                    
                    return (
                      <div
                        key={card.id}
                        className="card-in-stack"
                        style={{
                          left: '0px', // Always at left edge of 64px container
                          top: '0px',   // Always at top, no vertical variation
                          zIndex: i + 1, // Higher index = on top
                          transform: `rotate(${randomRotation}deg)`,
                          boxShadow: i === currentGame.discardPile.length - 1 ? '0 4px 12px rgba(0,0,0,0.2)' : 'none', // Only top card has shadow
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
                              🎯 First move: Play the 7 of Clubs to start!
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
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="text-center my-8"
              >
                <div className={`inline-block px-8 py-6 rounded-2xl border-2 ${
                  currentGame.winner === 'player-1' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : currentGame.winner
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}>
                  {currentGame.winner === 'player-1' ? (
                    <div className="space-y-2">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-3xl font-bold">Congratulations!</h3>
                      <p className="text-xl">You won the game!</p>
                      {currentGame.players.length > 1 && (
                        <p className="text-lg opacity-80">
                          Final scores: {currentGame.players.map(p => 
                            `${p.name}: ${p.hand.length} cards`
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                  ) : currentGame.winner ? (
                    <div className="space-y-2">
                      <div className="text-6xl mb-4">😔</div>
                      <h3 className="text-3xl font-bold">Game Over</h3>
                      <p className="text-xl">
                        {currentGame.players.find(p => p.id === currentGame.winner)?.name || 'Bot'} wins!
                      </p>
                      {currentGame.players.length > 1 && (
                        <p className="text-lg opacity-80">
                          Final scores: {currentGame.players.map(p => 
                            `${p.name}: ${p.hand.length} cards`
                          ).join(', ')}
                        </p>
                      )}
                      <p className="text-lg mt-2">Better luck next time!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-6xl mb-4">🤝</div>
                      <h3 className="text-3xl font-bold">It's a Tie!</h3>
                      <p className="text-xl">No clear winner this round</p>
                    </div>
                  )}
                  
                  {/* Play Again Button */}
                  <motion.button
                    onClick={() => {
                      // Restart the game by reinitializing the engine
                      if (currentGame && engineRef.current) {
                        try {
                          // Create a fresh engine instance
                          engineRef.current = new GameEngine(currentGame.rules);
                          currentGame.players.forEach(p => {
                            engineRef.current?.addPlayer(p.name, p.type, p.avatar);
                          });
                          engineRef.current.startGame();
                          updateGameState(engineRef.current.getGameState());
                          setMessage(null);
                          setSelectedCards([]);
                        } catch (error) {
                          // If restart fails, go back to examples
                          handleBack();
                        }
                      }
                    }}
                    className="btn-primary mt-6 px-8 py-3 text-lg font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🎮 Play Again
                  </motion.button>
                  
                  <motion.button
                    onClick={handleBack}
                    className="btn-secondary mt-4 ml-4 px-8 py-3 text-lg font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🏠 Back to Games
                  </motion.button>
                </div>
              </motion.div>
            )}


            {/* Deck and discard info */}
            <div className="flex flex-row gap-8 justify-center mt-4">
              <div className="bg-white rounded-lg shadow ">
                <span className="font-bold DeckDiscard">Deck:</span> {currentGame.deck.length} cards
              </div>
              <div className="bg-white rounded-lg shadow ">
                <span className="font-bold DeckDiscard">Discard:</span> {currentGame.discardPile.length} cards
              </div>
            </div>
          </GameTable>
        </motion.div>

        {/* Game Rules */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16 rules-section"
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Game Rules</h3>
          <div className="rules-box">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                    Setup
                  </h4>
                  <div className="bg-white rounded-xl p-6 space-y-3 border border-gray-200">
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
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                    Actions
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {currentGame.rules.actions.map((action, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
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
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                  Special Rules
                </h4>
                <div className="grid gap-4">
                  {currentGame.rules.specialRules.map((rule, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200"
                    >
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
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

        {/* Debug Panel - Only show for custom games */}
        {currentGame.rules.winConditions.some(w => w.type === 'custom') && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🔍 Debug Information</h3>
            <div className="bg-gray-900 text-white p-6 rounded-xl font-mono text-sm max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <strong className="text-yellow-400">Game Status:</strong> 
                    <span className={`ml-2 ${currentGame.gameStatus === 'finished' ? 'text-green-400' : 'text-blue-400'}`}>
                      {currentGame.gameStatus}
                    </span>
                  </div>
                  <div className="mb-4">
                    <strong className="text-yellow-400">Winner:</strong> 
                    <span className="ml-2 text-green-400">{currentGame.winner || 'None'}</span>
                  </div>
                  <div className="mb-4">
                    <strong className="text-yellow-400">Current Player:</strong> 
                    <span className="ml-2 text-blue-400">
                      {currentGame.players[currentGame.currentPlayerIndex]?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <strong className="text-yellow-400">Last Action:</strong> 
                    <span className="ml-2 text-purple-400">{currentGame.lastAction?.action || 'None'}</span>
                  </div>
                  {(currentGame as any).lastDrawnCard && (
                    <div className="mb-4">
                      <strong className="text-yellow-400">Last Drawn Card:</strong> 
                      <span className="ml-2 text-white">
                        {(currentGame as any).lastDrawnCard.rank} of {(currentGame as any).lastDrawnCard.suit}
                      </span>
                      <span className={`ml-2 font-bold ${
                        ((currentGame as any).lastDrawnCard.suit === 'clubs' || (currentGame as any).lastDrawnCard.suit === 'spades') 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}>
                        {((currentGame as any).lastDrawnCard.suit === 'clubs' || (currentGame as any).lastDrawnCard.suit === 'spades') 
                          ? '(BLACK - Should Win!)' 
                          : '(RED - Continue)'
                        }
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <strong className="text-yellow-400">Win Condition Type:</strong> 
                    <span className="ml-2 text-orange-400">
                      {currentGame.rules.winConditions[0]?.type || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="text-gray-400 text-xs mb-2">Win Condition Description:</div>
                <div className="text-white bg-gray-800 p-3 rounded">
                  "{currentGame.rules.winConditions[0]?.description || 'No description'}"
                </div>
              </div>
              <div className="text-gray-400 text-xs mt-4">
                💡 Check browser console (F12) for detailed win condition evaluation logs
              </div>
            </div>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
};

export default GamePage;
