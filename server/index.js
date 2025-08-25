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
`You are an expert card game designer. Output only valid JSON for a GameRules object, matching this exact TypeScript interface:

interface GameRules {
  id: string;
  name: string;
  description: string;
  players: { min: number; max: number; recommended: number; };
  setup: { cardsPerPlayer: number; deckSize: number; specialCards?: string[]; };
  objective: { type: string; description: string; target?: number; };
  turnStructure: { order: string; phases: { name: string; required: boolean; actions: string[]; }[]; timeLimit?: number; };
  actions: string[];
  winConditions: { type: string; description: string; target?: number | string[]; }[];
  specialRules?: string[];
  aiPrompt?: string;
}

Here is an example:
{
  "id": "go-fish",
  "name": "Go Fish",
  "description": "Classic card matching game where players collect books of four matching cards.",
  "players": { "min": 2, "max": 6, "recommended": 4 },
  "setup": { "cardsPerPlayer": 7, "deckSize": 52 },
  "objective": { "type": "collect_sets", "description": "Collect the most books (sets of 4 matching ranks)" },
  "turnStructure": {
    "order": "clockwise",
    "phases": [
      { "name": "ask", "required": true, "actions": ["call"] },
      { "name": "draw", "required": false, "actions": ["draw"] }
    ]
  },
  "actions": ["call", "draw", "reveal"],
  "winConditions": [
    { "type": "highest_score", "description": "Player with the most books wins" }
  ]
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
