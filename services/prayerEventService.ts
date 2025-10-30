import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

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

class PrayerEventService {
  private collectionName = 'prayerEvents';

  async createPrayerEvent(userId: string, eventData: CreatePrayerEventData): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const now = Timestamp.now();
      
      const prayerEvent: Omit<PrayerEvent, 'id'> = {
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
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.collectionName), prayerEvent);
      
      return {
        success: true,
        eventId: docRef.id,
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

  async uploadImage(imageUri: string, path: string): Promise<{ success: boolean; downloadURL?: string; error?: string }> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        downloadURL,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      };
    }
  }
}

const prayerEventService = new PrayerEventService();
export default prayerEventService;
