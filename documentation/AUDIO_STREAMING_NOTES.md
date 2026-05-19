# Audio Streaming Implementation Notes

## Current Status

The implementation now uses `react-native-vision-camera` with audio support enabled (`audio={true}`). However, there's an important limitation:

### Audio Capture Limitation

`react-native-vision-camera` captures audio automatically when `audio={true}` is set, but it doesn't provide frame-by-frame audio access like it does for video. The audio is typically:
- Recorded to a file (not suitable for live streaming)
- Or included in native RTMP streaming (which we're not using)

### Current Implementation

1. **Video**: ✅ Fully implemented
   - Video frames are captured via frame processor
   - Sent to backend as base64-encoded JPEG images
   - Backend converts to RGB24 and encodes to H.264

2. **Audio**: ⚠️ Partially implemented
   - Backend is configured to include audio (AAC encoding)
   - Currently using silent audio (`anullsrc`)
   - Ready to receive audio frames when available

### Options for Real Audio Streaming

#### Option 1: Use react-native-audio-recorder (Recommended)
Capture audio separately and send audio frames to backend:

```typescript
import AudioRecorder from 'react-native-audio-recorder';

// Capture audio frames
const audioData = await AudioRecorder.getAudioFrame();
await rtmpStreamingService.sendAudioFrame(audioData, Date.now());
```

#### Option 2: Use react-native-vision-camera's Recording API
Record audio/video and process the file, but this is not real-time.

#### Option 3: Native Module for Audio Capture
Create a custom native module to capture audio frames in real-time.

### Backend Audio Support

The backend is already configured to:
- Accept `audio_frame` messages via WebSocket
- Encode audio to AAC
- Mux audio with video in the RTMP stream

To enable real audio, you need to:
1. Capture audio frames on the client
2. Send them via `rtmpStreamingService.sendAudioFrame()`
3. Backend will automatically encode and mux them

### Testing

Currently, the stream will have:
- ✅ Video: Real-time video from camera
- ⚠️ Audio: Silent (placeholder audio track)

The stream will work, but without audio. To add real audio, implement one of the options above.

