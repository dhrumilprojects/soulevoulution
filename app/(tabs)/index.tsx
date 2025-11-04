import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import prayerEventService, { PrayerEvent } from '../../services/prayerEventService';

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const [events, setEvents] = useState<PrayerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await authService.signOut();
            if (result.success) {
              await refreshUser();
              router.replace('/login');
            } else {
              Alert.alert('Error', result.error || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleCreateEvent = () => {
    router.push('/create-prayer');
  };

  const fetchEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await prayerEventService.getUserPrayerEvents(user.id);
      if (result.success && result.events) {
        setEvents(result.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDateTime = (dateStr: string, timeStr: string): string => {
    try {
      // Parse date (expecting YYYY-MM-DD format)
      const dateParts = dateStr.split('-');
      if (dateParts.length !== 3) return `${dateStr} at ${timeStr}`;
      
      // Parse time (expecting HH:MM format)
      const timeParts = timeStr.split(':');
      if (timeParts.length < 2) return `${dateStr} at ${timeStr}`;
      
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2]);
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      
      const dateTime = new Date(year, month, day, hours, minutes);
      return moment(dateTime).format('MMM D, YYYY • h:mm A');
    } catch (error) {
      return `${dateStr} at ${timeStr}`;
    }
  };

  const handleViewDetails = (event: PrayerEvent) => {
    router.push({
      pathname: '/view-prayer',
      params: {
        eventId: event.id || '',
        eventData: JSON.stringify({
          name: event.departedName,
          date: event.date,
          time: event.time,
          message: event.memorialMessage,
        }),
      },
    });
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  // Refresh events when screen comes into focus
  useEffect(() => {
    const unsubscribe = () => {
      fetchEvents();
    };

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Manage your prayer events</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={() => handleLogout()}>
            <Ionicons name="log-out-outline" size={16} color="#333333" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Create New Prayer Event Section */}
        <View style={styles.createEventCard}>
          <View style={styles.createEventContent}>
            <Text style={styles.createEventTitle}>Create New Prayer Event</Text>
            <Text style={styles.createEventDescription}>Set up a virtual ceremony for your loved one.</Text>
            <TouchableOpacity 
              style={styles.createEventButton} 
              onPress={handleCreateEvent}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createEventButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Events Section */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>Your Events</Text>
          {loading ? (
            <View style={styles.emptyEventsCard}>
              <Ionicons name="hourglass-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyEventsText}>Loading events...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyEventsCard}>
              <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyEventsText}>No events created yet</Text>
              <Text style={styles.emptyEventsDescription}>Create your first prayer event to get started.</Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {events.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventName} numberOfLines={1} ellipsizeMode="tail">
                        {event.departedName}
                      </Text>
                      <View style={styles.statusTag}>
                        <View style={[
                          styles.statusDot,
                          event.status === 'pending' && styles.statusDotPending,
                          event.status === 'approved' && styles.statusDotApproved,
                          event.status === 'rejected' && styles.statusDotRejected,
                        ]} />
                        <Text style={styles.statusTagText} numberOfLines={1}>
                          {event.status === 'pending' ? 'Pending' : 
                            event.status === 'approved' ? 'Approved' : 'Rejected'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.eventDateTime}>
                      <Ionicons name="calendar-outline" size={14} color="#999999" />
                      <Text style={styles.eventDateTimeText} numberOfLines={1}>
                        {formatEventDateTime(event.date, event.time)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => handleViewDetails(event)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewDetailsButtonText}>View</Text>
                  </TouchableOpacity>
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
    padding: 24,
    paddingBottom: 100, // Extra space for bottom tabs
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingTop: 8,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 6,
  },
  createEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  createEventContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  createEventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 30,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  createEventDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
    lineHeight: 22,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  createEventButton: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#F7C97B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Added to center content horizontally
    shadowColor: '#F7C97B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E6B85C',
  },
  createEventButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  eventsSection: {
    marginBottom: 20,
  },
  eventsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 20,
    letterSpacing: -0.4,
  },
  emptyEventsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyEventsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  emptyEventsDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  eventsList: {
    flexDirection: 'column',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
  },
  eventContent: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
    flex: 1,
    minWidth: 0,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotPending: {
    backgroundColor: '#FFA726',
  },
  statusDotApproved: {
    backgroundColor: '#4CAF50',
  },
  statusDotRejected: {
    backgroundColor: '#F44336',
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 5,
  },
  eventDateTime: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  eventDateTimeText: {
    fontSize: 13,
    color: '#999999',
    marginLeft: 6,
    flex: 1,
    minWidth: 0,
  },
  viewDetailsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F7C97B',
    flexShrink: 0,
  },
  viewDetailsButtonText: {
    color: '#F7C97B',
    fontSize: 13,
    fontWeight: '600',
  },
});
