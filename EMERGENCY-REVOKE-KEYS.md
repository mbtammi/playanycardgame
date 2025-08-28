# 🚨 EMERGENCY: API KEYS WERE COMPROMISED AND MUST BE REVOKED!

## **IMMEDIATE ACTIONS REQUIRED:**

### 1. **🔥 OpenAI API Keys - REVOKE NOW**
**Compromised Key Pattern:** `sk-proj-XXXXXXXXX...` (starts with sk-proj-EWCPKQMZvqRw)

**Action:**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Find and **DELETE** the compromised key
3. Create a new API key
4. Update `server/.env` with the new key

### 2. **💳 Stripe API Keys - REVOKE NOW**
**Compromised Keys:**
- Secret: `sk_test_51RClR4CeAmYR8FBse...` (test key starting with sk_test_51RClR4)
- Publishable: `pk_test_51RClR4CeAmYR8FBsv...` (test key starting with pk_test_51RClR4)

**Action:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. **ROLL/DELETE** both keys immediately
3. Generate new test keys
4. Update your application with new keys

### 3. **🤖 Replicate Token - REVOKE NOW**
**Compromised Token:** `r8_azN94...` (starts with r8_azN94n7L0f5gkMD1mM)

**Action:**
1. Go to [Replicate Account Settings](https://replicate.com/account/api-tokens)
2. **DELETE** the compromised token
3. Create a new API token
4. Update your application

### 4. **🔥 Firebase API Keys - REVOKE NOW**
**Compromised Keys:**
- `AIzaSyBbhd...` (key ending with ...4fYMM-ekU4XUPmo)
- `AIzaSyDSLC...` (key ending with ...7R3wKAHqmaLzBS15PdI)

**Projects:**
- `playanycardgame-f5d09` 
- `engine-f5597`

**Action:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. For EACH project, go to "APIs & Services" → "Credentials"
3. **DELETE** all compromised API keys
4. Create new restricted API keys
5. Download new service account JSON files

### 5. **🔐 Admin Password - CHANGE NOW**
**Compromised Password:** `Ssecnu...` (password starting with Ssecnubc)

**Action:**
1. Generate a strong new admin password
2. Update `server/.env` with `ADMIN_SECRET_KEY=your-new-password`

---

## **SECURITY CHECKLIST:**

- [ ] **OpenAI** - Revoked old key, created new key
- [ ] **Stripe** - Rolled both secret and publishable keys  
- [ ] **Replicate** - Deleted old token, created new token
- [ ] **Firebase Project 1** (`playanycardgame-f5d09`) - Deleted compromised keys
- [ ] **Firebase Project 2** (`engine-f5597`) - Deleted compromised keys
- [ ] **Admin Password** - Changed to strong new password
- [ ] **Server .env** - Updated with all new credentials
- [ ] **Removed all VITE_ credentials** from frontend
- [ ] **Tested server startup** with new credentials

---

## **NEVER DO THIS AGAIN:**

❌ **DON'T:** Put API keys in `VITE_` environment variables
❌ **DON'T:** Commit `.env` files to git
❌ **DON'T:** Share credentials in messages/streams
❌ **DON'T:** Use the same keys across multiple projects

✅ **DO:** Use server-side APIs for sensitive operations
✅ **DO:** Use environment variables only on the server
✅ **DO:** Use different keys for development and production
✅ **DO:** Regularly rotate your API keys

**Time to fix: IMMEDIATE - Every minute these keys are active is a security risk!**
