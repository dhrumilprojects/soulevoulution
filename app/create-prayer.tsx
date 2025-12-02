import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import prayerEventService from '../services/prayerEventService';

export default function CreatePrayerScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    photo: null as string | null,
    yourName: '',
    departedName: '',
    date: '',
    time: '',
    memorialMessage: '',
    memoryPhotos: [] as string[],
    aadharCard: null as string | null,
    deathCertificate: null as string | null,
  });
  
  // Date and time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  const handlePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleMemoryPhotosUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        const updatedPhotos = [...formData.memoryPhotos, ...newPhotos].slice(0, 10); // Max 10 photos
        setFormData(prev => ({ ...prev, memoryPhotos: updatedPhotos }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeMemoryPhoto = (index: number) => {
    const updatedPhotos = formData.memoryPhotos.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, memoryPhotos: updatedPhotos }));
  };

  const handleDocumentUpload = async (documentType: 'aadharCard' | 'deathCertificate') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, [documentType]: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format date for display (dd/mm/yyyy)
  const formatDateDisplay = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date for storage (YYYY-MM-DD)
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Store in YYYY-MM-DD format for backend
    setFormData(prev => ({ ...prev, date: formatDate(date) }));
    setShowDatePicker(false);
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setFormData(prev => ({ ...prev, time: formatTime(time) }));
    setShowTimePicker(false);
  };

  const handleTimeInputChange = (value: string) => {
    // Remove any non-digit characters except colon
    const cleaned = value.replace(/[^\d:]/g, '');
    
    // Allow empty input (for deletion)
    if (cleaned.length === 0) {
      setFormData(prev => ({ ...prev, time: '' }));
      return;
    }
    
    // Limit to HH:MM format
    if (cleaned.length <= 5) {
      // Auto-format as user types
      let formatted = cleaned;
      
      // Handle colon placement
      if (cleaned.length === 1) {
        // Single digit - allow it
        formatted = cleaned;
      } else if (cleaned.length === 2 && !cleaned.includes(':')) {
        // Two digits without colon - add colon after
        formatted = cleaned + ':';
      } else if (cleaned.length > 2 && !cleaned.includes(':')) {
        // More than 2 digits without colon - insert colon after 2nd digit
        formatted = cleaned.slice(0, 2) + ':' + cleaned.slice(2);
      } else {
        // Already has colon or other format
        formatted = cleaned;
      }
      
      // Validate and format only if we have complete parts
      const parts = formatted.split(':');
      if (parts.length === 2) {
        const hoursStr = parts[0];
        const minutesStr = parts[1];
        
        // Allow partial input (empty or incomplete)
        if (hoursStr.length === 0 || minutesStr.length === 0) {
          setFormData(prev => ({ ...prev, time: formatted }));
          return;
        }
        
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        
        // Check if hours are valid (0-23) when complete
        if (hoursStr.length === 2 && (hours < 0 || hours > 23)) {
          // Invalid hours, but allow deletion - just don't auto-format
          setFormData(prev => ({ ...prev, time: formatted }));
          return;
        }
        
        // Check if minutes are valid (0-59) when complete
        if (minutesStr.length === 2 && (minutes < 0 || minutes > 59)) {
          // Invalid minutes, but allow deletion - just don't auto-format
          setFormData(prev => ({ ...prev, time: formatted }));
          return;
        }
        
        // Format with leading zeros only if both parts are complete
        if (hoursStr.length === 2 && minutesStr.length === 2) {
          const formattedHours = hours.toString().padStart(2, '0');
          const formattedMinutes = minutes.toString().padStart(2, '0');
          formatted = `${formattedHours}:${formattedMinutes}`;
        }
      } else if (parts.length === 1 && formatted.includes(':')) {
        // Just colon, allow it for deletion purposes
        formatted = formatted;
      }
      
      setFormData(prev => ({ ...prev, time: formatted }));
      
      // Update selectedTime if valid complete time
      if (formatted.match(/^\d{2}:\d{2}$/)) {
        const [hours, minutes] = formatted.split(':').map(Number);
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const newTime = new Date();
          newTime.setHours(hours, minutes, 0, 0);
          setSelectedTime(newTime);
        }
      }
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      // Validate required fields for step 1
      if (!formData.departedName || !formData.date || !formData.time) {
        Alert.alert('Required Fields', 'Please fill in all required fields marked with *');
        return;
      }
      
      // Validate time format (HH:MM)
      const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(formData.time)) {
        Alert.alert('Invalid Time', 'Please enter a valid time in HH:MM format (e.g., 14:30)');
        return;
      }
    } else if (step === 3) {
      // Validate required documents for step 3
      if (!formData.aadharCard || !formData.deathCertificate) {
        Alert.alert('Required Documents', 'Please upload both Aadhar Card and Death Certificate for verification.');
        return;
      }
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Handle form submission
      await handleSubmitEvent();
    }
  };

  const handleSubmitEvent = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a prayer event.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to Firebase Storage
      let photoURL = null;
      let aadharCardURL = null;
      let deathCertificateURL = null;
      const memoryPhotoURLs: string[] = [];

      // Upload main photo
      if (formData.photo) {
        const photoResult = await prayerEventService.uploadImage(
          formData.photo,
          `prayer-events/${user.id}/photo_${Date.now()}.jpg`
        );
        if (photoResult.success) {
          photoURL = photoResult.downloadURL;
        }
      }

      // Upload memory photos
      for (const photoUri of formData.memoryPhotos) {
        const memoryPhotoResult = await prayerEventService.uploadImage(
          photoUri,
          `prayer-events/${user.id}/memory_${Date.now()}_${Math.random()}.jpg`
        );
        if (memoryPhotoResult.success) {
          memoryPhotoURLs.push(memoryPhotoResult.downloadURL!);
        }
      }

      // Upload Aadhar Card
      if (formData.aadharCard) {
        const aadharResult = await prayerEventService.uploadImage(
          formData.aadharCard,
          `prayer-events/${user.id}/aadhar_${Date.now()}.jpg`
        );
        if (aadharResult.success) {
          aadharCardURL = aadharResult.downloadURL;
        }
      }

      // Upload Death Certificate
      if (formData.deathCertificate) {
        const deathCertResult = await prayerEventService.uploadImage(
          formData.deathCertificate,
          `prayer-events/${user.id}/death_cert_${Date.now()}.jpg`
        );
        if (deathCertResult.success) {
          deathCertificateURL = deathCertResult.downloadURL;
        }
      }

      // Create prayer event in Firestore
      const eventData = {
        userName: formData.yourName || user.phoneNumber || 'Anonymous',
        departedName: formData.departedName,
        date: formData.date,
        time: formData.time,
        memorialMessage: formData.memorialMessage,
        photo: photoURL || undefined,
        memoryPhotos: memoryPhotoURLs,
        aadharCard: aadharCardURL || undefined,
        deathCertificate: deathCertificateURL || undefined,
      };

      const result = await prayerEventService.createPrayerEvent(user.id, eventData);

      if (result.success) {
        // Navigate to pending approval screen with event data
        router.replace({
          pathname: '/view-prayer',
          params: {
            eventData: JSON.stringify({
              name: formData.departedName,
              date: formData.date,
              time: formData.time,
              message: formData.memorialMessage,
            }),
          },
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to create prayer event');
      }
    } catch (error) {
      console.error('Error submitting prayer event:', error);
      Alert.alert('Error', 'Failed to create prayer event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const renderStep1 = () => (
    <View style={styles.formContainer}>
      {/* Photo Upload */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Photo of Departed Soul *</Text>
        <TouchableOpacity style={styles.photoUpload} onPress={handlePhotoUpload}>
          {formData.photo ? (
            <Image source={{ uri: formData.photo }} style={styles.uploadedPhoto} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color="#666666" />
              <Text style={styles.uploadText}>Click to upload a photo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Your Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your name"
          placeholderTextColor="#999999"
          value={formData.yourName}
          onChangeText={(value) => handleInputChange('yourName', value)}
        />
      </View>

      {/* Name of Departed Soul */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name of Departed Soul *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter name"
          placeholderTextColor="#999999"
          value={formData.departedName}
          onChangeText={(value) => handleInputChange('departedName', value)}
        />
      </View>

      {/* Date and Time Row */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date and time of prayer meeting *</Text>
        <View style={styles.rowContainer}>
          <View style={[styles.inputGroup, styles.halfWidth, { marginBottom: 0 }]}>
            <TouchableOpacity 
              style={styles.inputWithIcon}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <TextInput
                style={[styles.textInput, styles.inputWithIconText]}
                placeholder="dd/mm/yyyy"
                placeholderTextColor="#999999"
                value={formData.date}
                editable={false}
                pointerEvents="none"
              />
              <View style={styles.iconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#999999" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth, { marginBottom: 0 }]}>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.textInput, styles.inputWithIconText]}
                placeholder="hh:mm"
                placeholderTextColor="#999999"
                value={formData.time}
                onChangeText={handleTimeInputChange}
                keyboardType="numeric"
                maxLength={5}
              />
              <TouchableOpacity 
                style={styles.iconContainer}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={20} color="#999999" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Memorial Message */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Memorial Message (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="In loving memory..."
          placeholderTextColor="#999999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={formData.memorialMessage}
          onChangeText={(value) => handleInputChange('memorialMessage', value)}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Upload Memory Photos</Text>
      <Text style={styles.stepDescription}>Add photos to be displayed on the memory wall (Max 10 images)</Text>
      
      {/* Memory Photos Upload Area */}
      <TouchableOpacity 
        style={styles.memoryPhotosUpload} 
        onPress={handleMemoryPhotosUpload}
        activeOpacity={0.8}
      >
        <Ionicons name="cloud-upload-outline" size={32} color="#F7C97B" />
        <Text style={styles.uploadText}>Add Photo</Text>
      </TouchableOpacity>

      {/* Display uploaded memory photos */}
      {formData.memoryPhotos.length > 0 && (
        <View style={styles.memoryPhotosGrid}>
          {formData.memoryPhotos.map((photo, index) => (
            <View key={index} style={styles.memoryPhotoItem}>
              <Image source={{ uri: photo }} style={styles.memoryPhoto} />
              <TouchableOpacity 
                style={styles.removePhotoButton}
                onPress={() => removeMemoryPhoto(index)}
              >
                <Ionicons name="close-circle" size={20} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Verification Documents</Text>
      <Text style={styles.stepDescription}>Upload Aadhar Card and Death Certificate for verification.</Text>
      
      {/* Aadhar Card Upload */}
      <View style={styles.documentUploadContainer}>
        <Text style={styles.documentLabel}>Aadhar Card *</Text>
        <TouchableOpacity 
          style={styles.documentUploadArea} 
          onPress={() => handleDocumentUpload('aadharCard')}
          activeOpacity={0.8}
        >
          <View style={styles.documentUploadContent}>
            <Ionicons name="document-outline" size={24} color="#F7C97B" />
            <View style={styles.documentUploadText}>
              <Text style={styles.chooseFileText}>Choose file</Text>
              <Text style={styles.noFileText}>
                {formData.aadharCard ? 'File selected' : 'No file chosen'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Death Certificate Upload */}
      <View style={styles.documentUploadContainer}>
        <Text style={styles.documentLabel}>Death Certificate *</Text>
        <TouchableOpacity 
          style={styles.documentUploadArea} 
          onPress={() => handleDocumentUpload('deathCertificate')}
          activeOpacity={0.8}
        >
          <View style={styles.documentUploadContent}>
            <Ionicons name="document-outline" size={24} color="#F7C97B" />
            <View style={styles.documentUploadText}>
              <Text style={styles.chooseFileText}>Choose file</Text>
              <Text style={styles.noFileText}>
                {formData.deathCertificate ? 'File selected' : 'No file chosen'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          Note: These documents are used for verification purposes only and will be kept confidential.
        </Text>
      </View>
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((stepNumber) => (
        <View
          key={stepNumber}
          style={[
            styles.progressBar,
            stepNumber <= step ? styles.progressBarActive : styles.progressBarInactive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.heartIcon}>
              <Ionicons name="heart" size={24} color="#F7C97B" />
            </View>
            <Text style={styles.title}>Create Prayer Event</Text>
            <Text style={styles.subtitle}>
              Step {step} of 3: {step === 1 ? 'Basic Details' : step === 2 ? 'Memory Photos' : 'Review & Confirm'}
            </Text>
            {renderProgressBar()}
          </View>
        </View>

        {/* Form Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]} 
            onPress={handleNext}
            disabled={isSubmitting}
          >
            <Text style={styles.nextButtonText}>
              {isSubmitting 
                ? 'Creating...' 
                : step === 3 
                  ? 'Create Event' 
                  : 'Next'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => handleDateSelect(selectedDate)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerDateText}>{formatDateDisplay(selectedDate)}</Text>
              <View style={styles.dateButtonsContainer}>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <Ionicons name="chevron-back" size={20} color="#F7C97B" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#F7C97B" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => handleTimeSelect(selectedTime)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTimeText}>{formatTime(selectedTime)}</Text>
              <View style={styles.timeButtonsContainer}>
                <View style={styles.timeButtonGroup}>
                  <Text style={styles.timeLabel}>Hours</Text>
                  <View style={styles.timeButtonsRow}>
                    <TouchableOpacity 
                      style={styles.timeButton}
                      onPress={() => {
                        const newTime = new Date(selectedTime);
                        newTime.setHours(newTime.getHours() - 1);
                        setSelectedTime(newTime);
                      }}
                    >
                      <Ionicons name="chevron-up" size={20} color="#F7C97B" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.timeButton}
                      onPress={() => {
                        const newTime = new Date(selectedTime);
                        newTime.setHours(newTime.getHours() + 1);
                        setSelectedTime(newTime);
                      }}
                    >
                      <Ionicons name="chevron-down" size={20} color="#F7C97B" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.timeButtonGroup}>
                  <Text style={styles.timeLabel}>Minutes</Text>
                  <View style={styles.timeButtonsRow}>
                    <TouchableOpacity 
                      style={styles.timeButton}
                      onPress={() => {
                        const newTime = new Date(selectedTime);
                        newTime.setMinutes(newTime.getMinutes() - 15);
                        setSelectedTime(newTime);
                      }}
                    >
                      <Ionicons name="chevron-up" size={20} color="#F7C97B" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.timeButton}
                      onPress={() => {
                        const newTime = new Date(selectedTime);
                        newTime.setMinutes(newTime.getMinutes() + 15);
                        setSelectedTime(newTime);
                      }}
                    >
                      <Ionicons name="chevron-down" size={20} color="#F7C97B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingTop: 8,
  },
  headerBackButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  heartIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    width: 40,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  progressBarActive: {
    backgroundColor: '#F7C97B',
  },
  progressBarInactive: {
    backgroundColor: '#E0E0E0',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'System',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoUpload: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  uploadedPhoto: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  uploadText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputWithIconText: {
    paddingRight: 45,
  },
  iconContainer: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7C97B',
  },
  backButtonText: {
    color: '#F7C97B',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#F7C97B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
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
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  memoryPhotosUpload: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#F7C97B',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  memoryPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memoryPhotoItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  memoryPhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  documentUploadContainer: {
    marginBottom: 20,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  documentUploadArea: {
    borderWidth: 2,
    borderColor: '#F7C97B',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  documentUploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentUploadText: {
    marginLeft: 12,
    flex: 1,
  },
  chooseFileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  noFileText: {
    fontSize: 14,
    color: '#666666',
  },
  noteContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F7C97B',
  },
  noteText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area bottom
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#666666',
  },
  pickerDoneText: {
    fontSize: 16,
    color: '#F7C97B',
    fontWeight: '600',
  },
  pickerContent: {
    padding: 20,
    alignItems: 'center',
  },
  pickerDateText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  pickerTimeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  dateButtonsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  dateButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7C97B',
  },
  timeButtonsContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  timeButtonGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  timeButtonsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  timeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7C97B',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
});
