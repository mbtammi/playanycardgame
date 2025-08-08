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

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by the endless creativity of card game enthusiasts
- Powered by AI to make game creation accessible to everyone
