import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import muxService, { LiveStream } from '../services/muxService';
import prayerEventService from '../services/prayerEventService';

export default function LiveStreamScreen() {
  const { eventId } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [eventName, setEventName] = useState<string>('');
  const [streamStatus, setStreamStatus] = useState<'idle' | 'active' | 'disconnected'>('idle');

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      const result = await prayerEventService.getPrayerEvent(String(eventId));
      if (result.success && result.event) {
        setEventName(result.event.departedName || 'Prayer Event');
      }
    };
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    const createStream = async () => {
      if (!permission?.granted) return;
      
      setIsCreating(true);
      const result = await muxService.createLiveStream(eventName || 'Prayer Event');
      
      if (result.success && result.liveStream) {
        setLiveStream(result.liveStream);
        setStreamStatus(result.liveStream.status || 'idle');
        Alert.alert(
          'Live Stream Created',
          `Your live stream is ready!\n\nRTMP URL: rtmp://live.mux.com/app/${result.liveStream.stream_key}\n\nStatus: ${result.liveStream.status || 'idle'}\n\nThe stream will become active once you start streaming video to the RTMP URL.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create live stream');
      }
      setIsCreating(false);
    };

    if (permission?.granted && !liveStream) {
      createStream();
    }
  }, [permission?.granted, eventName]);

  // Poll stream status when streaming is active
  useEffect(() => {
    if (!liveStream || !isStreaming) return;

    const checkStatus = async () => {
      const result = await muxService.getLiveStream(liveStream!.id);
      if (result.success && result.liveStream) {
        setStreamStatus(result.liveStream.status || 'idle');
      }
    };

    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    checkStatus(); // Check immediately

    return () => clearInterval(interval);
  }, [liveStream, isStreaming]);

  const handleStartStream = async () => {
    if (!liveStream) {
      Alert.alert('Error', 'Live stream not initialized');
      return;
    }

    // RTMP Streaming Implementation Required
    // To make the stream active, you need to stream video to:
    // rtmp://live.mux.com/app/{stream_key}
    // 
    // For Expo, you'll need to use a library like:
    // - react-native-livestream (requires native modules)
    // - Or create a backend service that handles RTMP streaming
    // - Or use WebRTC if Mux supports it for your use case
    
    setIsStreaming(true);
    Alert.alert(
      'Streaming Info',
      `To start streaming:\n\n1. Use RTMP URL:\nrtmp://live.mux.com/app/${liveStream.stream_key}\n\n2. Stream from OBS, ffmpeg, or an RTMP streaming app\n\n3. The stream status will change to "active" once video is received.\n\nNote: Direct camera streaming requires native RTMP libraries.`,
      [{ text: 'OK' }]
    );
  };

  const handleStopStream = async () => {
    setIsStreaming(false);
    if (liveStream) {
      const result = await muxService.deleteLiveStream(liveStream.id);
      if (result.success) {
        Alert.alert('Stream Stopped', 'Live stream has been ended.');
        router.back();
      } else {
        Alert.alert('Error', result.error || 'Failed to stop stream');
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F7C97B" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#666666" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to start the live stream.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {isStreaming && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
      </View>

      <CameraView
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.overlay}>
          <View style={styles.controls}>
            {isCreating ? (
              <View style={styles.centerButton}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.buttonText}>Creating Stream...</Text>
              </View>
            ) : liveStream && !isStreaming ? (
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartStream}
                >
                  <Ionicons name="radio" size={32} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Start Streaming</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          
          {/* Bottom Controls - Rotate Camera (Center) and Stop Stream (when active) */}
          <View style={styles.bottomControls}>
            {isStreaming && (
              <TouchableOpacity
                style={[styles.stopStreamButton, styles.stopButtonLeft]}
                onPress={handleStopStream}
              >
                <Ionicons name="stop-circle" size={24} color="#FFFFFF" />
                <Text style={styles.stopStreamText}>End Stream</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.rotateButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            {isStreaming && (
              <View style={[styles.stopStreamButton, styles.stopButtonRight]} />
            )}
          </View>
        </View>
      </CameraView>

      {liveStream && (
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Stream Information</Text>
            <View style={[styles.statusBadge, streamStatus === 'active' && styles.statusBadgeActive]}>
              <Text style={styles.statusBadgeText}>{streamStatus.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.infoLabel}>RTMP URL:</Text>
          <Text style={styles.infoText}>
            rtmp://live.mux.com/app/{liveStream.stream_key}
          </Text>
          {liveStream.playback_ids && liveStream.playback_ids.length > 0 && (
            <>
              <Text style={styles.infoLabel}>Playback ID:</Text>
              <Text style={styles.infoText}>
                {liveStream.playback_ids[0].id}
              </Text>
            </>
          )}
          <Text style={styles.infoNote}>
            Note: Stream will remain "idle" until video is sent to the RTMP URL. Use OBS, ffmpeg, or an RTMP streaming app to broadcast.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#F7C97B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#666666',
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  controls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  rotateButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  stopStreamButton: {
    backgroundColor: '#F44336',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#F44336',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
  },
  stopButtonLeft: {
    position: 'absolute',
    left: 20,
  },
  stopButtonRight: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    minWidth: 120,
  },
  stopStreamText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  infoLabel: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  infoText: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  infoNote: {
    color: '#FFA726',
    fontSize: 11,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

