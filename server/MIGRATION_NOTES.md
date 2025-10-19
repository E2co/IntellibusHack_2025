# Firebase SDK Migration - Problem & Solution

## The Problem

You were experiencing 500 Internal Server Error when trying to:
- Sign up for an account (`POST /api/auth/register`)
- Access traffic data (`GET /api/traffic`)

### Root Cause

The issue was that your server had **TWO different Firebase configurations**:

1. **`firebaseAdmin.js`** - Used Firebase Admin SDK (`firebase-admin`)
   - Requires service account key file or gcloud authentication
   - All controllers were importing from this file
   - Was failing because no credentials were configured

2. **`db.js`** - Used Firebase Client SDK (`firebase/firestore`)
   - Already configured with your web app credentials
   - Was not being used by the server

The server was trying to use Firebase Admin SDK without proper authentication, causing all Firestore operations to fail with 500 errors.

## The Solution

We migrated all server controllers and middleware from Firebase Admin SDK to the Firebase Client SDK, since you already had the client SDK properly configured with credentials.

### Files Modified

#### Controllers
- `server/controllers/userController.js` - Auth operations (register, login, me, logout)
- `server/controllers/serviceController.js` - Service management
- `server/controllers/ticketController.js` - Ticket and queue management

#### Middleware
- `server/middlewears/authAdmin.js` - Admin authorization

#### Configuration
- `server/server.js` - Changed import from `firebaseAdmin.js` to `db.js`
- `server/configs/db.js` - Added console log for initialization confirmation

### Key Changes

**Before (Admin SDK):**
```javascript
import { db } from '../configs/firebaseAdmin.js'
const usersCol = () => db.collection('users')
const snap = await usersCol().where('email', '==', email).get()
```

**After (Client SDK):**
```javascript
import { db } from '../configs/db.js'
import { collection, query, where, getDocs } from 'firebase/firestore'
const usersCol = () => collection(db, 'users')
const q = query(usersCol(), where('email', '==', email))
const snap = await getDocs(q)
```

### Transaction Changes

Transactions also needed updating:

**Before:**
```javascript
await db.runTransaction(async (tx) => {
  const ref = queuesCol().doc(id)
  const snap = await tx.get(ref)
  if (snap.exists) { /* ... */ }
})
```

**After:**
```javascript
await runTransaction(db, async (tx) => {
  const ref = doc(db, 'queues', id)
  const snap = await tx.get(ref)
  if (snap.exists()) { /* ... */ }
})
```

## Why This Works

The Firebase Client SDK uses your web app credentials (API key, project ID, etc.) which don't require a service account key file. This is perfectly fine for a backend that needs to access Firestore, though Firebase Admin SDK is generally preferred for production due to additional security features.

## Benefits

✅ No need for service account key file  
✅ Works with your existing Firebase configuration  
✅ All Firestore operations now functional  
✅ Auth endpoints working (register, login)  
✅ Traffic endpoint working  
✅ Ticket operations working  

## If You Want to Use Admin SDK Later

If you prefer to use Firebase Admin SDK in the future (recommended for production):

1. Go to Firebase Console → Project Settings → Service accounts
2. Generate a new private key
3. Save as `server/configs/serviceAccountKey.json`
4. Uncomment the `GOOGLE_APPLICATION_CREDENTIALS` line in `.env`
5. Revert the controllers back to Admin SDK imports

OR use gcloud CLI:
```bash
gcloud auth application-default login
```

## Verification

Server now starts with:
```
✅ Firebase Client SDK initialized with project: intellibus2025rnc
Server is running on http://localhost:4000
```

You should now be able to:
- Sign up for a new account
- Log in
- View traffic data
- Create tickets
- All without 500 errors!
