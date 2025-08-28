# 🔥 Firebase API Key Rotation Guide

## **NO, you don't need to create a new Firebase app!**

You can rotate API keys within your existing Firebase projects. Here's how:

---

## **🔄 Method 1: Rotate Web API Keys (Easy)**

### **Step 1: Go to Google Cloud Console**
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `playanycardgame-f5d09`
3. Go to **"APIs & Services"** → **"Credentials"**

### **Step 2: Find Your Current API Key**
1. Look for **"API Keys"** section
2. Find the key that starts with `AIzaSyBbhd...`
3. Click on it to view details

### **Step 3: Restrict the Key (Security)**
1. Click **"Edit"** on the API key
2. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"**
   - Add: `localhost:*` (for development)
   - Add: `yourdomain.com/*` (for production)
3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Choose only the APIs you need:
     - ✅ Cloud Firestore API
     - ✅ Firebase Authentication API
     - ✅ Firebase Analytics API (if using)
4. Click **"Save"**

### **Step 4: Create a New Restricted Key (Optional)**
1. Click **"Create Credentials"** → **"API Key"**
2. Immediately click **"Restrict Key"**
3. Set the same restrictions as above
4. **Copy the new key** and save it securely
5. **Delete the old unrestricted key**

---

## **🛡️ Method 2: Service Account for Backend (Recommended)**

### **Step 1: Create Service Account**
1. In Google Cloud Console → **"IAM & Admin"** → **"Service Accounts"**
2. Click **"Create Service Account"**
3. Name: `playanycardgame-backend`
4. Description: `Secure backend API access`
5. Click **"Create and Continue"**

### **Step 2: Set Permissions**
1. Add these roles:
   - **Firebase Admin SDK Administrator Service Agent**
   - **Cloud Datastore User** (for Firestore)
2. Click **"Continue"** then **"Done"**

### **Step 3: Generate Private Key**
1. Click on the new service account
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose **"JSON"** format
5. **Download the JSON file** (keep it secure!)

---

## **🔧 Method 3: Firebase Console Approach**

### **Step 1: Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `playanycardgame-f5d09`
3. Click gear icon → **"Project Settings"**

### **Step 2: Add New Web App (if needed)**
1. Scroll to **"Your apps"** section
2. Click **"Add app"** → Web icon
3. Name: `PlayAnyCardGame-Secure`
4. **Enable Firebase Hosting** (optional)
5. Click **"Register app"**

### **Step 3: Get New Config**
1. You'll see new configuration:
```javascript
const firebaseConfig = {
  apiKey: "NEW-API-KEY-HERE",
  authDomain: "playanycardgame-f5d09.firebaseapp.com",
  projectId: "playanycardgame-f5d09",
  storageBucket: "playanycardgame-f5d09.firebasestorage.app",
  messagingSenderId: "564106668243",
  appId: "NEW-APP-ID-HERE"
};
```

### **Step 4: Delete Old App**
1. In the same **"Your apps"** section
2. Click on the old app with compromised keys
3. Click **"Remove this app"**
4. Confirm deletion

---

## **⚡ Quick Action Plan**

### **For Your Current Situation:**

1. **Immediate (Google Cloud Console):**
   ```
   1. Go to console.cloud.google.com
   2. Select "playanycardgame-f5d09"
   3. APIs & Services → Credentials
   4. Delete the compromised API key (AIzaSyBbhd...)
   5. Create new restricted API key
   ```

2. **Backend Setup (Firebase Console):**
   ```
   1. Go to console.firebase.google.com
   2. Project Settings → Service Accounts
   3. Click "Generate new private key"
   4. Download JSON file
   5. Use for server/.env configuration
   ```

3. **Update Your Code:**
   ```bash
   # Server-side (secure)
   FIREBASE_PROJECT_ID=playanycardgame-f5d09
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@playanycardgame-f5d09.iam.gserviceaccount.com"
   
   # Frontend (if needed - but with our architecture, you don't need it!)
   # VITE_FIREBASE_API_KEY=your-new-restricted-api-key
   ```

---

## **🎯 Best Practice: Use Our Secure Architecture**

With the architecture we built, **you don't need Firebase config in the frontend at all!**

```
Frontend → Secure Backend API → Firebase Admin SDK → Firebase
```

**Benefits:**
- ✅ No API keys exposed to users
- ✅ Complete control over database access
- ✅ User emails never exposed to frontend
- ✅ Admin functions properly secured

---

## **⚠️ Important Notes:**

1. **Same Project, New Keys**: You're keeping the same Firebase project and data
2. **No Data Loss**: All your existing Firestore data stays intact
3. **Better Security**: New keys will be properly restricted
4. **Progressive Update**: You can rotate keys one at a time

**Time to complete: 10-15 minutes max!**
