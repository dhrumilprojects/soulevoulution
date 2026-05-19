# Web-Based Streaming Implementation

## Overview

The streaming implementation has been simplified to use a web-based approach. When users click "Go Live" in the mobile app, it opens a web page that handles camera streaming to Mux.

## Architecture

```
Mobile App (Go Live clicked)
  ↓
Generate streamingSessionId
  ↓
Store in Firebase: prayerEvents/{eventId}/streamingSessionId
  ↓
Open web app: /broadcast/{eventId}?session={streamingSessionId}
  ↓
Web App (BroadcastPage):
  - Gets camera/microphone access
  - Creates Mux live stream
  - Captures video frames from camera
  - Sends frames to backend via WebSocket
  - Backend streams to Mux RTMP
  - Updates Firebase with stream info
```

## Changes Made

### Mobile App (`soulevoulution`)

1. **Updated `app/view-prayer.tsx`**:
   - "Go Live" button now generates a streaming session ID
   - Stores session ID in Firebase
   - Opens web app URL in browser

2. **Updated `services/prayerEventService.ts`**:
   - Added `updateStreamingSession()` method

3. **Removed Files**:
   - `app/live-stream.tsx` (no longer needed)
   - `app/live-stream-expo-go.tsx` (no longer needed)
   - `services/rtmpStreamingService.ts` (no longer needed)

4. **Updated `app.json`**:
   - Removed `react-native-vision-camera` plugin
   - Removed `expo-camera` plugin (if not used elsewhere)

### Web App (`soulevolution-web`)

1. **Created `src/pages/BroadcastPage.tsx`**:
   - Camera access and preview
   - Mux stream creation
   - Video frame capture and streaming
   - WebSocket connection to backend

2. **Created `src/services/muxService.ts`**:
   - Mux API integration for web

3. **Updated `src/App.tsx`**:
   - Added `/broadcast/:eventId` route

## Configuration

### 1. Update Web App URL in Mobile App

In `app/view-prayer.tsx`, update the web app URL:

```typescript
// For development:
const webAppUrl = `http://localhost:5173/broadcast/${eventId}?session=${streamingSessionId}`;

// For production:
const webAppUrl = `https://your-web-app-domain.com/broadcast/${eventId}?session=${streamingSessionId}`;
```

### 2. Configure Backend URL in Web App

Create a `.env` file in `soulevolution-web/`:

```env
VITE_BACKEND_URL=ws://localhost:3000
VITE_MUX_ACCESS_TOKEN_ID=your_mux_token_id
VITE_MUX_SECRET_KEY=your_mux_secret_key
```

Or update `src/pages/BroadcastPage.tsx` and `src/services/muxService.ts` directly.

### 3. Start Backend Service

The backend service (`soulevolution-backend`) is still needed for RTMP streaming:

```bash
cd soulevolution-backend
npm start
```

## How It Works

1. **User clicks "Go Live"** in mobile app
2. **Mobile app**:
   - Generates unique `streamingSessionId`
   - Stores it in Firebase: `prayerEvents/{eventId}/streamingSessionId`
   - Opens web app URL with eventId and sessionId

3. **Web app** (`BroadcastPage`):
   - Verifies sessionId matches Firebase
   - Requests camera/microphone access
   - Creates Mux live stream
   - Updates Firebase with stream info
   - Connects to backend via WebSocket
   - Captures video frames (30 fps)
   - Sends frames to backend
   - Backend streams to Mux RTMP

4. **Viewers** can watch the stream on the web app using the playback ID

## Benefits

✅ **No native module issues** - Uses web browser APIs  
✅ **Works on any device** - Desktop, mobile, tablet  
✅ **Simpler implementation** - No complex native code  
✅ **Better audio/video quality** - Browser MediaRecorder API  
✅ **Easy to maintain** - Standard web technologies  

## Testing

1. Start backend service:
   ```bash
   cd soulevolution-backend
   npm start
   ```

2. Start web app:
   ```bash
   cd soulevolution-web
   npm run dev
   ```

3. In mobile app:
   - Navigate to an approved prayer event
   - Click "Go Live"
   - Browser should open with broadcast page
   - Allow camera/microphone access
   - Click "Start Streaming"

4. Check Mux dashboard for active stream

## Troubleshooting

### "Cannot open browser"
- Check web app URL is correct
- Ensure web app is running
- For mobile testing, use your computer's IP address: `http://192.168.1.4:5173`

### "Camera access denied"
- Allow camera/microphone in browser settings
- Check browser permissions

### "Failed to connect to streaming backend"
- Ensure backend service is running
- Check `VITE_BACKEND_URL` in web app
- Verify backend is accessible from your network

### "Invalid streaming session"
- Session ID must match between mobile app and web app
- Check Firebase for correct `streamingSessionId`

## Next Steps

1. Deploy web app to production (Vercel, Netlify, etc.)
2. Update mobile app with production web app URL
3. Deploy backend service (Heroku, AWS, etc.)
4. Update backend URL in web app environment variables

