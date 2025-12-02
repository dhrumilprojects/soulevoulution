import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { cloudinaryConfig, getCloudinaryUploadUrl } from '../config/cloudinary';
import { db } from '../config/firebase';

export interface PrayerEvent {
  id?: string;
  userId: string;
  userName: string;
  departedName: string;
  date: string;
  time: string;
  memorialMessage?: string;
  photo?: string;
  memoryPhotos: string[];
  aadharCard?: string;
  deathCertificate?: string;
  status: 'pending' | 'approved' | 'rejected';
  meetingCode?: string; // 6-digit unique code for web viewers
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatePrayerEventData {
  userName: string;
  departedName: string;
  date: string;
  time: string;
  memorialMessage?: string;
  photo?: string;
  memoryPhotos: string[];
  aadharCard?: string;
  deathCertificate?: string;
}

export interface EventViewer {
  id?: string;
  eventId: string;
  userId?: string;
  userName?: string;
  phoneNumber?: string;
  viewedAt: Timestamp;
}

export interface Condolence {
  id?: string;
  eventId: string;
  userId?: string;
  userName?: string;
  phoneNumber?: string;
  message: string;
  createdAt: Timestamp;
}

class PrayerEventService {
  private collectionName = 'prayerEvents';

  private pruneUndefined<T extends Record<string, any>>(obj: T): T {
    const copy: Record<string, any> = { ...obj };
    Object.keys(copy).forEach((key) => {
      if (copy[key] === undefined) {
        delete copy[key];
      }
    });
    return copy as T;
  }

  // Generate a random 6-digit code
  private generateMeetingCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Check if a meeting code already exists
  private async isMeetingCodeUnique(code: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('meetingCode', '==', code)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty; // Returns true if code doesn't exist
    } catch (error) {
      console.error('Error checking meeting code uniqueness:', error);
      // If there's an error, assume it's unique to avoid blocking
      return true;
    }
  }

  // Generate a unique meeting code
  private async generateUniqueMeetingCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops
    
    while (attempts < maxAttempts) {
      const code = this.generateMeetingCode();
      const isUnique = await this.isMeetingCodeUnique(code);
      
      if (isUnique) {
        return code;
      }
      
      attempts++;
      console.log(`[PrayerEventService] Meeting code ${code} already exists, generating new one...`);
    }
    
    // Fallback: use timestamp-based code if all random attempts fail
    const timestampCode = Date.now().toString().slice(-6);
    console.log(`[PrayerEventService] Using timestamp-based code: ${timestampCode}`);
    return timestampCode;
  }

  async createPrayerEvent(userId: string, eventData: CreatePrayerEventData): Promise<{ success: boolean; eventId?: string; meetingCode?: string; error?: string }> {
    try {
      const now = Timestamp.now();
      
      // Generate unique meeting code
      const meetingCode = await this.generateUniqueMeetingCode();
      console.log(`[PrayerEventService] Generated meeting code: ${meetingCode}`);
      
      const prayerEvent: Omit<PrayerEvent, 'id'> = this.pruneUndefined({
        userId,
        userName: eventData.userName,
        departedName: eventData.departedName,
        date: eventData.date,
        time: eventData.time,
        memorialMessage: eventData.memorialMessage,
        photo: eventData.photo,
        memoryPhotos: eventData.memoryPhotos,
        aadharCard: eventData.aadharCard,
        deathCertificate: eventData.deathCertificate,
        status: 'pending',
        meetingCode,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(collection(db, this.collectionName), prayerEvent);
      
      return {
        success: true,
        eventId: docRef.id,
        meetingCode,
      };
    } catch (error) {
      console.error('Error creating prayer event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create prayer event',
      };
    }
  }

  async getUserPrayerEvents(userId: string): Promise<{ success: boolean; events?: PrayerEvent[]; error?: string }> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const events: PrayerEvent[] = [];
      
      querySnapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data(),
        } as PrayerEvent);
      });
      
      return {
        success: true,
        events,
      };
    } catch (error) {
      console.error('Error fetching user prayer events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prayer events',
      };
    }
  }

  async getPrayerEvent(eventId: string): Promise<{ success: boolean; event?: PrayerEvent; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, eventId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          success: true,
          event: {
            id: docSnap.id,
            ...docSnap.data(),
          } as PrayerEvent,
        };
      } else {
        return {
          success: false,
          error: 'Prayer event not found',
        };
      }
    } catch (error) {
      console.error('Error fetching prayer event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prayer event',
      };
    }
  }

  // Get prayer event by meeting code
  async getPrayerEventByMeetingCode(meetingCode: string): Promise<{ success: boolean; event?: PrayerEvent; error?: string }> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('meetingCode', '==', meetingCode)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          success: true,
          event: {
            id: doc.id,
            ...doc.data(),
          } as PrayerEvent,
        };
      } else {
        return {
          success: false,
          error: 'Prayer event not found with this meeting code',
        };
      }
    } catch (error) {
      console.error('Error fetching prayer event by meeting code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prayer event',
      };
    }
  }

  async updatePrayerEventStatus(eventId: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, eventId);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating prayer event status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update prayer event status',
      };
    }
  }

  async updatePrayerEventDetails(
    eventId: string,
    updates: Partial<Pick<PrayerEvent, 'departedName' | 'date' | 'time' | 'memorialMessage' | 'photo' | 'memoryPhotos' | 'aadharCard' | 'deathCertificate'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, eventId);
      const safeUpdates = this.pruneUndefined({
        ...updates,
        updatedAt: Timestamp.now(),
      });
      await updateDoc(docRef, safeUpdates as any);
      return { success: true };
    } catch (error) {
      console.error('Error updating prayer event details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update event details',
      };
    }
  }

  async deletePrayerEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, eventId);
      await deleteDoc(docRef);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting prayer event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete prayer event',
      };
    }
  }

  async updateStreamingSession(eventId: string, streamingSessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, eventId);
      await updateDoc(docRef, {
        streamingSessionId,
        updatedAt: Timestamp.now(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating streaming session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update streaming session',
      };
    }
  }

  async uploadImage(imageUri: string, path: string): Promise<{ success: boolean; downloadURL?: string; error?: string }> {
    try {
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
        return { success: false, error: 'Cloudinary is not configured' };
      }

      const uploadUrl = getCloudinaryUploadUrl();
      if (!uploadUrl) {
        return { success: false, error: 'Invalid Cloudinary upload URL' };
      }

      // Parse folder and public_id from the provided path
      // Example path: "prayer-events/{userId}/photo_123.jpg"
      let folder = '';
      let publicId = undefined as string | undefined;
      if (path && path.includes('/')) {
        const lastSlash = path.lastIndexOf('/')
        const folderPart = path.substring(0, lastSlash);
        const filePart = path.substring(lastSlash + 1);
        folder = folderPart;
        if (filePart) {
          const dotIndex = filePart.lastIndexOf('.')
          publicId = dotIndex > 0 ? filePart.substring(0, dotIndex) : filePart;
        }
      }

      // Build RN-friendly file object
      const filenameFromPath = path?.substring(path.lastIndexOf('/') + 1) || `upload_${Date.now()}.jpg`;
      const ext = (filenameFromPath.split('.').pop() || 'jpg').toLowerCase();
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        // @ts-ignore React Native FormData file
        uri: imageUri,
        name: filenameFromPath,
        type: mime,
      } as any);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      if (folder) formData.append('folder', folder);
      if (publicId) formData.append('public_id', publicId);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData as any,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Cloudinary upload failed with status ${res.status}`);
      }

      const json = await res.json();
      const secureUrl: string | undefined = json.secure_url;

      return {
        success: true,
        downloadURL: secureUrl || json.url,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      };
    }
  }

  // Track event viewer
  async trackEventViewer(eventId: string, userId?: string, userName?: string, phoneNumber?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all viewers for this event to check for duplicates
      const allViewersQuery = query(
        collection(db, 'eventViewers'),
        where('eventId', '==', eventId)
      );
      const existingViewers = await getDocs(allViewersQuery);
      
      // Check if this user/phone already viewed
      let alreadyViewed = false;
      existingViewers.forEach((doc) => {
        const data = doc.data();
        if ((userId && data.userId === userId) || 
            (phoneNumber && data.phoneNumber === phoneNumber)) {
          alreadyViewed = true;
        }
      });
      
      if (!alreadyViewed) {
        // Create new viewer record
        await addDoc(collection(db, 'eventViewers'), {
          eventId,
          userId: userId || null,
          userName: userName || null,
          phoneNumber: phoneNumber || null,
          viewedAt: Timestamp.now(),
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error tracking event viewer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track viewer',
      };
    }
  }

  // Get event viewers
  async getEventViewers(eventId: string): Promise<{ success: boolean; viewers?: EventViewer[]; error?: string }> {
    try {
      const q = query(
        collection(db, 'eventViewers'),
        where('eventId', '==', eventId),
        orderBy('viewedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const viewers: EventViewer[] = [];
      
      querySnapshot.forEach((doc) => {
        viewers.push({
          id: doc.id,
          ...doc.data(),
        } as EventViewer);
      });
      
      return {
        success: true,
        viewers,
      };
    } catch (error) {
      console.error('Error fetching event viewers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch viewers',
      };
    }
  }

  // Add condolence
  async addCondolence(eventId: string, message: string, userId?: string, userName?: string, phoneNumber?: string): Promise<{ success: boolean; condolenceId?: string; error?: string }> {
    try {
      const docRef = await addDoc(collection(db, 'condolences'), {
        eventId,
        userId: userId || null,
        userName: userName || null,
        phoneNumber: phoneNumber || null,
        message,
        createdAt: Timestamp.now(),
      });
      
      return {
        success: true,
        condolenceId: docRef.id,
      };
    } catch (error) {
      console.error('Error adding condolence:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add condolence',
      };
    }
  }

  // Get condolences for an event
  async getCondolences(eventId: string): Promise<{ success: boolean; condolences?: Condolence[]; error?: string }> {
    try {
      const q = query(
        collection(db, 'condolences'),
        where('eventId', '==', eventId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const condolences: Condolence[] = [];
      
      querySnapshot.forEach((doc) => {
        condolences.push({
          id: doc.id,
          ...doc.data(),
        } as Condolence);
      });
      
      return {
        success: true,
        condolences,
      };
    } catch (error) {
      console.error('Error fetching condolences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch condolences',
      };
    }
  }
}

const prayerEventService = new PrayerEventService();
export default prayerEventService;
