import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ExploreScreen() {
  const features = [
    {
      icon: 'phone-portrait-outline',
      title: 'Phone Login',
      description: 'Secure authentication with phone number verification',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Security',
      description: 'Built with security best practices',
    },
    {
      icon: 'design-outline',
      title: 'Material Design',
      description: 'Follows Google Material Design guidelines',
    },
    {
      icon: 'phone-portrait-outline',
      title: 'Cross Platform',
      description: 'Works on iOS, Android, and Web',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover app features</Text>
        </View>
        
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={24} color="#FF9800" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Learn More</Text>
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    color: 'rgba(0, 0, 0, 0.87)',
    marginBottom: 8,
    letterSpacing: 0.15,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(0, 0, 0, 0.6)',
    letterSpacing: 0.25,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.87)',
    marginBottom: 4,
    letterSpacing: 0.15,
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  actionButton: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.25,
  },
});
