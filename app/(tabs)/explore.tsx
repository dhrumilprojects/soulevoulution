import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ExploreScreen() {
  const eventTypes = [
    {
      icon: 'heart-outline',
      title: 'Memorial Service',
      description: 'Honor your loved one with a beautiful memorial ceremony',
    },
    {
      icon: 'flower-outline',
      title: 'Prayer Gathering',
      description: 'Organize a peaceful prayer session with family and friends',
    },
    {
      icon: 'candle-outline',
      title: 'Candlelight Vigil',
      description: 'Create a serene candlelight tribute for remembrance',
    },
    {
      icon: 'people-outline',
      title: 'Community Prayer',
      description: 'Connect with your community in shared prayer and support',
    },
  ];

  const handleEventTypePress = (eventType: string) => {
    Alert.alert('Event Type', `Create a ${eventType} event functionality will be implemented here.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Event Types</Text>
          <Text style={styles.subtitle}>Choose the perfect ceremony for your loved one</Text>
        </View>
        
        <View style={styles.eventTypesContainer}>
          {eventTypes.map((eventType, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.eventTypeCard}
              onPress={() => handleEventTypePress(eventType.title)}
              activeOpacity={0.8}
            >
              <View style={styles.eventTypeIcon}>
                <Ionicons name={eventType.icon as any} size={28} color="#F7C97B" />
              </View>
              <View style={styles.eventTypeContent}>
                <Text style={styles.eventTypeTitle}>{eventType.title}</Text>
                <Text style={styles.eventTypeDescription}>{eventType.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Create Custom Event</Text>
        </TouchableOpacity>
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
    marginBottom: 32,
    paddingTop: 8,
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
  eventTypesContainer: {
    marginBottom: 32,
  },
  eventTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  eventTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(247, 201, 123, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventTypeContent: {
    flex: 1,
  },
  eventTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  eventTypeDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  actionButton: {
    backgroundColor: '#F7C97B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
});
