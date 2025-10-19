import admin from 'firebase-admin'

if (!admin.apps.length) {
    // Initialize with just the project ID for Firestore access
    // The applicationDefault() will use GOOGLE_APPLICATION_CREDENTIALS if set,
    // or fall back to gcloud credentials if available
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'intellibus2025rnc';
    
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: projectId
        });
        console.log(`✅ Firebase Admin initialized with project: ${projectId}`);
    } catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error.message);
        console.log('💡 Tip: Set GOOGLE_APPLICATION_CREDENTIALS to your service account key path');
        throw error;
    }
}

export const db = admin.firestore()
export const FieldValue = admin.firestore.FieldValue