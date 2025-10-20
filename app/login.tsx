import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpData, setOtpData] = useState<any>(null);
  const { refreshUser } = useAuth();

  const validatePhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return cleaned.length === 10;
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    
    try {
      // Format phone number with country code (assuming India +91)
      const formattedPhoneNumber = `+91${phoneNumber}`;
      
      const result = await authService.sendOTP(formattedPhoneNumber);
      
      if (result.success) {
        setOtpData(result.user);
        setShowOTP(true);
        // For development, show the OTP in console
        console.log(`Development OTP: ${result.user.otp}`);
        Alert.alert('OTP Sent', 'A 6-digit code has been sent to your phone number.');
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    setPhoneNumber(limited);
  };

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      // Focus next input (you'll need to add refs for this)
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }

    if (!otpData) {
      Alert.alert('Error', 'No OTP data found. Please try again.');
      return;
    }

    setIsVerifying(true);
    
    try {
      const result = await authService.verifyOTP(otpData.phoneNumber, otpString);
      
      if (result.success) {
        // Refresh auth context
        await refreshUser();
        Alert.alert('Success', 'OTP verified successfully!', [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to main app
              router.replace('/(tabs)');
            }
          }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to verify OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = () => {
    setShowOTP(false);
    setOtp(['', '', '', '', '', '']);
    setOtpData(null);
    // This will allow user to enter phone number again and resend OTP
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            {!showOTP ? (
              <>
                {/* Phone Icon */}
                <View style={styles.iconContainer}>
                  <Ionicons name="call-outline" size={24} color="#D4A04B" />
                </View>

                {/* Welcome Text */}
                <Text style={styles.welcomeText}>Welcome</Text>
                <Text style={styles.subtitleText}>Enter your phone number to continue</Text>

                {/* Phone Number Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#AAAAAA"
                    value={phoneNumber}
                    onChangeText={formatPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoFocus
                  />
                </View>

                {/* Send OTP Button */}
                <TouchableOpacity
                  style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sendButtonText}>
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* OTP Icon */}
                <View style={styles.iconContainer}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#D4A04B" />
                </View>

                {/* OTP Text */}
                <Text style={styles.welcomeText}>Enter OTP</Text>
                <Text style={styles.subtitleText}>
                  We've sent a 6-digit code to {phoneNumber}
                </Text>

                {/* OTP Input Fields */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(value) => handleOTPChange(value, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      autoFocus={index === 0}
                    />
                  ))}
                </View>

                {/* Verify OTP Button */}
                <TouchableOpacity
                  style={[styles.sendButton, isVerifying && styles.sendButtonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={isVerifying}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sendButtonText}>
                    {isVerifying ? 'Verifying...' : 'Verify OTP & Continue'}
                  </Text>
                </TouchableOpacity>

                {/* Resend OTP Link */}
                <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F0', // Warm beige background from image
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24, // More generous padding like in image
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Large rounded corners like in image
    padding: 32, // Generous padding
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    // Subtle shadow like in image
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 64, // Larger icon container like in image
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F7C97B', // Golden yellow background from image
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28, // Large welcome text like in image
    fontWeight: '700', // Bold weight
    color: '#333333', // Dark gray text
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16, // Medium subtitle text
    fontWeight: '400',
    color: '#666666', // Medium gray
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16, // Larger label text
    fontWeight: '600', // Semi-bold
    color: '#333333', // Dark gray
    marginBottom: 8,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray border
    borderRadius: 12, // Rounded input field
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333333',
  },
  sendButton: {
    backgroundColor: '#F7C97B', // Golden yellow button like in image
    borderRadius: 12, // Rounded button
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    // Subtle button shadow
    shadowColor: '#F7C97B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600', // Semi-bold
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    color: '#333333',
    textAlign: 'center',
  },
  resendButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  resendText: {
    color: '#F7C97B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
