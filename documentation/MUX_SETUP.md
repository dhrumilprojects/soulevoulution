# Mux Live Streaming Setup

## Overview
This app integrates Mux live streaming to enable prayer event broadcasts. When an approved event is within the 2-hour live window, users can start a live stream from their camera.

## Setup Instructions

### 1. Install Required Packages

```bash
npx expo install expo-camera
```

### 2. Get Mux Credentials

1. Sign up for a Mux account at [mux.com](https://www.mux.com)
2. Navigate to Settings > API Access Tokens
3. Create a new access token with the following permissions:
   - `video:read`
   - `video:write`
4. Copy your **Access Token ID** and **Secret Key**

### 3. Configure Mux in app.json

Update the `extra` section in `app.json` with your Mux credentials:

```json
"extra": {
  "CLOUDINARY_CLOUD_NAME": "dpomxki5z",
  "CLOUDINARY_UPLOAD_PRESET": "soulevolution",
  "MUX_ACCESS_TOKEN_ID": "YOUR_ACTUAL_ACCESS_TOKEN_ID",
  "MUX_SECRET_KEY": "YOUR_ACTUAL_SECRET_KEY"
}
```

### 4. Rebuild the App

After adding the credentials, rebuild your app:

```bash
# For iOS
npx expo prebuild --clean
npx expo run:ios

# For Android
npx expo prebuild --clean
npx expo run:android
```

## How It Works

### Flow
1. User clicks "Go Live" button on an approved prayer event
2. App requests camera permission
3. Mux live stream is created via API
4. Camera view opens with streaming controls
5. User can start/stop the stream
6. Stream is available at Mux playback URL

### Features
- **Camera Access**: Uses expo-camera for device camera
- **Mux Integration**: Creates live streams via Mux API
- **RTMP Streaming**: Provides RTMP URL for streaming (requires RTMP streaming library for actual broadcast)
- **Stream Management**: Create, monitor, and delete live streams

## Files Created/Modified

1. **`services/muxService.ts`**: Mux API service for creating and managing live streams
2. **`app/live-stream.tsx`**: Live streaming screen with camera view
3. **`app/view-prayer.tsx`**: Updated Go Live button to navigate to live stream screen
4. **`app.json`**: Added Mux configuration and camera plugin

## Next Steps for Full RTMP Streaming

Currently, the app creates the Mux live stream and provides the RTMP URL. To enable actual RTMP streaming from the device, you'll need to:

1. Install an RTMP streaming library (e.g., `react-native-livestream` or similar)
2. Integrate it with the camera feed
3. Stream to the RTMP URL: `rtmp://live.mux.com/app/{stream_key}`

Alternatively, you can use Mux's WebRTC integration for browser-based streaming.

## API Endpoints Used

- `POST /video/v1/live-streams` - Create a new live stream
- `GET /video/v1/live-streams/{id}` - Get stream details
- `DELETE /video/v1/live-streams/{id}` - Delete/end a stream

## Testing

1. Ensure your event is approved and within the 2-hour live window
2. Click "Go Live" button
3. Grant camera permissions
4. Verify the stream is created in your Mux dashboard
5. Check the RTMP URL is displayed correctly

## Troubleshooting

- **"Mux is not configured"**: Check that credentials are correctly set in app.json
- **Camera permission denied**: Ensure expo-camera plugin is configured in app.json
- **Stream creation fails**: Verify your Mux credentials have the correct permissions
- **RTMP URL not working**: The URL is for RTMP ingest, not playback. Use the playback_id for viewing

## Security Notes

- Never commit Mux credentials to version control
- Use environment variables or secure storage for production
- Consider using a backend proxy for Mux API calls in production




