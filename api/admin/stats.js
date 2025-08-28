// Vercel API Route for Admin Stats
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import jwt from 'jsonwebtoken';

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
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    
    try {
      jwt.verify(token, process.env.JWT_SECRET || process.env.ADMIN_SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get newsletter stats from Firestore
    const emailsRef = db.collection('newsletter_emails');
    const snapshot = await emailsRef.orderBy('timestamp', 'desc').get();
    
    const emails = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        email: data.email,
        timestamp: data.timestamp,
        source: data.source || 'unknown'
      });
    });

    const stats = {
      totalSubscribers: emails.length,
      latestSignups: emails.slice(0, 10) // Last 10 signups
    };
    
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Unknown error'
    });
  }
}
