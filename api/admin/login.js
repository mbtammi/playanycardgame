// Vercel API Route for Admin Login
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Check admin password
    const adminPassword = process.env.ADMIN_SECRET_KEY;
    if (!adminPassword) {
      console.error('❌ ADMIN_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (password !== adminPassword) {
      console.log('❌ Invalid admin login attempt');
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        admin: true, 
        timestamp: Date.now() 
      },
      process.env.JWT_SECRET || adminPassword,
      { expiresIn: '24h' }
    );

    console.log('✅ Admin login successful');
    
    res.status(200).json({ 
      message: 'Login successful',
      token 
    });
    
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Unknown error'
    });
  }
}
