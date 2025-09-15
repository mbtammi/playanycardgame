# 🎮 Play Any Card Game

An AI-powered card game creator that lets users define rules for any card game and instantly creates a playable version with animations, smart bots, and intuitive gameplay.

## ✨ Features

- **🤖 AI-Powered Rule Interpretation**: Advanced AI converts your game rules into playable logic
- **⚡ Instant Gameplay**: From rules to playable game in seconds
- **🎨 Beautiful Animations**: Smooth card animations and delightful user experience
- **🧠 Smart AI Opponents**: Intelligent bots that understand your game rules
- **📱 Browser-Based**: Play anywhere, no downloads required
- **🔧 Visual Rule Builder**: Intuitive interface for defining game rules

## 🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd playanycardgame
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🎯 Current Status

This is an MVP implementation featuring:

✅ **Complete Features:**
- Landing page with animated introduction
- Example games showcase (Go Fish, Blackjack, Crazy 8s, War)
- Game rule definitions and parsing
- Responsive design with Tailwind CSS
- State management with Zustand
- TypeScript throughout

🚧 **In Development:**
- Interactive rule builder interface
- AI rule interpretation (OpenAI integration)
- Live card game engine with animations
- Multiplayer functionality
- Bot AI opponents

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Icons**: Lucide React
- **AI Integration**: OpenAI GPT-4 (planned)

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Main page components
├── store/         # Zustand state management
├── types/         # TypeScript type definitions
├── engine/        # Card game logic and AI
├── utils/         # Utility functions and data
└── hooks/         # Custom React hooks
```

## 🎮 Example Games

Try these pre-built games to see what's possible:

- **Go Fish** - Classic card matching game
- **Blackjack** - The casino favorite
- **Crazy 8s** - Fast-paced shedding game
- **War** - Simple battle game

## 🔮 Roadmap

### Phase 1: Core Features (Current)
- [x] Landing page and navigation
- [x] Example games showcase
- [x] Basic game engine structure
- [ ] Rule builder interface
- [ ] AI rule interpretation

### Phase 2: Game Engine
- [ ] Interactive card animations
- [ ] Drag and drop functionality
- [ ] Turn-based gameplay
- [ ] AI bot opponents

### Phase 3: Advanced Features
- [ ] Real-time multiplayer
- [ ] User accounts and game sharing
- [ ] Custom card graphics
- [ ] Game rating and discovery

## 🔐 Input Sanitization & Safety

Before any free‑text rule description is sent to AI we run a sanitation pass (`sanitizeUserIdea`):
- Strips `<script>` tags and HTML
- Removes inline event handlers (onClick= etc.)
- Collapses excessive whitespace & normalizes newlines
- Truncates beyond 2000 chars with a suffix marker
- Flags (but doesn’t block) suspicious patterns (`eval(`, `javascript:`, simple SQL keywords) for future telemetry

This keeps prompts clean while preserving user intent. We intentionally fail “open” (don’t block) to avoid user friction unless we later add a moderation layer.

## 🧩 Generic Prompt Fallback

Ultra‑vague prompts like “create a game” previously produced weak schemas. We now detect genericity (`isGenericPrompt`) and replace the raw text with a structured enrichment that guarantees:
- 3–4 player balanced shedding game (supports 2–6)
- Sequence pile mechanic (play same suit or ±1 rank)
- Actions: `play`, `draw`, `pass`
- Win condition: first to empty hand
- Starting card & `tableLayout.type = "sequence"`
- One special rank rule (wild or reverse)

Result: even minimal user input yields a fully playable, testable schema.

## 📊 Analytics Events

Lightweight analytics wrapper (`utils/analytics.ts`) provides provider‑agnostic `track()` plus semantic helpers. Implementations can swap to Firebase / GA4 later via `setAnalyticsBackend`.

Emitted events:
- `game_create_attempt { source, generic }`
- `game_create_success { id, name }`
- `game_create_failure { reason }`
- `game_start { id, playerCount, asymmetric }`
- `game_action { gameId, action, playerId, phase }`
- `game_win { gameId, playerId, condition }` (hook placeholder inside win detection)
- `game_forced_draw { gameId, playerId }` (deadlock mitigation)
- `game_deadlock_mitigated { gameId }`

## 🛡 Engine Robustness Heuristics

To support thousands of emergent AI‑defined games without hand coding:
1. **Rule Normalization** – Before state init we:
   - Inject `draw` action if stalling patterns detected (sequence rules, empty hand win conditions, etc.)
   - Auto create a default `turnStructure` with a single `playing` phase if missing
   - Force `cardsPerPlayer = 0` when `cardsPerPlayerPosition` (asymmetric dealing) is present
   - Infer `sequence` table layout + starting card if description implies sequential play and layout missing
   - Ensure `deckSize` default (52) exists
2. **Generalized Draw Logic** – Infers destination (hand vs discard) from flags & text (reveal, blackjack, etc.) with safe default to hand.
3. **Multi‑Deck Safety** – `ensureUniqueCardIds()` de‑duplicates IDs after aggregating decks.
4. **Deadlock Mitigation** – Tracks stagnation; forced draw after elapsed time or repeated no‑progress rotations.
5. **Adaptive Request vs Play Mode** – Heuristic avoids misclassifying sequence games as request/draw‑only games.
6. **Fallback Starting Card Injection** – Adds a center card when sequential wording found but no initial card supplied.

## 🂡 Asymmetric & Mixed Dealing

Engine supports any distribution: full symmetric, fully asymmetric, or partial (only first player special). Provide `cardsPerPlayerPosition` (array index = seat). If present, `cardsPerPlayer` is ignored (set to 0). Partial arrays simply apply to existing positions. Examples:
```json
// Only first player different
"setup": { "cardsPerPlayer": 0, "cardsPerPlayerPosition": [20, 7, 7], "deckSize": 52 }
// Four players highly asymmetric
"setup": { "cardsPerPlayer": 0, "cardsPerPlayerPosition": [3, 10, 5, 12], "deckSize": 52 }
```

## 🤖 AI Rule Interpretation Flow

1. User prompt sanitized.
2. Generic fallback enrichment applied if necessary.
3. Prompt augmented with strict schema instructions (asymmetric detection, table layout rules, starting card guidance).
4. Model returns JSON; we parse & apply default fillers.
5. Validation AI pass checks logical playability (starting positions, escape routes, progression).
6. If invalid: AI fix pass attempts minimal corrective changes (retain core intent, restore asymmetry & sequence layout if lost).
7. Normalization heuristics in engine finalize runtime schema.

## 🧪 Extending Win Logic

Custom win conditions rely on pattern parsing (color, rank, count, empty hand, suit sets). Extend by adding new branches in `evaluateCustomWinCondition` and optionally mapping to analytics via `analytics.winDetected` once triggered.

## 🗺 Future Enhancements (Planned)
- Server authoritative state for multiplayer
- Persistence & shareable game codes
- Advanced action template generation & caching
- Rule diff + versioning for iterative design
- Moderation / content filtering layer

## 📝 Changelog (Recent Internal Additions)
- Added sanitization & generic fallback modules
- Normalization heuristics & deadlock mitigation
- Generalized draw inference (destination + emergency deck regeneration)
- Analytics instrumentation for lifecycle & actions
- Ad placeholder component (layout stable)

---
For questions or ideas open an issue or start a discussion. Enjoy inventing card games! ✨

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by the endless creativity of card game enthusiasts
- Powered by AI to make game creation accessible to everyone
