import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PendingApprovalScreen() {
  const { eventData: eventDataParam } = useLocalSearchParams();
  
  // Parse event data from route parameters
  const eventData = eventDataParam ? JSON.parse(eventDataParam as string) : {
    name: 'abc',
    date: '1111-11-11',
    time: '11:11',
    message: '1111',
  };
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
        </View>

        {/* Main Content Card */}
        <View style={styles.mainCard}>
          {/* Status Indicator */}
          <View style={styles.statusSection}>
            <View style={styles.clockIcon}>
              <Ionicons name="time-outline" size={48} color="#666666" />
            </View>
            
            <View style={styles.statusTag}>
              <Text style={styles.statusTagText}>Pending Approval</Text>
            </View>
            
            <Text style={styles.statusTitle}>Pending Approval</Text>
            
            <Text style={styles.statusDescription}>
              Your prayer event is under review. We'll verify your documents and notify you once approved. This usually takes 24-48 hours.
            </Text>
          </View>

          {/* Event Details Section */}
          <View style={styles.eventDetailsSection}>
            <Text style={styles.eventDetailsTitle}>Event Details</Text>
            
            <View style={styles.eventDetailsList}>
              <View style={styles.eventDetailItem}>
                <Text style={styles.eventDetailLabel}>Name:</Text>
                <Text style={styles.eventDetailValue}>{eventData?.name || 'abc'}</Text>
              </View>
              
              <View style={styles.eventDetailItem}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666666" />
                  <Text style={styles.eventDetailLabel}>Date:</Text>
                </View>
                <Text style={styles.eventDetailValue}>
                  {eventData?.date || '1111-11-11'} at {eventData?.time || '11:11'}
                </Text>
              </View>
              
              <View style={styles.eventDetailItem}>
                <Text style={styles.eventDetailLabel}>Message:</Text>
                <Text style={styles.eventDetailValue}>{eventData?.message || '1111'}</Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.dashboardButton} onPress={handleGoToDashboard}>
            <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  statusTagText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
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
