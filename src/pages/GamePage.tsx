import { useEffect, useRef, useState } from 'react';
import { getBotAction } from '../engine/bot';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentGame, useAppStore } from '../store';
import { ArrowLeft, Users, Target, Shuffle } from 'lucide-react';
import PlayerHand from '../components/game/PlayerHand';
import Card from '../components/game/Card';
import GameTable from '../components/game/GameTable';
import CardStack from '../components/CardStack';
import { GameEngine } from '../engine/gameEngine';
import './GamePage.css';


const GamePage = () => {
  const currentGame = useCurrentGame();
  const { setCurrentPage, updateGameState } = useAppStore();
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [message, setMessage] = useState<React.ReactNode>(null);
  // Track engine initialized boolean (simple ref instead of state to avoid rerenders)
  const engineInitializedRef = useRef(false);
  const [botThinking, setBotThinking] = useState(false);
  const [instantWin, setInstantWin] = useState<{
    show: boolean;
    isWin: boolean;
    card?: { rank: string; suit: string };
    message: string;
  }>({ show: false, isWin: false, message: '' });
  // Track which game id we've already initialized to prevent re-init loops
  const initializedForIdRef = useRef<string | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Helper to get current player
  const getCurrentPlayer = () => {
    if (!currentGame) return null;
    return currentGame.players[currentGame.currentPlayerIndex] || null;
  };

  // Engine initialization: decoupled from ephemeral wrapper game id (uses rules.id)
  useEffect(() => {
    const rulesKey = currentGame?.rules?.id;
    console.log('🔧 Engine init effect', { rulesKey, initializedFor: initializedForIdRef.current, hasEngine: !!engineRef.current });
    if (!currentGame || !rulesKey) {
      engineRef.current = null;
      initializedForIdRef.current = null;
      engineInitializedRef.current = false;
      return;
    }
    if (engineRef.current && initializedForIdRef.current === rulesKey) return; // already initialized for these rules

    engineRef.current = new GameEngine(currentGame.rules);
    currentGame.players.forEach(p => engineRef.current?.addPlayer(p.name, p.type, p.avatar));
    try { engineRef.current.startGame(); } catch (e) { console.error('startGame failed', e); }
    const started = engineRef.current.getGameState();
    // Keep original outer game id stable
    (started as any).id = currentGame.id;
    console.log('✅ Engine started', { hands: started.players.map(p => p.hand.length), status: started.gameStatus, id: started.id });
    updateGameState(started);
    initializedForIdRef.current = rulesKey;
    engineInitializedRef.current = true;
  }, [currentGame?.rules?.id]);

  // Allow manual restart (used when rules the same but want fresh deal)
  const restartGame = () => {
    if (!currentGame) return;
    initializedForIdRef.current = null;
    engineRef.current = null;
    engineInitializedRef.current = false;
    // Trigger effect by calling updateGameState with a noop so dependency unchanged but we re-run manually
    const rulesKey = currentGame.rules.id;
    console.log('🔄 Manual restart requested');
    engineRef.current = new GameEngine(currentGame.rules);
    currentGame.players.forEach(p => engineRef.current?.addPlayer(p.name, p.type, p.avatar));
    try { engineRef.current.startGame(); } catch (e) { console.error('startGame failed', e); }
    const started = engineRef.current.getGameState();
    (started as any).id = currentGame.id;
    updateGameState(started);
    initializedForIdRef.current = rulesKey;
    engineInitializedRef.current = true;
  };
    
  // Bot turn effect
  useEffect(() => {
    if (!currentGame || !engineRef.current) return;
    const cp = getCurrentPlayer();
    if (!cp || cp.type !== 'bot' || currentGame.gameStatus !== 'active') return;
    console.log(`🤖 Bot turn detected for ${cp.name} (${cp.id})`);
    setBotThinking(true);
    const timeout = setTimeout(() => {
      try {
        const { action, cardIds } = getBotAction(currentGame, currentGame.rules, cp.id);
        if (engineRef.current) {
          engineRef.current.executeAction(cp.id, action, cardIds);
          updateGameState(engineRef.current.getGameState());
        }
      } catch (e) {
        console.error('Bot move error', e);
      } finally {
        setBotThinking(false);
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [currentGame?.currentPlayerIndex, currentGame?.gameStatus]);

  // Blackjack helpers
  const isBlackjack = currentGame?.rules.id === 'blackjack' || currentGame?.rules.name.toLowerCase().includes('blackjack');
  const handValues = (currentGame as any)?.handValues || {};
  const busted = (currentGame as any)?.busted || {};

  // Helper: is it this user's turn? (assume player-1 is always the user for now)
  const isUserTurn = () => {
    if (!currentGame) return false;
    const current = getCurrentPlayer();
    const result = current && current.type === 'human' && current.id === 'player-1';
    
    // Debug logging for action button visibility issues
    if (!result && current) {
      console.log(`❌ isUserTurn() = false. Current player:`, {
        id: current.id,
        name: current.name,
        type: current.type,
        expectedId: 'player-1'
      });
    } else if (result) {
      console.log(`✅ isUserTurn() = true. Current player: ${current?.name} (${current?.id})`);
    }
    
    return result;
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
    
    // Get the updated state
    const nextState = engineRef.current.getGameState();
    const lastDrawn = (nextState as any).lastDrawnCard;
    
    // Check for instant win/lose in solo draw games
    const isSoloDrawGame = currentGame.rules.actions.includes('draw') && 
                          currentGame.players.length === 1 &&
                          currentGame.rules.winConditions.some(w => w.type === 'custom');
    
    if (isSoloDrawGame && lastDrawn) {
      const isBlack = lastDrawn.suit === 'clubs' || lastDrawn.suit === 'spades';
      
      // Check if this is a black card win condition
      const isBlackCardWinGame = currentGame.rules.winConditions.some(w => 
        w.type === 'custom' && 
        w.description && w.description.toLowerCase().includes('black') && w.description.toLowerCase().includes('win')
      );
      
      if (isBlackCardWinGame) {
        if (isBlack) {
          // Instant win!
          setInstantWin({
            show: true,
            isWin: true,
            card: lastDrawn,
            message: `🎉 You drew a BLACK card (${lastDrawn.rank}${getSuitSymbol(lastDrawn.suit).symbol}) - YOU WIN!`
          });
          
          // Hide the instant win after 3 seconds
          setTimeout(() => {
            setInstantWin(prev => ({ ...prev, show: false }));
          }, 3000);
        } else {
          // Red card - continue game
          setInstantWin({
            show: true,
            isWin: false,
            card: lastDrawn,
            message: `You drew a RED card (${lastDrawn.rank}${getSuitSymbol(lastDrawn.suit).symbol}) - Keep drawing!`
          });
          
          // Hide the message after 2 seconds
          setTimeout(() => {
            setInstantWin(prev => ({ ...prev, show: false }));
          }, 2000);
        }
      }
    }
    
    // Show the last drawn card message as before
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
          className="game-area-container"
        >
          {/* Turn feedback - Enhanced for multiplayer */}
          <div className="turn-indicator">
            <div className="inline-block">
              <span className="turn-badge-new">
                {isUserTurn()
                  ? "🎯 Your turn!"
                  : botThinking
                  ? `🤔 ${getCurrentPlayer()?.name} is thinking...`
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
                  // BUT keep the player visible for draw-based games so action buttons work
                  if (!isMultiplayer && player.type === 'human' && !keepDrawn && 
                      !currentGame.rules.actions.includes('draw')) {
                    return null;
                  }

                  return (
                    <div key={player.id} className="player-display">
                      <PlayerHand
                        playerName={player.name}
                        isCurrent={isCurrent}
                        cards={player.hand.map((card) => {
                          const isPlayable = isCurrent && player.type === 'human' && isUserTurn() && engineRef.current?.isValidPlay?.(card.id);
                          return (
                            <div key={card.id} className="card-container">
                              <Card
                                suit={card.suit}
                                rank={card.rank}
                                faceDown={player.type === 'bot'} // Always hide bot cards
                                onClick={
                                  isCurrent && player.type === 'human' && isUserTurn()
                                    ? () => toggleCardSelect(card.id)
                                    : undefined
                                }
                                selected={selectedCards.includes(card.id)}
                              />
                              {/* Show playability indicator for interactive games */}
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

            {/* Universal Game Table - AI-driven and context-aware */}
            <div className="game-table-outer">
              <GameTable
                table={(currentGame as any).table}
                gameRules={currentGame.rules}
                tableData={engineRef.current?.getTableDisplayData?.()}
                layout={engineRef.current?.getOptimalTableLayout?.() || 'centered'}
                flexiblePlacement={engineRef.current?.getTableDisplayData?.()?.metadata?.flexiblePlacement || false}
                playerCount={currentGame.players.length}
                onTableCardClick={(cardId: string, zoneId: string) => {
                  // Handle table card clicks (like flipping cards in memory games)
                  if (engineRef.current && isUserTurn()) {
                    try {
                      console.log(`Clicking table card ${cardId} in zone ${zoneId}`);
                      
                      // For memory games, try the flip action
                      const validActions = engineRef.current.getValidActionsForCurrentPlayer();
                      if (validActions.includes('flip')) {
                        const result = engineRef.current.executeAction(
                          getCurrentPlayer()?.id || '',
                          'flip',
                          [cardId]
                        );
                        if (result.success) {
                          updateGameState(engineRef.current.getGameState());
                          setMessage(result.message);
                        } else {
                          setMessage(result.message);
                        }
                      } else {
                        setMessage('Cannot flip cards right now.');
                      }
                    } catch (error) {
                      setMessage('Invalid action. Please try again.');
                    }
                  }
                }}
                onCardDrop={(cardId: string, targetSuit: string, position?: 'before' | 'after') => {
                  // Enhanced card drop handling for flexible placement
                  if (engineRef.current && isUserTurn()) {
                    try {
                      // Log placement details for debugging
                      console.log(`Placing ${cardId} in ${targetSuit} suit at ${position || 'default'} position`);
                      
                      const result = engineRef.current.executeAction(
                        getCurrentPlayer()?.id || '',
                        'play',
                        [cardId]
                      );
                      if (result.success) {
                        updateGameState(engineRef.current.getGameState());
                        setSelectedCards([]); // Clear selection after successful play
                        setMessage(result.message);
                      } else {
                        setMessage(result.message);
                      }
                    } catch (error) {
                      setMessage('Invalid move. Please try again.');
                    }
                  }
                }}
              >
                {/* Community Cards/Table Area - Enhanced with Dynamic Layout */}
                {/* Show separate Center Pile only if no structured tableZones present */}
                {(!((currentGame as any).tableZones && (currentGame as any).tableZones.length)) && currentGame.communityCards && currentGame.communityCards.length > 0 && (
                  <div className="flex flex-col items-center mb-12">
                    <div className="font-semibold text-gray-700 mb-4 text-lg">Center Pile</div>
                    <div className="bg-green-100 rounded-xl p-6 min-w-60 min-h-32 flex flex-col items-center justify-center">
                      <CardStack 
                        cards={currentGame.communityCards.slice(-15)}
                        stackType="messy"
                        maxVisible={12}
                      />
                      <div className="text-xs mt-2 text-gray-600">{currentGame.communityCards.length} card(s) in pile</div>
                    </div>
                  </div>
                )}

                {/* Card stack (discard pile) for draw-and-reveal games */}
                {currentGame.discardPile && currentGame.discardPile.length > 0 && !currentGame.communityCards?.length && (
                  <div className="flex flex-col items-center mb-8">
                    <div className="font-semibold text-gray-700 mb-2">Drawn Cards</div>
                    <CardStack 
                      cards={currentGame.discardPile}
                      stackType="messy"
                      maxVisible={10}
                    />
                  </div>
                )}

                {/* Action buttons for current player (only show for human's turn) */}
                <div className="flex flex-wrap gap-4 justify-center mb-6">
              {(() => {
                const hasEngine = !!engineRef.current;
                const userTurn = isUserTurn();
                // Show buttons if engine exists & it's your turn, even if state still briefly 'waiting'
                const show = hasEngine && userTurn;
                console.log('🎮 Action buttons condition check:', { hasEngine, userTurn, status: currentGame.gameStatus, show });
                return show;
              })() && (
                <>
                  {engineRef.current?.getValidActionsForCurrentPlayer().map(action => {
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
                    {botThinking 
                      ? `🤔 ${getCurrentPlayer()?.name} is thinking...`
                      : `⏳ Waiting for ${getCurrentPlayer()?.name}...`
                    }
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
            restartGame();
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
              <div className="bg-white rounded-lg shadow px-4 py-2">
                <span className="font-bold DeckDiscard">Deck:</span> {currentGame.deck.length} cards
              </div>
              <div className="bg-white rounded-lg shadow px-4 py-2">
                <span className="font-bold DeckDiscard">Discard:</span> {currentGame.discardPile.length} cards
              </div>
            </div>
            </GameTable>
          </div>
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
        {/* End of debug panel */}
        </div>
      </div>
      
      {/* Instant Win/Lose Overlay for Solo Games */}
      <AnimatePresence>
        {instantWin.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
            className="instant-win-overlay"
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              className={`instant-win-modal ${instantWin.isWin ? 'win' : 'continue'}`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="instant-win-emoji"
              >
                {instantWin.isWin ? '🎉' : '🔄'}
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="instant-win-title"
              >
                {instantWin.isWin ? 'YOU WIN!' : 'Keep Going!'}
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="instant-win-message"
              >
                {instantWin.message}
              </motion.div>
              
              {instantWin.card && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="instant-win-card"
                >
                  <Card
                    suit={instantWin.card.suit}
                    rank={instantWin.card.rank}
                    faceDown={false}
                    selected={false}
                  />
                </motion.div>
              )}
              
              {instantWin.isWin && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={() => {
                    // Reset game for another round
                    if (engineRef.current) {
                      engineRef.current = new GameEngine(currentGame.rules);
                      currentGame.players.forEach(p => {
                        engineRef.current?.addPlayer(p.name, p.type, p.avatar);
                      });
                      engineRef.current.startGame();
                      updateGameState(engineRef.current.getGameState());
                    }
                    setInstantWin({ show: false, isWin: false, message: '' });
                  }}
                  className="instant-win-play-again"
                >
                  Play Again 🎲
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamePage;
