import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import prayerEventService, { Condolence, EventViewer, PrayerEvent } from '../services/prayerEventService';
import { useAuth } from '../contexts/AuthContext';

export default function CompletedEventScreen() {
  const { eventId } = useLocalSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<PrayerEvent | null>(null);
  const [viewers, setViewers] = useState<EventViewer[]>([]);
  const [condolences, setCondolences] = useState<Condolence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadEventData();
      // Track that this user viewed the event
      if (user) {
        prayerEventService.trackEventViewer(
          String(eventId),
          user.id,
          user.displayName || user.email || undefined,
          user.email || undefined
        );
      }
    }
  }, [eventId, user]);

  const loadEventData = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      // Load event
      const eventResult = await prayerEventService.getPrayerEvent(String(eventId));
      if (eventResult.success && eventResult.event) {
        setEvent(eventResult.event);
      }

      // Load viewers
      const viewersResult = await prayerEventService.getEventViewers(String(eventId));
      if (viewersResult.success && viewersResult.viewers) {
        setViewers(viewersResult.viewers);
      }

      // Load condolences
      const condolencesResult = await prayerEventService.getCondolences(String(eventId));
      if (condolencesResult.success && condolencesResult.condolences) {
        setCondolences(condolencesResult.condolences);
      }
    } catch (error) {
      console.error('Error loading event data:', error);
      Alert.alert('Error', 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };


  const formatDateTime = (dateStr: string, timeStr: string): string => {
    try {
      const dateParts = dateStr.split('-');
      const timeParts = timeStr.split(':');
      
      if (dateParts.length === 3 && timeParts.length >= 2) {
        const date = new Date(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2]),
          parseInt(timeParts[0]),
          parseInt(timeParts[1])
        );
        return moment(date).format('MMM D, YYYY • h:mm A');
      }
      return `${dateStr} at ${timeStr}`;
    } catch {
      return `${dateStr} at ${timeStr}`;
    }
  };

  const formatTimestamp = (timestamp: any): string => {
    try {
      if (timestamp?.toDate) {
        return moment(timestamp.toDate()).format('MMM D, YYYY • h:mm A');
      }
      return 'Unknown date';
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F7C97B" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Completed</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Event Details Card */}
        <View style={styles.card}>
          {event.photo && (
            <Image source={{ uri: event.photo }} style={styles.eventPhoto} />
          )}
          <Text style={styles.eventName}>{event.departedName}</Text>
          <View style={styles.eventInfoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666666" />
            <Text style={styles.eventInfoText}>
              {formatDateTime(event.date, event.time)}
            </Text>
          </View>
          {event.memorialMessage && (
            <Text style={styles.eventMessage}>{event.memorialMessage}</Text>
          )}
        </View>

        {/* Users Count Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={24} color="#F7C97B" />
            <Text style={styles.cardTitle}>Users Count</Text>
          </View>
          <Text style={styles.countText}>{viewers.length}</Text>
          <Text style={styles.countSubtext}>Total viewers</Text>
          
          {viewers.length > 0 && (
            <View style={styles.listContainer}>
              {viewers.map((viewer) => (
                <View key={viewer.id} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemName}>
                      {viewer.userName || viewer.phoneNumber || 'Anonymous'}
                    </Text>
                    <Text style={styles.listItemDate}>
                      {formatTimestamp(viewer.viewedAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Condolences Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart-outline" size={24} color="#F7C97B" />
            <Text style={styles.cardTitle}>Condolences</Text>
          </View>
          <Text style={styles.countText}>{condolences.length}</Text>
          <Text style={styles.countSubtext}>Messages received</Text>

          {/* Condolences List */}
          {condolences.length > 0 && (
            <View style={styles.listContainer}>
              {condolences.map((condolence) => (
                <View key={condolence.id} style={styles.condolenceItem}>
                  <View style={styles.condolenceHeader}>
                    <Text style={styles.condolenceAuthor}>
                      {condolence.userName || condolence.phoneNumber || 'Anonymous'}
                    </Text>
                    <Text style={styles.condolenceDate}>
                      {formatTimestamp(condolence.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.condolenceMessage}>{condolence.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 24,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F7C97B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  eventName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  eventMessage: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  countText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F7C97B',
    marginBottom: 4,
  },
  countSubtext: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  listContainer: {
    marginTop: 16,
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  listItemDate: {
    fontSize: 12,
    color: '#999999',
  },
  condolenceItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  condolenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  condolenceAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  condolenceDate: {
    fontSize: 12,
    color: '#999999',
  },
  condolenceMessage: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
});

