// Vercel API Route for Newsletter Signup
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  try {
    // Check if required environment variables are present
    const requiredEnvVars = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log('Initializing Firebase with environment variables...');
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('Private Key ID:', process.env.FIREBASE_PRIVATE_KEY_ID);
    console.log('Client ID:', process.env.FIREBASE_CLIENT_ID);

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        tokenUri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      }),
    });
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error; // Re-throw so the function fails early if Firebase can't initialize
  }
}

let db;
try {
  db = getFirestore();
} catch (error) {
  console.error('Failed to get Firestore instance:', error);
  db = null;
}

export default async function handler(req, res) {
  // Check if Firebase is properly initialized
  if (!db) {
    console.error('Firebase is not properly initialized');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Firebase is not properly initialized'
    });
  }

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

    // Reference to the email_list document
    const emailListRef = db.collection('newsletter_emails').doc('email_list');
    
    // Get the current email_list document
    const doc = await emailListRef.get();
    
    if (!doc.exists) {
      // Create the document if it doesn't exist
      await emailListRef.set({
        emails: [email],
        created: new Date(),
        lastUpdated: new Date(),
        totalCount: 1,
        type: 'email_array'
      });
    } else {
      const data = doc.data();
      const currentEmails = data.emails || [];
      
      // Check if email already exists
      if (currentEmails.includes(email)) {
        return res.status(200).json({ 
          message: 'Already subscribed!',
          alreadyExists: true 
        });
      }
      
      // Add the new email to the array
      const updatedEmails = [...currentEmails, email];
      
      await emailListRef.update({
        emails: updatedEmails,
        lastUpdated: new Date(),
        totalCount: updatedEmails.length
      });
    }
    
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
