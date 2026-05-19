# Firebase Setup Guide

## 1. Install Dependencies

Run the following command to install Firebase and required packages:

```bash
npx expo install firebase @react-native-async-storage/async-storage
```

## 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Phone" provider
   - Add your app's SHA-1 fingerprint (for Android)
4. Enable Firestore Database (optional):
   - Go to Firestore Database
   - Create database in test mode
5. Enable Storage (optional):
   - Go to Storage
   - Get started with default rules

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web (</>) icon
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 4. Update Configuration

Replace the placeholder values in `config/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 5. Android Setup (if building for Android)

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/` directory
3. Update `android/build.gradle`:
   ```gradle
   buildscript {
     dependencies {
       classpath 'com.google.gms:google-services:4.3.15'
     }
   }
   ```
4. Update `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

## 6. iOS Setup (if building for iOS)

1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to your iOS project in Xcode
3. Make sure it's added to the target

## 7. Test Authentication

1. Run your app: `npx expo start`
2. Try the phone authentication flow
3. Check Firebase Console > Authentication to see registered users

## 8. Security Rules (Important)

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 9. Environment Variables (Recommended)

For production, use environment variables:

1. Install `expo-constants`: `npx expo install expo-constants`
2. Create `.env` file:
   ```
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   ```
3. Update `config/firebase.ts` to use environment variables

## 10. Additional Features

### User Profile Management
- Store additional user data in Firestore
- Create user profiles after successful authentication
- Handle user preferences and settings

### Push Notifications
- Set up Firebase Cloud Messaging (FCM)
- Send notifications to authenticated users

### Analytics
- Enable Firebase Analytics
- Track user behavior and app usage

## Troubleshooting

### Common Issues:
1. **reCAPTCHA not working**: Make sure you're testing on a real device, not simulator
2. **Phone verification fails**: Check if phone number format is correct (+91XXXXXXXXXX)
3. **Build errors**: Ensure all dependencies are properly installed
4. **Authentication errors**: Check Firebase Console for error logs

### Debug Mode:
Enable debug logging by adding this to your app:
```typescript
import { getApps } from 'firebase/app';
console.log('Firebase apps:', getApps());
```
