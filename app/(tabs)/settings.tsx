import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  rightElement, 
  showChevron = true 
}) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
  >
    <View style={styles.settingItemLeft}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={22} color="#F7C97B" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.settingItemRight}>
      {rightElement}
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
      )}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { user, isAuthenticated } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Profile settings will be implemented here.');
  };

  const handleAccountPress = () => {
    Alert.alert('Account', 'Account settings will be implemented here.');
  };

  const handlePrivacyPress = () => {
    Alert.alert('Privacy', 'Privacy settings will be implemented here.');
  };

  const handleNotificationsPress = () => {
    Alert.alert('Notifications', 'Detailed notification settings will be implemented here.');
  };

  const handleLocationPress = () => {
    Alert.alert('Location', 'Location settings will be implemented here.');
  };

  const handleLanguagePress = () => {
    Alert.alert('Language', 'Language selection will be implemented here.');
  };

  const handleHelpPress = () => {
    Alert.alert('Help & Support', 'Help center will be implemented here.');
  };

  const handleAboutPress = () => {
    Alert.alert('About', 'App version and information will be shown here.');
  };

  const handleTermsPress = () => {
    Alert.alert('Terms of Service', 'Terms of service will be opened here.');
  };

  const handlePrivacyPolicyPress = () => {
    Alert.alert('Privacy Policy', 'Privacy policy will be opened here.');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            // Implement sign out logic here
            Alert.alert('Signed Out', 'You have been signed out successfully.');
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    const email = 'support@soulevoulution.com';
    const subject = 'Support Request';
    const body = 'Hello, I need help with...';
    
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open email client');
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your app preferences</Text>
        </View>

        {/* User Profile Section */}
        {isAuthenticated && user && (
          <View style={styles.section}>
            <View style={styles.profileCard}>
              <View style={styles.profileIcon}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user.displayName || user.email || 'User'}
                </Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              title="Profile"
              subtitle="Edit your profile information"
              onPress={handleProfilePress}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Account Security"
              subtitle="Password, 2FA, and security settings"
              onPress={handleAccountPress}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Privacy"
              subtitle="Control your privacy settings"
              onPress={handlePrivacyPress}
            />
          </View>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Manage notification preferences"
              onPress={handleNotificationsPress}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E0E0E0', true: 'rgba(247, 201, 123, 0.3)' }}
                  thumbColor={notificationsEnabled ? '#F7C97B' : '#FFFFFF'}
                  style={styles.switch}
                />
              }
              showChevron={false}
            />
            <SettingItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              rightElement={
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                  trackColor={{ false: '#E0E0E0', true: 'rgba(247, 201, 123, 0.3)' }}
                  thumbColor={darkModeEnabled ? '#F7C97B' : '#FFFFFF'}
                  style={styles.switch}
                />
              }
              showChevron={false}
            />
            <SettingItem
              icon="location-outline"
              title="Location Services"
              subtitle="Allow location access for nearby events"
              rightElement={
                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                  trackColor={{ false: '#E0E0E0', true: 'rgba(247, 201, 123, 0.3)' }}
                  thumbColor={locationEnabled ? '#F7C97B' : '#FFFFFF'}
                  style={styles.switch}
                />
              }
              showChevron={false}
            />
            <SettingItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              onPress={handleLanguagePress}
            />
          </View>
        </View>

        {/* Support & Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={handleHelpPress}
            />
            <SettingItem
              icon="mail-outline"
              title="Contact Us"
              subtitle="Send us feedback or report issues"
              onPress={handleContactSupport}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="App version and information"
              onPress={handleAboutPress}
            />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={handleTermsPress}
            />
            <SettingItem
              icon="shield-outline"
              title="Privacy Policy"
              onPress={handlePrivacyPolicyPress}
            />
          </View>
        </View>

        {/* Sign Out */}
        {isAuthenticated && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#FF4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

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
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F7C97B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(247, 201, 123, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  settingSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666666',
    letterSpacing: 0.1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    marginRight: 8,
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  signOutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  bottomSpacing: {
    height: 20,
  },
});