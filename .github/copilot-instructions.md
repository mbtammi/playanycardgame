<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Play Any Card Game - Copilot Instructions

This is an AI-powered card game creator built with React, TypeScript, and Vite. Users can define rules for any card game, and AI interprets those rules to create playable versions with animations and smart bots.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: NO Tailwind CSS, only normal CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **AI Integration**: OpenAI GPT-4 API
- **Deployment**: Vercel/Netlify ready

## Project Structure
- `/src/components` - Reusable UI components
- `/src/pages` - Main page components (Landing, RuleBuilder, Game)
- `/src/hooks` - Custom React hooks
- `/src/store` - Zustand state management
- `/src/engine` - Card game logic and AI interpretation
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions

## Key Features
1. **Landing Page** - Animated intro with game options
2. **Rule Builder** - Semi-structured form for defining game rules
3. **AI Interpreter** - Converts rules to JSON game logic
4. **Game Engine** - Handles card logic, turns, and win conditions
5. **Bot Players** - AI-driven opponents
6. **Predefined Games** - Examples like Go Fish, Blackjack, Crazy 8s

## Coding Guidelines
- Use TypeScript strictly with proper type definitions
- Implement responsive design with Tailwind CSS
- Add smooth animations with Framer Motion
- Keep components modular and reusable
- Use Zustand for global state management
- Follow React best practices (hooks, functional components)
- Implement proper error handling for AI API calls
- Focus on accessibility and user experience
