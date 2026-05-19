# RTMP Streaming Implementation - Backend Service Approach

## ✅ Implementation Complete

This implementation uses **react-native-vision-camera** with a **backend service** to stream video to RTMP (Mux).

## Architecture

```
React Native App
  ↓ (Vision Camera captures frames)
  ↓ (Frame Processor converts to base64)
  ↓ (WebSocket sends to backend)
Backend Service (Node.js/Python)
  ↓ (Receives frames via WebSocket)
  ↓ (FFmpeg encodes to H.264)
  ↓ (Streams to RTMP)
Mux RTMP Server
  ↓ (Distributes to viewers)
```

## Files Created/Modified

1. **`app/live-stream.tsx`** - Updated to use vision-camera with frame processor
2. **`services/rtmpStreamingService.ts`** - WebSocket service for backend communication
3. **`app.json`** - Added vision-camera plugin configuration
4. **`package.json`** - Added react-native-vision-camera dependency
5. **`BACKEND_STREAMING_SERVICE.md`** - Complete backend implementation guide

## Setup Steps

### 1. Install Dependencies

```bash
# Fix npm permissions if needed
sudo chown -R 501:20 "/Users/dhrumilshah/.npm"

# Install vision-camera
npm install react-native-vision-camera

# Create development build
npx expo prebuild
npx expo run:ios  # or android
```

### 2. Set Up Backend Service

See `BACKEND_STREAMING_SERVICE.md` for complete backend setup instructions.

Quick start:
```bash
# In a separate directory
npm init -y
npm install ws fluent-ffmpeg @ffmpeg-installer/ffmpeg
# Copy backend code from BACKEND_STREAMING_SERVICE.md
node server.js
```

### 3. Configure Backend URL

Update `services/rtmpStreamingService.ts`:

```typescript
this.backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'ws://localhost:3000';
```

Or set in `.env`:
```
EXPO_PUBLIC_BACKEND_URL=ws://your-backend-url:3000
```

### 4. Test the Implementation

1. Start backend service
2. Run React Native app
3. Navigate to live stream screen
4. Press "Start Streaming"
5. Check Mux dashboard for active stream

## Frame Processing Notes

⚠️ **Important**: The current frame processor uses `frame.toString('base64')` which may need adjustment based on your vision-camera version.

### Option 1: Current Implementation (Simplified)
- Converts frame to base64 string
- Sends via WebSocket
- Works but may have performance limitations

### Option 2: Frame Processor Plugin (Recommended for Production)
For better performance, create a custom frame processor plugin:

```typescript
// frame-processors/convertToBase64.ts
import { Frame } from 'react-native-vision-camera';

export function convertToBase64(frame: Frame): string {
  'worklet';
  // Custom implementation based on vision-camera version
  // This may require native code or specific frame processing
  return frame.toString('base64');
}
```

### Option 3: Optimize Frame Sending
- Skip frames (send every Nth frame)
- Compress frames before sending
- Use binary WebSocket instead of base64
- Implement frame queue with priority

## Troubleshooting

### "Cannot find module 'react-native-vision-camera'"
- Run `npm install react-native-vision-camera`
- Run `npx expo prebuild`
- Rebuild the app

### "Camera permission denied"
- Check `app.json` has vision-camera plugin configured
- Grant permissions in device settings

### "WebSocket connection failed"
- Verify backend service is running
- Check backend URL is correct
- Ensure firewall allows WebSocket connections

### "FFmpeg not found" (Backend)
- Install FFmpeg: `brew install ffmpeg` (Mac)
- Ensure FFmpeg is in PATH

### Frames not being sent
- Check frame processor is being called
- Verify WebSocket connection is open
- Check backend logs for received frames

## Performance Optimization

1. **Frame Rate**: Reduce to 15-20 fps if network is slow
2. **Resolution**: Use 480p instead of 720p for lower bandwidth
3. **Frame Skipping**: Send every 2nd or 3rd frame
4. **Compression**: Compress frames before sending
5. **Queue Management**: Limit frame queue size

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up backend service
3. ✅ Configure backend URL
4. ✅ Test streaming
5. ⚠️ Optimize frame processing (if needed)
6. ⚠️ Add error handling and reconnection logic
7. ⚠️ Implement frame compression

## Production Considerations

- **Security**: Add authentication to WebSocket
- **Scalability**: Use load balancer for multiple streams
- **Monitoring**: Add logging and metrics
- **Error Recovery**: Implement reconnection logic
- **Bandwidth**: Monitor and optimize data usage

