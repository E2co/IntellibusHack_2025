# Firebase Admin SDK Setup

The server needs Firebase Admin SDK credentials to access Firestore. You have two options:

## Option 1: Service Account Key (Recommended for Development)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `intellibus2025rnc`
3. Click the ⚙️ gear icon → **Project settings**
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Save the downloaded JSON file as: `server/configs/serviceAccountKey.json`
7. Uncomment and update the `.env` line:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./configs/serviceAccountKey.json
   ```

## Option 2: Google Cloud CLI (Alternative)

If you have the Google Cloud SDK installed:

```bash
gcloud auth application-default login
```

This will authenticate using your Google account and the app will automatically use those credentials.

## Security Note

⚠️ **NEVER commit `serviceAccountKey.json` to git!**
- It's already in `.gitignore`
- This file gives full access to your Firebase project

## Verify Setup

Once configured, restart the server and you should see:
```
✅ Firebase Admin initialized with project: intellibus2025rnc
```
