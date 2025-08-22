# Play Any Card Game - Deployment Guide

## Environment Setup

### Development Mode
- Default page: Examples/Games (for easy testing)
- Shows development features like "Newsletter" button
- Access newsletter via the blue "Newsletter" button in Examples page

### Production Mode  
- Default page: Newsletter signup
- Clean, focused landing page for email collection
- No development features visible

## Environment Variables

### Development (`.env.local`)
```
VITE_APP_ENV=development
VITE_DEFAULT_PAGE=examples
```

### Production (`.env.production`)
```
VITE_APP_ENV=production  
VITE_DEFAULT_PAGE=newsletter
```

## Available Scripts

### Development
```bash
npm run dev              # Start development (shows game examples by default)
npm run dev:newsletter   # Start development with newsletter as default page
```

### Production Build
```bash
npm run build:prod       # Build for production (newsletter as default)
npm run preview:prod     # Build and preview production version locally
```

## Deployment to Vercel

### 1. Environment Variables in Vercel
Add these environment variables in your Vercel dashboard:
```
VITE_APP_ENV=production
VITE_DEFAULT_PAGE=newsletter
```

### 2. Build Settings
- Build Command: `npm run build:prod`
- Output Directory: `dist`

### 3. Deployment Result
- **Root URL (`playanycardgame.com`)**: Newsletter signup page
- **Examples available at**: `playanycardgame.com` → click "Try the Game Now"

## Backend Deployment (Optional)

If you want to collect emails in a database instead of just localStorage:

### Railway/Render
1. Deploy the `server/` folder
2. Set environment variables for database (if using one)
3. Update the frontend API URL in production

### Vercel Functions (Alternative)
1. Move server endpoints to `api/` folder as Vercel functions
2. No separate backend deployment needed

## Local Testing of Production Build

```bash
# Test production build locally
npm run preview:prod
```

This will build and serve the production version locally so you can test that the newsletter appears as the default page.

## Development Workflow

1. **Development**: `npm run dev` (shows examples page by default)
2. **Test Newsletter**: Click blue "Newsletter" button in examples page  
3. **Test Production Build**: `npm run preview:prod`
4. **Deploy**: Push to Vercel with production environment variables

## Quick Access During Development

- **Examples/Games**: Default page in development
- **Newsletter Preview**: Click "Newsletter" button in examples page header
- **Admin Dashboard**: Go to newsletter page → click tiny "admin" link at bottom
- **Skip Newsletter**: Newsletter page has "Try the Game Now" button
