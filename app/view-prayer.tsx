import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import prayerEventService, { PrayerEvent } from '../services/prayerEventService';

export default function PendingApprovalScreen() {
  const { eventId, eventData: eventDataParam } = useLocalSearchParams();

  const fallback = useMemo(() => ({
    name: 'abc',
    date: '1111-11-11',
    time: '11:11',
    message: '1111',
  }), []);

  const initialFromParams = useMemo(() => {
    try {
      return eventDataParam ? JSON.parse(eventDataParam as string) : fallback;
    } catch {
      return fallback;
    }
  }, [eventDataParam, fallback]);

  const [event, setEvent] = useState<PrayerEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(!!eventId);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [editName, setEditName] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editMessage, setEditMessage] = useState<string>('');
  const [editPhotoUri, setEditPhotoUri] = useState<string | null>(null);
  const [existingMemoryUrls, setExistingMemoryUrls] = useState<string[]>([]);
  const [newMemoryUris, setNewMemoryUris] = useState<string[]>([]);
  const [editAadharUri, setEditAadharUri] = useState<string | null>(null);
  const [editDeathCertUri, setEditDeathCertUri] = useState<string | null>(null);

  // Date and time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Helper functions to parse and format dates
  const parseDateString = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    // Try YYYY-MM-DD format first
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    // Try DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    return new Date(dateStr) || new Date();
  };

  const parseTimeString = (timeStr: string): Date => {
    if (!timeStr) return new Date();
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const date = new Date();
      date.setHours(parseInt(parts[0]) || 0);
      date.setMinutes(parseInt(parts[1]) || 0);
      return date;
    }
    return new Date();
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Check if event is live (within 2 hours after event start time)
  const isEventLive = (): boolean => {
    if (!event?.date || !event?.time) return false;
    
    try {
      // Parse event date and time
      const dateParts = event.date.split('-');
      const timeParts = event.time.split(':');
      
      if (dateParts.length !== 3 || timeParts.length < 2) return false;
      
      const eventDateTime = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1])
      );
      
      const now = new Date();
      const twoHoursLater = new Date(eventDateTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
      
      // Check if current time is >= event time and <= event time + 2 hours
      return now >= eventDateTime && now <= twoHoursLater;
    } catch (error) {
      console.error('Error checking event live status:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchEvent = async () => {
      if (!eventId) return;
      setLoading(true);
      setError(null);
      const result = await prayerEventService.getPrayerEvent(String(eventId));
      if (!mounted) return;
      if (result.success && result.event) {
        setEvent(result.event);
        console.log(result.event);
        setEditName(result.event.departedName || initialFromParams.name);
        const eventDate = result.event.date || initialFromParams.date;
        const eventTime = result.event.time || initialFromParams.time;
        setEditDate(eventDate);
        setEditTime(eventTime);
        setEditMessage(result.event.memorialMessage || initialFromParams.message);
        setEditPhotoUri(result.event.photo || null);
        setExistingMemoryUrls(Array.isArray(result.event.memoryPhotos) ? result.event.memoryPhotos : []);
        setNewMemoryUris([]);
        setEditAadharUri(result.event.aadharCard || null);
        setEditDeathCertUri(result.event.deathCertificate || null);
        // Initialize picker dates
        setSelectedDate(parseDateString(eventDate));
        setSelectedTime(parseTimeString(eventTime));
      } else {
        setError(result.error || 'Failed to load event');
      }
      setLoading(false);
    };
    fetchEvent();
    return () => { mounted = false; };
  }, [eventId]);
  const handleGoToDashboard = () => {
    router.replace('/(tabs)');
  };

  const handleBackToDashboard = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToDashboard}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
          {!!event && event.status === 'pending' && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                if (!isEditing && event) {
                  setEditName(event.departedName || '');
                  setEditDate(event.date || '');
                  setEditTime(event.time || '');
                  setEditMessage(event.memorialMessage || '');
                  setSelectedDate(parseDateString(event.date || ''));
                  setSelectedTime(parseTimeString(event.time || ''));
                } else {
                  // Reset picker visibility when canceling
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }
                setIsEditing(!isEditing);
              }}
            >
              <Ionicons name={isEditing ? 'close' : 'create-outline'} size={18} color="#1A1A1A" />
              <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main Content Card */}
        <View style={styles.mainCard}>
          {/* Status Indicator */}
          <View style={styles.statusSection}>
            <View style={styles.clockIcon}>
              <Ionicons 
                name={
                  event?.status === 'approved' ? 'checkmark-circle-outline' : 
                  event?.status === 'rejected' ? 'close-circle-outline' : 
                  'time-outline'
                } 
                size={48} 
                color={
                  event?.status === 'approved' ? '#4CAF50' : 
                  event?.status === 'rejected' ? '#F44336' : 
                  '#666666'
                } 
              />
            </View>
            
            <View style={[
              styles.statusTag,
              event?.status === 'approved' && styles.statusTagApproved,
              event?.status === 'rejected' && styles.statusTagRejected,
            ]}>
              <Text style={[
                styles.statusTagText,
                event?.status === 'approved' && styles.statusTagTextApproved,
                event?.status === 'rejected' && styles.statusTagTextRejected,
              ]}>
                {event?.status === 'pending' ? 'Pending Approval' : 
                 event?.status === 'approved' ? 'Approved' : 'Rejected'}
              </Text>
            </View>
                        
            <Text style={styles.statusDescription}>
              {event?.status === 'pending' 
                ? "Your prayer event is under review. We'll verify your documents and notify you once approved. This usually takes 24-48 hours."
                : event?.status === 'approved'
                ? 'Your prayer event has been approved and is now active. You can view all the details below.'
                : 'Your prayer event has been rejected. Please contact support if you have any questions.'}
            </Text>

            {event?.status === 'approved' && isEventLive() && (
              <TouchableOpacity
                style={styles.goLiveButton}
                onPress={() => {
                  // TODO: Implement go live functionality
                  Alert.alert('Go Live', 'Starting the prayer event live stream...');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="radio" size={20} color="#FFFFFF" />
                <Text style={styles.goLiveButtonText}>Go Live</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Event Details Section */}
          <View style={styles.eventDetailsSection}>
            <Text style={styles.eventDetailsTitle}>Event Details</Text>
            
            <View style={styles.eventDetailsList}>
              <View style={styles.eventDetailItem}>
                <Text style={styles.eventDetailLabel}>Name:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Name"
                  />
                ) : (
                  <Text style={styles.eventDetailValue}>{event?.departedName || initialFromParams?.name}</Text>
                )}
              </View>
              
              <View style={styles.eventDetailItem}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666666" />
                  <Text style={styles.eventDetailLabel}>Date:</Text>
                </View>
                {isEditing ? (
                  <View style={styles.dateTimeRow}>
                    <TouchableOpacity
                      style={[styles.input, styles.inputHalf, styles.pickerButton]}
                      onPress={() => {
                        setSelectedDate(parseDateString(editDate));
                        setShowDatePicker(true);
                      }}
                    >
                      <Text style={styles.pickerButtonText}>{editDate || 'Select Date'}</Text>
                      <Ionicons name="calendar-outline" size={18} color="#666666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.input, styles.inputHalf, styles.pickerButton]}
                      onPress={() => {
                        setSelectedTime(parseTimeString(editTime));
                        setShowTimePicker(true);
                      }}
                    >
                      <Text style={styles.pickerButtonText}>{editTime || 'Select Time'}</Text>
                      <Ionicons name="time-outline" size={18} color="#666666" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.eventDetailValue}>
                    {(event?.date || initialFromParams?.date)} at {(event?.time || initialFromParams?.time)}
                  </Text>
                )}
              </View>
              
              <View style={styles.eventDetailItem}>
                <Text style={styles.eventDetailLabel}>Message:</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={editMessage}
                    onChangeText={setEditMessage}
                    placeholder="Message"
                    multiline
                  />
                ) : (
                  <Text style={styles.eventDetailValue}>{event?.memorialMessage || initialFromParams?.message}</Text>
                )}
              </View>

              <View style={styles.mediaBlock}>
                <View style={styles.mediaHeaderRow}>
                  <Text style={styles.eventDetailsTitle}>Main Photo</Text>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={async () => {
                        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permission.granted) {
                          Alert.alert('Permission required', 'Please allow photo library access.');
                          return;
                        }
                        const resultPick = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: false, quality: 0.8 });
                        if (!resultPick.canceled && resultPick.assets && resultPick.assets.length > 0) {
                          setEditPhotoUri(resultPick.assets[0].uri);
                        }
                      }}
                    >
                      <Text style={styles.smallButtonText}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {!!(editPhotoUri || event?.photo) && (
                  <Image source={{ uri: (isEditing ? (editPhotoUri || '') : (event?.photo || '')) }} style={styles.image} resizeMode="cover" />
                )}
              </View>

              <View style={styles.mediaBlock}>
                <View style={styles.mediaHeaderRow}>
                  <Text style={styles.eventDetailsTitle}>Memories</Text>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={async () => {
                        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permission.granted) {
                          Alert.alert('Permission required', 'Please allow photo library access.');
                          return;
                        }
                        const resultPick = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 10, quality: 0.8 });
                        if (!resultPick.canceled && resultPick.assets && resultPick.assets.length > 0) {
                          setNewMemoryUris((prev) => [...prev, ...resultPick.assets.map(a => a.uri)]);
                        }
                      }}
                    >
                      <Text style={styles.smallButtonText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.memoryGrid}>
                  {existingMemoryUrls.map((rawUri, idx) => {
                    const uri = String(rawUri).trim();
                    const key = `existing-${idx}`;
                    return (
                      <View key={key} style={styles.memoryItem}>
                        <Image source={{ uri }} style={styles.memoryImage} resizeMode="cover" />
                        {isEditing && (
                          <TouchableOpacity style={styles.removeBadge} onPress={() => {
                            setExistingMemoryUrls((prev) => prev.filter((_, i) => i !== idx));
                          }}>
                            <Text style={styles.removeBadgeText}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                  {newMemoryUris.map((uri, idx) => {
                    const key = `new-${idx}`;
                    return (
                      <View key={key} style={styles.memoryItem}>
                        <Image source={{ uri }} style={styles.memoryImage} resizeMode="cover" />
                        {isEditing && (
                          <TouchableOpacity style={styles.removeBadge} onPress={() => {
                            setNewMemoryUris((prev) => prev.filter((_, i) => i !== idx));
                          }}>
                            <Text style={styles.removeBadgeText}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.mediaBlock}>
                <View style={styles.mediaHeaderRow}>
                  <Text style={styles.eventDetailsTitle}>Aadhar Card</Text>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={async () => {
                        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permission.granted) {
                          Alert.alert('Permission required', 'Please allow photo library access.');
                          return;
                        }
                        const resultPick = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: false, quality: 0.8 });
                        if (!resultPick.canceled && resultPick.assets && resultPick.assets.length > 0) {
                          setEditAadharUri(resultPick.assets[0].uri);
                        }
                      }}
                    >
                      <Text style={styles.smallButtonText}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {!!(editAadharUri || event?.aadharCard) && (
                  <Image source={{ uri: isEditing ? (editAadharUri || '') : (event?.aadharCard || '') }} style={styles.docImage} resizeMode="contain" />
                )}
              </View>

              <View style={styles.mediaBlock}>
                <View style={styles.mediaHeaderRow}>
                  <Text style={styles.eventDetailsTitle}>Death Certificate</Text>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={async () => {
                        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permission.granted) {
                          Alert.alert('Permission required', 'Please allow photo library access.');
                          return;
                        }
                        const resultPick = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: false, quality: 0.8 });
                        if (!resultPick.canceled && resultPick.assets && resultPick.assets.length > 0) {
                          setEditDeathCertUri(resultPick.assets[0].uri);
                        }
                      }}
                    >
                      <Text style={styles.smallButtonText}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {!!(editDeathCertUri || event?.deathCertificate) && (
                  <Image source={{ uri: isEditing ? (editDeathCertUri || '') : (event?.deathCertificate || '') }} style={styles.docImage} resizeMode="contain" />
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {isEditing ? (
            <TouchableOpacity
              style={[styles.dashboardButton, saving && { opacity: 0.7 }]}
              onPress={async () => {
                if (!eventId) return;
                try {
                  setSaving(true);
                  const updates: any = {
                    departedName: editName?.trim(),
                    date: editDate?.trim(),
                    time: editTime?.trim(),
                    memorialMessage: editMessage?.trim(),
                  };

                  // Upload changed images to Cloudinary
                  const userFolder = event?.userId ? `prayer-events/${event.userId}` : `prayer-events/unknown`;

                  if (editPhotoUri && !editPhotoUri.startsWith('http')) {
                    const res = await prayerEventService.uploadImage(
                      editPhotoUri,
                      `${userFolder}/photo_${Date.now()}.jpg`
                    );
                    if (!res.success) throw new Error(res.error || 'Failed to upload main photo');
                    updates.photo = res.downloadURL;
                  }

                  if (editAadharUri && !editAadharUri.startsWith('http')) {
                    const res = await prayerEventService.uploadImage(
                      editAadharUri,
                      `${userFolder}/aadhar_${Date.now()}.jpg`
                    );
                    if (!res.success) throw new Error(res.error || 'Failed to upload Aadhar');
                    updates.aadharCard = res.downloadURL;
                  }

                  if (editDeathCertUri && !editDeathCertUri.startsWith('http')) {
                    const res = await prayerEventService.uploadImage(
                      editDeathCertUri,
                      `${userFolder}/death_cert_${Date.now()}.jpg`
                    );
                    if (!res.success) throw new Error(res.error || 'Failed to upload Death Certificate');
                    updates.deathCertificate = res.downloadURL;
                  }

                  let combinedMemories = [...existingMemoryUrls];
                  for (const localUri of newMemoryUris) {
                    if (!localUri.startsWith('http')) {
                      const res = await prayerEventService.uploadImage(
                        localUri,
                        `${userFolder}/memory_${Date.now()}_${Math.random()}.jpg`
                      );
                      if (res.success && res.downloadURL) {
                        combinedMemories.push(res.downloadURL);
                      } else {
                        throw new Error(res.error || 'Failed to upload memory photo');
                      }
                    } else {
                      combinedMemories.push(localUri);
                    }
                  }
                  updates.memoryPhotos = combinedMemories;

                  const result = await prayerEventService.updatePrayerEventDetails(String(eventId), updates);
                  if (result.success) {
                    setEvent((prev) => prev ? {
                      ...prev,
                      departedName: updates.departedName || prev.departedName,
                      date: updates.date || prev.date,
                      time: updates.time || prev.time,
                      memorialMessage: updates.memorialMessage || prev.memorialMessage,
                      photo: updates.photo || prev.photo,
                      aadharCard: updates.aadharCard || prev.aadharCard,
                      deathCertificate: updates.deathCertificate || prev.deathCertificate,
                      memoryPhotos: updates.memoryPhotos || prev.memoryPhotos,
                    } : prev);
                    setNewMemoryUris([]);
                    setIsEditing(false);
                    Alert.alert('Saved', 'Prayer meeting updated successfully.');
                  } else {
                    Alert.alert('Error', result.error || 'Failed to save changes');
                  }
                } catch (e) {
                  Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save changes');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#F7C97B" />
              ) : (
                <Text style={styles.dashboardButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.dashboardButton} onPress={handleGoToDashboard}>
              <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
        {loading && (
          <View style={styles.loadingBanner}>
            <Text style={styles.loadingText}>Loading event details...</Text>
          </View>
        )}
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (date && event.type !== 'dismissed') {
              setSelectedDate(date);
              setEditDate(formatDate(date));
            }
            if (Platform.OS === 'ios' && event.type !== 'dismissed') {
              // On iOS, keep it open until user confirms
              setShowDatePicker(false);
            }
          }}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, time) => {
            if (Platform.OS === 'android') {
              setShowTimePicker(false);
            }
            if (time && event.type !== 'dismissed') {
              setSelectedTime(time);
              setEditTime(formatTime(time));
            }
            if (Platform.OS === 'ios' && event.type !== 'dismissed') {
              // On iOS, keep it open until user confirms
              setShowTimePicker(false);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F0', // Light beige background
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  editButtonText: {
    marginLeft: 6,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  clockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusTagApproved: {
    backgroundColor: '#E8F5E8',
  },
  statusTagRejected: {
    backgroundColor: '#FFE8E8',
  },
  statusTagText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusTagTextApproved: {
    color: '#4CAF50',
  },
  statusTagTextRejected: {
    color: '#F44336',
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 20,
  },
  goLiveButton: {
    backgroundColor: '#F7C97B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#F7C97B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E6B85C',
  },
  goLiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  eventDetailsSection: {
    marginBottom: 32,
  },
  eventDetailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  eventDetailsList: {
    gap: 16,
  },
  mediaBlock: {
    marginTop: 8,
    gap: 8,
  },
  mediaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  smallButtonText: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memoryItem: {
    width: '48%',
    marginBottom: 10,
    position: 'relative',
  },
  memoryImage: {
    width: '100%',
    height: 180,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
  },
  docImage: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  },
  loadingBanner: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
  },
  loadingText: {
    color: '#8D6E63',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorBanner: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFE8E8',
    borderRadius: 12,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    fontWeight: '600',
  },
  eventDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  eventDetailLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  eventDetailValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'right',
    backgroundColor: '#FFFFFF',
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 0.48,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7C97B',
  },
  dashboardButtonText: {
    color: '#F7C97B',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
