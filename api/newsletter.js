// Vercel API Route for Newsletter Signup
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        tokenUri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = getFirestore();

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
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists
    const emailsRef = db.collection('newsletter_emails');
    const existingEmail = await emailsRef.where('email', '==', email).limit(1).get();
    
    if (!existingEmail.empty) {
      return res.status(200).json({ 
        message: 'Already subscribed!',
        alreadyExists: true 
      });
    }

    // Add new email to Firestore
    const docData = {
      email,
      timestamp: new Date().toISOString(),
      source: 'website',
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    await emailsRef.add(docData);
    
    console.log(`✅ New newsletter signup: ${email}`);
    
    res.status(200).json({ 
      message: 'Successfully subscribed to newsletter!',
      success: true
    });
    
  } catch (error) {
    console.error('❌ Newsletter signup error:', error);
    
    // If Firebase fails, try to provide a meaningful error
    if (error.code === 'permission-denied') {
      res.status(500).json({ 
        error: 'Database permission error. Please try again later.',
        details: 'Firebase permissions issue'
      });
    } else if (error.code === 'unavailable') {
      res.status(500).json({ 
        error: 'Service temporarily unavailable. Please try again later.',
        details: 'Firebase connection issue'
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Unknown error'
      });
    }
  }
}
