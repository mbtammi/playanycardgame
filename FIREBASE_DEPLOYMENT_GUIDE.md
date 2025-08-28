# Firebase + Vercel Deployment Setup Guide

## Summary of Changes Made

### 1. Updated Firebase Rules (Write-Only)
- Changed from `allow read, write: if true` to `allow create: if true`
- Now only allows creating new emails, not reading them
- Better security for public access

### 2. Created Vercel API Functions
- `/api/newsletter.js` - Handles email signups via Firebase Admin SDK
- `/api/admin/login.js` - Admin authentication with JWT
- `/api/admin/stats.js` - Protected admin stats from Firebase

### 3. Added Required Dependencies
- `firebase-admin` - Server-side Firebase operations
- `jsonwebtoken` - Admin session management
- `@types/jsonwebtoken` - TypeScript support

## Why Your Emails Weren't Saving

Your setup had these issues:
1. **Backend used local files** instead of Firebase (doesn't work on Vercel)
2. **Frontend expected `/api` routes** but you had Express server on port 3001
3. **No Firebase Admin SDK** integration in backend
4. **Vercel deploys are stateless** - local file storage doesn't persist

## Environment Variables You Need to Set

### In Vercel Dashboard:
1. Go to your project settings → Environment Variables
2. Add these variables:

```bash
# Firebase Admin SDK (from Firebase Console → Service Account)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

# Admin Authentication
ADMIN_SECRET_KEY=your-super-secure-password
JWT_SECRET=your-jwt-secret-for-sessions

# OpenAI (if using)
OPENAI_API_KEY=your-openai-api-key
```

### Getting Firebase Service Account:
1. Go to Firebase Console → Project Settings
2. Service Accounts tab
3. Click "Generate new private key"
4. Download the JSON file
5. Extract the values for your environment variables

## Deployment Steps

### 1. Update Firebase Rules
Copy the updated rules from `firebase-rules.txt` to your Firebase Console:
- Firebase Console → Firestore Database → Rules
- Paste the new rules and publish

### 2. Deploy to Vercel
```bash
# If not already deployed to Vercel
npx vercel

# If already deployed, redeploy
npx vercel --prod
```

### 3. Set Environment Variables
In Vercel dashboard, add all the environment variables listed above.

### 4. Test the Setup
1. Visit your deployed site
2. Try signing up with an email
3. Check Firebase Console → Firestore to see if emails appear
4. Test admin dashboard login

## Local Development

Your app should now work both locally and in production:

### Local (uses server/index.js):
```bash
npm run dev  # Frontend on localhost:5173
# Separate terminal:
cd server && npm start  # Backend on localhost:3001
```

### Production (uses Vercel API functions):
- Frontend served by Vercel
- API calls go to `/api/*` routes (our new Vercel functions)
- Firebase Admin SDK handles database operations

## Testing Your Fix

1. **Local Test:**
   ```bash
   npm run dev
   ```
   Try signing up - should save to Firebase

2. **Production Test:**
   Deploy to Vercel and try the signup form

3. **Admin Test:**
   Visit `/admin` and try logging in with your admin password

## Security Notes

- ✅ Firebase rules now write-only for public
- ✅ Admin routes protected with JWT
- ✅ Sensitive operations server-side only
- ✅ Environment variables secured in Vercel

Your emails should now save properly to Firebase! 🎉
