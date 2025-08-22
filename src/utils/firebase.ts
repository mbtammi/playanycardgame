import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, setDoc, collection, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Use existing collection but with array document
const COLLECTION_NAME = 'newsletter_emails';
const ARRAY_DOC_ID = 'email_list';

// Email collection functions - works with existing collection
export const addEmailToFirestore = async (email: string) => {
  try {
    // Use the existing newsletter_emails collection but create an array document
    const emailsRef = doc(db, COLLECTION_NAME, ARRAY_DOC_ID);
    
    // Check if array document exists
    const docSnap = await getDoc(emailsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const existingEmails = data.emails || [];
      
      // Check if email already exists
      if (existingEmails.includes(email)) {
        console.log('Email already exists');
        return true; 
      }
      
      // Add new email to array
      await updateDoc(emailsRef, {
        emails: arrayUnion(email),
        lastUpdated: new Date(),
        totalCount: existingEmails.length + 1
      });
    } else {
      // Create new array document in existing collection
      console.log('Creating array document in existing collection...');
      
      // Get existing individual email documents
      const oldEmails: string[] = [];
      try {
        const oldSnapshot = await getDocs(collection(db, COLLECTION_NAME));
        oldSnapshot.forEach((doc) => {
          // Skip our new array document
          if (doc.id !== ARRAY_DOC_ID) {
            const data = doc.data();
            if (data.email && !oldEmails.includes(data.email)) {
              oldEmails.push(data.email);
            }
          }
        });
      } catch (error) {
        console.log('No existing emails found');
      }
      
      // Add current email if not already included
      if (!oldEmails.includes(email)) {
        oldEmails.push(email);
      }
      
      // Create array document in the same collection
      await setDoc(emailsRef, {
        emails: oldEmails,
        created: new Date(),
        lastUpdated: new Date(),
        totalCount: oldEmails.length,
        type: 'email_array'
      });
    }
    
    console.log('Email added successfully');
    return true;
  } catch (error) {
    console.error('Error adding email: ', error);
    return false;
  }
};

export const getEmailStats = async () => {
  try {
    // Try to get from array document first
    const emailsRef = doc(db, COLLECTION_NAME, ARRAY_DOC_ID);
    const docSnap = await getDoc(emailsRef);
    
    if (docSnap.exists()) {
      // Use new array structure
      const data = docSnap.data();
      const emails = data.emails || [];
      
      return {
        totalSubscribers: emails.length,
        latestSignups: emails.slice(-10).reverse().map((email: string, index: number) => ({
          id: `array_${index}`,
          timestamp: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
          source: 'firebase_array'
        }))
      };
    } else {
      // Fallback to individual documents
      console.log('Reading from individual documents...');
      try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        const emails: any[] = [];
        
        snapshot.forEach((doc) => {
          // Skip our array document if it exists
          if (doc.id !== ARRAY_DOC_ID) {
            const data = doc.data();
            emails.push({
              id: doc.id,
              email: data.email,
              timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
              source: data.source || 'firebase_individual'
            });
          }
        });
        
        return {
          totalSubscribers: emails.length,
          latestSignups: emails.slice(-10).reverse().map(email => ({
            id: email.id,
            timestamp: email.timestamp,
            source: email.source
          }))
        };
      } catch (error) {
        console.log('No data found');
        return {
          totalSubscribers: 0,
          latestSignups: []
        };
      }
    }
  } catch (error) {
    console.error('Error getting email stats: ', error);
    throw error;
  }
};
