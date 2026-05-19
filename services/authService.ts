import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
  error?: string;
}

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: unknown;
  lastLoginAt?: unknown;
  isActive: boolean;
}

function mapFirebaseUser(firebaseUser: FirebaseUser): Omit<User, 'createdAt' | 'lastLoginAt' | 'isActive'> {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
  }
}

class AuthService {
  private readonly USERS_COLLECTION = 'users';

  async syncUserProfile(firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(db, this.USERS_COLLECTION, firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    const profile = mapFirebaseUser(firebaseUser);

    if (!userSnap.exists()) {
      const userData: User = {
        ...profile,
        isActive: true,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      await setDoc(userRef, userData);
      return userData;
    }

    await updateDoc(userRef, {
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      lastLoginAt: serverTimestamp(),
      isActive: true,
    });

    const existing = userSnap.data();
    return {
      id: firebaseUser.uid,
      email: profile.email ?? (existing.email as string | null) ?? null,
      displayName: profile.displayName ?? (existing.displayName as string | null) ?? null,
      photoURL: profile.photoURL ?? (existing.photoURL as string | null) ?? null,
      createdAt: existing.createdAt,
      lastLoginAt: existing.lastLoginAt,
      isActive: true,
    };
  }

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const user = await this.syncUserProfile(credential.user);
      return { success: true, message: 'Signed in successfully', user };
    } catch (error) {
      console.error('Error signing in with email:', error);
      return { success: false, error: getFirebaseAuthErrorMessage(error) };
    }
  }

  async signUpWithEmail(
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      if (displayName?.trim()) {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      }

      const user = await this.syncUserProfile(credential.user);
      return { success: true, message: 'Account created successfully', user };
    } catch (error) {
      console.error('Error signing up with email:', error);
      return { success: false, error: getFirebaseAuthErrorMessage(error) };
    }
  }

  async signInWithGoogleIdToken(idToken: string): Promise<AuthResult> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const user = await this.syncUserProfile(result.user);
      return { success: true, message: 'Signed in with Google', user };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return { success: false, error: getFirebaseAuthErrorMessage(error) };
    }
  }

  async signOut(): Promise<AuthResult> {
    try {
      await firebaseSignOut(auth);
      return { success: true, message: 'Signed out successfully' };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: getFirebaseAuthErrorMessage(error) };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }
    try {
      return await this.syncUserProfile(firebaseUser);
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return !!auth.currentUser;
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, this.USERS_COLLECTION, userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}

export default new AuthService();
