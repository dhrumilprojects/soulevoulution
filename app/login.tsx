import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

WebBrowser.maybeCompleteAuthSession();

const extra = (Constants.expoConfig as { extra?: Record<string, string> })?.extra ?? {};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const webClientId = extra.GOOGLE_WEB_CLIENT_ID || '';
  const iosClientId = extra.GOOGLE_IOS_CLIENT_ID || webClientId;
  const androidClientId = extra.GOOGLE_ANDROID_CLIENT_ID || webClientId;

  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    webClientId,
    iosClientId,
    androidClientId,
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/(tabs)');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!googleResponse) {
      return;
    }
    if (googleResponse.type === 'dismiss' || googleResponse.type === 'cancel') {
      setIsGoogleLoading(false);
      return;
    }
    if (googleResponse.type !== 'success') {
      setIsGoogleLoading(false);
      return;
    }

    const idToken = googleResponse.params.id_token;
    if (!idToken) {
      Alert.alert('Error', 'Google sign-in did not return a valid token.');
      setIsGoogleLoading(false);
      return;
    }

    (async () => {
      const result = await authService.signInWithGoogleIdToken(idToken);
      setIsGoogleLoading(false);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', result.error || 'Google sign-in failed');
      }
    })();
  }, [googleResponse]);

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return false;
    }
    if (isSignUp && !displayName.trim()) {
      Alert.alert('Name Required', 'Please enter your name to create an account.');
      return false;
    }
    return true;
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = isSignUp
        ? await authService.signUpWithEmail(email, password, displayName)
        : await authService.signInWithEmail(email, password);

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Email auth error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!webClientId) {
      Alert.alert(
        'Google Sign-In Not Configured',
        'Add GOOGLE_WEB_CLIENT_ID (and platform client IDs) to app.json extra. Use the Web client ID from your Firebase project.'
      );
      return;
    }

    setIsGoogleLoading(true);
    try {
      await promptGoogleSignIn();
    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsGoogleLoading(false);
      Alert.alert('Error', 'Could not start Google sign-in.');
    }
  };

  const isSubmitDisabled = isLoading || isGoogleLoading;
  const isGoogleDisabled = isSubmitDisabled || !googleRequest;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart-outline" size={28} color="#D4A04B" />
            </View>

            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.subtitleText}>
              {isSignUp ? 'Create an account to continue' : 'Sign in to continue'}
            </Text>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#AAAAAA"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#AAAAAA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor="#AAAAAA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isSubmitDisabled && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading
                  ? isSignUp
                    ? 'Creating account...'
                    : 'Signing in...'
                  : isSignUp
                    ? 'Create Account'
                    : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, isGoogleDisabled && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleDisabled}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>
                {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleModeButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={isSubmitDisabled}
            >
              <Text style={styles.toggleModeText}>
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F0',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F7C97B',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333333',
  },
  primaryButton: {
    backgroundColor: '#F7C97B',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#F7C97B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999999',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  toggleModeButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
  toggleModeText: {
    color: '#F7C97B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
