import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

export default function SettingsScreen() {
  const { user, refreshUser } = useAuth();

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

  const getDisplayLabel = (): string => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email;
    return 'Not available';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* User Info Card */}
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userIconContainer}>
              <Ionicons name="person" size={40} color="#FFFFFF" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userLabel}>Account</Text>
              <Text style={styles.userPhone}>{getDisplayLabel()}</Text>
              {user.email && user.displayName && (
                <>
                  <Text style={styles.userLabel}>Email</Text>
                  <Text style={styles.userName}>{user.email}</Text>
                </>
              )}
              {user.id && (
                <>
                  <Text style={styles.userLabel}>User ID</Text>
                  <Text style={styles.userId}>{user.id}</Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
    paddingTop: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F7C97B',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
    marginTop: 16,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userPhone: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'monospace',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F44336',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  bottomSpacing: {
    height: 20,
  },
});