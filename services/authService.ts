import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: any;
  error?: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  createdAt: any;
  lastLoginAt: any;
  isActive: boolean;
}

export interface OTPRecord {
  phoneNumber: string;
  otp: string;
  expiresAt: any;
  attempts: number;
  createdAt: any;
}

class AuthService {
  private readonly USERS_COLLECTION = 'users';
  private readonly OTP_COLLECTION = 'otp_records';
  private readonly STORAGE_KEY = 'current_user';

  // Generate 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<AuthResult> {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      
      // Store OTP in Firestore
      const otpDoc = doc(collection(db, this.OTP_COLLECTION));
      await setDoc(otpDoc, {
        phoneNumber,
        otp,
        expiresAt,
        attempts: 0,
        createdAt: serverTimestamp()
      });

      // In a real app, you would send SMS here using a service like Twilio
      console.log(`OTP for ${phoneNumber}: ${otp}`); // For development only
      
      return {
        success: true,
        message: 'OTP sent successfully',
        user: { id: otpDoc.id, phoneNumber, otp } // Include OTP for development
      };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.'
      };
    }
  }

  // Verify OTP
  async verifyOTP(phoneNumber: string, otp: string): Promise<AuthResult> {
    try {
      // Find OTP record
      const otpQuery = query(
        collection(db, this.OTP_COLLECTION),
        where('phoneNumber', '==', phoneNumber)
      );
      const otpSnapshot = await getDocs(otpQuery);
      
      if (otpSnapshot.empty) {
        return {
          success: false,
          error: 'OTP not found or expired'
        };
      }

      const otpDoc = otpSnapshot.docs[0];
      const otpData = otpDoc.data() as OTPRecord;

      // Check if OTP is expired
      if (new Date() > otpData.expiresAt.toDate()) {
        await deleteDoc(otpDoc.ref);
        return {
          success: false,
          error: 'OTP has expired. Please request a new one.'
        };
      }

      // Check attempts limit
      if (otpData.attempts >= 3) {
        await deleteDoc(otpDoc.ref);
        return {
          success: false,
          error: 'Too many failed attempts. Please request a new OTP.'
        };
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        // Increment attempts
        await updateDoc(otpDoc.ref, {
          attempts: otpData.attempts + 1
        });
        return {
          success: false,
          error: 'Invalid OTP code'
        };
      }

      // OTP is valid, create or update user
      const userResult = await this.createOrUpdateUser(phoneNumber);
      
      // Delete OTP record
      await deleteDoc(otpDoc.ref);

      if (userResult.success) {
        // Store user in AsyncStorage
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(userResult.user));
        
        return {
          success: true,
          message: 'OTP verified successfully',
          user: userResult.user
        };
      } else {
        return userResult;
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: 'Failed to verify OTP. Please try again.'
      };
    }
  }

  // Create or update user
  private async createOrUpdateUser(phoneNumber: string): Promise<AuthResult> {
    try {
      // Check if user exists
      const userQuery = query(
        collection(db, this.USERS_COLLECTION),
        where('phoneNumber', '==', phoneNumber)
      );
      const userSnapshot = await getDocs(userQuery);

      let userData: User;

      if (userSnapshot.empty) {
        // Create new user
        const userDoc = doc(collection(db, this.USERS_COLLECTION));
        userData = {
          id: userDoc.id,
          phoneNumber,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isActive: true
        };
        await setDoc(userDoc, userData);
      } else {
        // Update existing user
        const userDoc = userSnapshot.docs[0];
        userData = {
          id: userDoc.id,
          phoneNumber,
          createdAt: userDoc.data().createdAt,
          lastLoginAt: serverTimestamp(),
          isActive: true
        };
        await updateDoc(userDoc.ref, {
          lastLoginAt: serverTimestamp(),
          isActive: true
        });
      }

      return {
        success: true,
        user: userData
      };
    } catch (error: any) {
      console.error('Error creating/updating user:', error);
      return {
        success: false,
        error: 'Failed to create user account'
      };
    }
  }

  // Sign out user
  async signOut(): Promise<AuthResult> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      return {
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error: any) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: 'Failed to sign out'
      };
    }
  }

  // Get current user from AsyncStorage
  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem(this.STORAGE_KEY);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  // Get user by ID from Firestore
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
