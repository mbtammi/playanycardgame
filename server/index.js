require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Newsletter signup endpoint
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Create emails directory if it doesn't exist
    const emailsDir = path.join(__dirname, 'data');
    const emailsFile = path.join(emailsDir, 'emails.json');
    
    try {
      await fs.mkdir(emailsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }
    
    // Read existing emails
    let emails = [];
    try {
      const data = await fs.readFile(emailsFile, 'utf8');
      emails = JSON.parse(data);
    } catch (err) {
      // File might not exist yet
      emails = [];
    }
    
    // Check if email already exists
    const existingEmail = emails.find(entry => entry.email === email);
    if (existingEmail) {
      return res.status(200).json({ 
        message: 'Already subscribed!',
        alreadyExists: true 
      });
    }
    
    // Add new email with timestamp
    const newEntry = {
      email,
      timestamp: new Date().toISOString(),
      source: 'website'
    };
    
    emails.push(newEntry);
    
    // Save updated emails
    await fs.writeFile(emailsFile, JSON.stringify(emails, null, 2));
    
    console.log(`New newsletter signup: ${email}`);
    
    res.status(200).json({ 
      message: 'Successfully subscribed to newsletter!',
      success: true
    });
    
  } catch (error) {
    console.error('Newsletter signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get newsletter stats (for admin)
app.get('/api/newsletter/stats', async (req, res) => {
  try {
    const emailsFile = path.join(__dirname, 'data', 'emails.json');
    
    try {
      const data = await fs.readFile(emailsFile, 'utf8');
      const emails = JSON.parse(data);
      
      res.json({
        totalSubscribers: emails.length,
        latestSignups: emails.slice(-5).reverse() // Last 5 signups
      });
    } catch (err) {
      res.json({
        totalSubscribers: 0,
        latestSignups: []
      });
    }
  } catch (error) {
    console.error('Newsletter stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Feature request endpoint
app.post('/api/feature-request', async (req, res) => {
  try {
    const { email, feature } = req.body;
    
    if (!email || !feature) {
      return res.status(400).json({ error: 'Email and feature description are required' });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Create feature requests directory if it doesn't exist
    const requestsDir = path.join(__dirname, 'data');
    const requestsFile = path.join(requestsDir, 'feature-requests.json');
    
    try {
      await fs.access(requestsDir);
    } catch (err) {
      await fs.mkdir(requestsDir, { recursive: true });
    }
    
    // Read existing requests
    let requests = [];
    try {
      const data = await fs.readFile(requestsFile, 'utf8');
      requests = JSON.parse(data);
    } catch (err) {
      // File doesn't exist yet, start with empty array
      requests = [];
    }
    
    // Add new request with timestamp
    const newRequest = {
      email,
      feature,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      status: 'submitted'
    };
    
    requests.push(newRequest);
    
    // Save updated requests
    await fs.writeFile(requestsFile, JSON.stringify(requests, null, 2));
    
    console.log(`New feature request from ${email}: ${feature.substring(0, 100)}...`);
    
    res.status(200).json({ 
      message: 'Feature request submitted successfully!',
      success: true
    });
    
  } catch (error) {
    console.error('Feature request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feature request stats (for admin)
app.get('/api/feature-requests/stats', async (req, res) => {
  try {
    const requestsFile = path.join(__dirname, 'data', 'feature-requests.json');
    
    try {
      const data = await fs.readFile(requestsFile, 'utf8');
      const requests = JSON.parse(data);
      
      const stats = {
        total: requests.length,
        byStatus: requests.reduce((acc, req) => {
          acc[req.status] = (acc[req.status] || 0) + 1;
          return acc;
        }, {}),
        recent: requests.slice(-5).reverse() // Last 5 requests
      };
      
      res.json(stats);
    } catch (err) {
      res.json({ total: 0, byStatus: {}, recent: [] });
    }
  } catch (error) {
    console.error('Feature requests stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/openai', async (req, res) => {
  const { idea } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key not set in server environment.');
    return res.status(500).json({ error: 'OpenAI API key not set in server environment.' });
  }
  if (!idea) {
    return res.status(400).json({ error: 'Missing game idea.' });
  }
  try {
    console.log('Calling OpenAI with idea:', idea);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
`You are an expert card game designer who creates FUN, ENGAGING, and COMPLETE games from any description. Your goal is to make every game enjoyable and fully playable.

CRITICAL RULES:
1. Make games FUN and engaging - add interesting mechanics, strategy, and excitement
2. Create COMPLETE rulesets - fill in missing details to make the game work perfectly
3. Support unlimited table flexibility - cards can be placed anywhere, face up/down, multiple decks
4. Generate rich descriptions and clear win conditions
5. Add strategic depth and player interaction when possible

OUTPUT FORMAT: Valid JSON for GameRules object with this interface:

interface GameRules {
  id: string;
  name: string; 
  description: string; // Make this RICH and ENGAGING
  players: { min: number; max: number; recommended: number; };
  setup: { 
    cardsPerPlayer: number; 
    deckSize: number; 
    specialCards?: string[];
    keepDrawnCard?: boolean; // true = add to hand, false = reveal and discard
    multipleDecks?: boolean; // true if game uses multiple decks
    tableLayout?: {
      type: 'grid' | 'centered' | 'sequence' | 'scattered' | 'custom';
      allowFlexiblePlacement: boolean;
      zones?: Array<{
        id: string;
        type: 'pile' | 'sequence' | 'grid' | 'deck' | 'discard';
        initialCards?: number;
        faceDown?: boolean;
        position?: { x: number; y: number };
      }>;
    };
  };
  objective: { type: string; description: string; target?: number; };
  turnStructure: { 
    order: string; 
    phases: { name: string; required: boolean; actions: string[]; }[];
    timeLimit?: number; 
  };
  actions: string[]; // Be creative: "draw", "play", "swap", "peek", "steal", "challenge", etc.
  winConditions: { type: string; description: string; target?: number | string[]; }[];
  specialRules?: string[]; // Add fun twists and strategic elements
  aiPrompt?: string;
}

EXAMPLES OF GREAT GAMES:

Simple Draw Game:
{
  "id": "lucky-draw",
  "name": "Lucky Draw Challenge",
  "description": "A thrilling solo game of chance! Draw cards from the deck seeking your fortune. Black cards bring victory, red cards bring suspense. Will luck be on your side?",
  "players": { "min": 1, "max": 1, "recommended": 1 },
  "setup": { 
    "cardsPerPlayer": 0, 
    "deckSize": 52,
    "keepDrawnCard": false,
    "tableLayout": {
      "type": "centered",
      "allowFlexiblePlacement": true,
      "zones": [
        { "id": "deck", "type": "deck", "initialCards": 52, "faceDown": true },
        { "id": "reveal", "type": "pile", "initialCards": 0, "faceDown": false }
      ]
    }
  },
  "objective": { "type": "custom", "description": "Draw a black card to achieve victory!" },
  "turnStructure": {
    "order": "clockwise",
    "phases": [{ "name": "draw", "required": true, "actions": ["draw"] }]
  },
  "actions": ["draw"],
  "winConditions": [
    { "type": "custom", "description": "Draw any black card (clubs or spades) to win instantly!" }
  ],
  "specialRules": ["Each drawn card is revealed", "Red cards continue the game", "Game ends on first black card"]
}

Complex Strategy Game:
{
  "id": "memory-palace",
  "name": "Memory Palace",
  "description": "A strategic memory game where players build sequences while trying to remember hidden cards. Flip, match, and outsmart your opponents in this battle of wits!",
  "players": { "min": 2, "max": 4, "recommended": 3 },
  "setup": { 
    "cardsPerPlayer": 5, 
    "deckSize": 52,
    "keepDrawnCard": true,
    "tableLayout": {
      "type": "grid",
      "allowFlexiblePlacement": true,
      "zones": [
        { "id": "memory-grid", "type": "grid", "initialCards": 16, "faceDown": true },
        { "id": "sequence-area", "type": "sequence", "initialCards": 0, "faceDown": false }
      ]
    }
  },
  "objective": { "type": "highest_score", "description": "Score points by creating sequences and matching pairs" },
  "turnStructure": {
    "order": "clockwise",
    "phases": [
      { "name": "flip", "required": true, "actions": ["flip", "peek"] },
      { "name": "play", "required": false, "actions": ["play", "sequence"] },
      { "name": "draw", "required": false, "actions": ["draw"] }
    ]
  },
  "actions": ["flip", "peek", "play", "sequence", "draw", "match"],
  "winConditions": [
    { "type": "highest_score", "description": "First player to 50 points wins", "target": 50 }
  ],
  "specialRules": [
    "Flipped cards remain visible for 3 seconds", 
    "Sequences must be consecutive ranks", 
    "Matching pairs score double points",
    "Peeking costs 1 point but shows card permanently"
  ]
}

ENHANCEMENT GUIDELINES:
- If user describes simple game, add strategic depth
- If user mentions basic rules, expand with engaging mechanics  
- Always ensure games are balanced and fun
- Add player interaction in multiplayer games
- Create memorable moments and decision points
- Make win conditions clear and achievable
- Support table flexibility for any card layout

CRITICAL: When game mentions cards "on the table", "in a grid", "face-down layout", etc., ALWAYS include tableLayout with zones!

Example for grid games:
{
  "setup": {
    "cardsPerPlayer": 5,
    "deckSize": 52,
    "tableLayout": {
      "type": "grid",
      "allowFlexiblePlacement": true,
      "zones": [
        {
          "id": "memory-grid",
          "type": "grid",
          "initialCards": 16,
          "faceDown": true,
          "position": { "x": 200, "y": 100 }
        },
        {
          "id": "sequence-area", 
          "type": "sequence",
          "initialCards": 0,
          "faceDown": false,
          "position": { "x": 200, "y": 400 }
        }
      ]
    }
  }
}

Output ONLY a single JSON object, no comments or extra text.`
          },
          { role: 'user', content: `Convert this card game idea into a JSON GameRules object: ${idea}` }
        ],
        temperature: 0.3,
        max_tokens: 1200
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(500).json({ error: 'OpenAI API error', status: response.status, details: errorText });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to contact OpenAI', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`OpenAI proxy server running on port ${PORT}`);
});
