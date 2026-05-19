# Expo Go Compatible Streaming

## Overview

I've created an Expo Go compatible version of the live streaming screen that uses `expo-camera` instead of `react-native-vision-camera`.

## Files

- **`app/live-stream.tsx`** - Production version using `react-native-vision-camera` (requires development build)
- **`app/live-stream-expo-go.tsx`** - Expo Go compatible version using `expo-camera`

## Differences

### Production Version (`live-stream.tsx`)
- ✅ Uses `react-native-vision-camera` with frame processor
- ✅ Real-time frame capture at 30 fps
- ✅ Smooth, efficient frame processing
- ✅ Lower battery usage
- ❌ Requires development build (doesn't work with Expo Go)

### Expo Go Version (`live-stream-expo-go.tsx`)
- ✅ Works with Expo Go
- ✅ Uses `expo-camera` (already installed)
- ⚠️ Limited to ~10 fps (using `takePictureAsync` in a loop)
- ⚠️ Higher battery usage
- ⚠️ Less smooth than production version

## How to Use Expo Go Version

### Option 1: Replace the file
```bash
# Backup the current file
mv app/live-stream.tsx app/live-stream-production.tsx

# Use Expo Go version
mv app/live-stream-expo-go.tsx app/live-stream.tsx
```

### Option 2: Update routing
If you want to keep both versions, update your routing to use the Expo Go version when needed.

## Limitations of Expo Go Version

1. **Frame Rate**: Maximum ~10-15 fps (vs 30 fps with vision-camera)
   - Uses `takePictureAsync` in a 100ms interval loop
   - Higher intervals = lower frame rate but better performance

2. **Battery Usage**: Higher due to continuous photo capture
   - Each frame capture is a full photo operation
   - Not optimized for streaming

3. **Performance**: May experience lag on older devices
   - Photo processing overhead
   - Memory usage from base64 encoding

4. **Quality**: Lower quality due to compression
   - Uses `quality: 0.7` for faster processing
   - May need adjustment based on network

## Configuration

The Expo Go version uses these settings:
- **Frame Rate**: 10 fps (100ms interval)
- **Quality**: 0.7 (70% quality)
- **Resolution**: 1280x720 (720p)

You can adjust these in `live-stream-expo-go.tsx`:

```typescript
// Change capture interval (lower = higher fps but more CPU)
const captureInterval = 100; // milliseconds (100ms = ~10 fps)

// Change photo quality
const photo = await cameraRef.current.takePictureAsync({
  quality: 0.7, // 0.0 to 1.0 (higher = better quality but slower)
  base64: true,
  skipProcessing: true,
});
```

## Recommendations

### For Development/Testing
- Use `live-stream-expo-go.tsx` with Expo Go for quick testing
- Good for verifying backend connection and stream setup

### For Production
- Use `live-stream.tsx` with `react-native-vision-camera`
- Create a development build: `npx expo prebuild && npx expo run:ios/android`
- Much better performance and user experience

## Testing

1. Start backend service:
   ```bash
   cd ../soulevolution-backend
   npm start
   ```

2. Update backend URL in `services/rtmpStreamingService.ts`:
   ```typescript
   this.backendUrl = 'ws://localhost:3000'; // or ngrok URL for device
   ```

3. Run with Expo Go:
   ```bash
   npx expo start
   # Scan QR code with Expo Go app
   ```

4. Navigate to live stream screen and test streaming

## Troubleshooting

### "takePictureAsync is not a function"
- Ensure `expo-camera` is installed: `npx expo install expo-camera`
- Check camera permissions are granted

### Low frame rate
- Reduce capture interval (but may cause performance issues)
- Lower photo quality
- Check device performance

### High battery usage
- This is expected with Expo Go version
- Consider using production version for better efficiency

### Connection errors
- Verify backend service is running
- Check WebSocket URL is correct
- Use ngrok for device testing if needed

## Next Steps

1. **For Expo Go**: Use `live-stream-expo-go.tsx` for testing
2. **For Production**: Switch to `live-stream.tsx` with development build
3. **Optimize**: Adjust frame rate and quality based on testing

## Notes

- The Expo Go version is a workaround and not ideal for production
- Frame capture via `takePictureAsync` is not designed for streaming
- For best results, use the production version with a development build

