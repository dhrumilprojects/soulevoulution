# Backend RTMP Streaming Service

This document describes how to set up a backend service that receives video frames from the React Native app and streams them to RTMP (Mux).

## Architecture

```
React Native App (Vision Camera)
    ↓ (WebSocket - Base64 frames)
Backend Service (Node.js/Python/etc)
    ↓ (FFmpeg - H.264 encoding)
RTMP Server (Mux: rtmp://live.mux.com/app/{stream_key})
```

## Backend Service Requirements

The backend service needs to:

1. **Receive frames** via WebSocket from the React Native app
2. **Decode base64** frames to image data
3. **Encode to H.264** video stream
4. **Stream to RTMP** URL (Mux)

## Node.js Example Implementation

### 1. Install Dependencies

```bash
npm init -y
npm install ws fluent-ffmpeg @ffmpeg-installer/ffmpeg
```

### 2. Create Backend Service (`server.js`)

```javascript
const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const wss = new WebSocket.Server({ port: 3000 });

let ffmpegProcess = null;
let streamConfig = null;

wss.on('connection', (ws) => {
  console.log('✅ Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'config') {
        // Initialize stream configuration
        streamConfig = data.config;
        console.log('📹 Stream config received:', streamConfig);

        // Start FFmpeg process to stream to RTMP
        startFFmpegStream(streamConfig);
      } else if (data.type === 'frame') {
        // Receive and process frame
        if (ffmpegProcess && ffmpegProcess.stdin) {
          // Decode base64 and write to FFmpeg
          const frameBuffer = Buffer.from(data.data, 'base64');
          ffmpegProcess.stdin.write(frameBuffer);
        }
      } else if (data.type === 'stop') {
        // Stop streaming
        stopFFmpegStream();
        ws.close();
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    stopFFmpegStream();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function startFFmpegStream(config) {
  if (ffmpegProcess) {
    console.log('⚠️ Stream already running');
    return;
  }

  console.log('🚀 Starting FFmpeg stream to:', config.rtmpUrl);

  // FFmpeg command to:
  // 1. Read raw frames from stdin (RGB24 format)
  // 2. Encode to H.264
  // 3. Stream to RTMP
  ffmpegProcess = ffmpeg()
    .input('pipe:0')
    .inputFormat('rawvideo')
    .inputOptions([
      `-pixel_format rgb24`,
      `-video_size ${config.width}x${config.height}`,
      `-framerate ${config.fps}`,
    ])
    .videoCodec('libx264')
    .outputOptions([
      `-preset ultrafast`,
      `-tune zerolatency`,
      `-b:v ${config.bitrate}`,
      `-f flv`,
    ])
    .output(config.rtmpUrl)
    .on('start', (commandLine) => {
      console.log('FFmpeg started:', commandLine);
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      stopFFmpegStream();
    })
    .on('end', () => {
      console.log('FFmpeg stream ended');
    });

  ffmpegProcess.run();
}

function stopFFmpegStream() {
  if (ffmpegProcess) {
    console.log('🛑 Stopping FFmpeg stream');
    ffmpegProcess.kill('SIGTERM');
    ffmpegProcess = null;
  }
}

console.log('🎥 Backend streaming service started on ws://localhost:3000');
```

### 3. Run the Service

```bash
node server.js
```

## Python Example Implementation

### 1. Install Dependencies

```bash
pip install websockets opencv-python numpy subprocess
```

### 2. Create Backend Service (`server.py`)

```python
import asyncio
import websockets
import json
import subprocess
import base64
import cv2
import numpy as np

ffmpeg_process = None
stream_config = None

async def handle_client(websocket, path):
    global ffmpeg_process, stream_config
    
    print("✅ Client connected")
    
    try:
        async for message in websocket:
            data = json.loads(message)
            
            if data['type'] == 'config':
                stream_config = data['config']
                print(f"📹 Stream config received: {stream_config}")
                start_ffmpeg_stream(stream_config)
                
            elif data['type'] == 'frame':
                if ffmpeg_process and ffmpeg_process.stdin:
                    # Decode base64 frame
                    frame_data = base64.b64decode(data['data'])
                    # Write to FFmpeg stdin
                    ffmpeg_process.stdin.write(frame_data)
                    
            elif data['type'] == 'stop':
                stop_ffmpeg_stream()
                break
                
    except websockets.exceptions.ConnectionClosed:
        print("🔌 Client disconnected")
        stop_ffmpeg_stream()

def start_ffmpeg_stream(config):
    global ffmpeg_process
    
    if ffmpeg_process:
        print("⚠️ Stream already running")
        return
    
    rtmp_url = config['rtmpUrl']
    width = config['width']
    height = config['height']
    fps = config['fps']
    bitrate = config['bitrate']
    
    print(f"🚀 Starting FFmpeg stream to: {rtmp_url}")
    
    # FFmpeg command
    cmd = [
        'ffmpeg',
        '-f', 'rawvideo',
        '-pixel_format', 'rgb24',
        '-video_size', f'{width}x{height}',
        '-framerate', str(fps),
        '-i', 'pipe:0',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-b:v', str(bitrate),
        '-f', 'flv',
        rtmp_url
    ]
    
    ffmpeg_process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

def stop_ffmpeg_stream():
    global ffmpeg_process
    
    if ffmpeg_process:
        print("🛑 Stopping FFmpeg stream")
        ffmpeg_process.terminate()
        ffmpeg_process.wait()
        ffmpeg_process = None

# Start WebSocket server
start_server = websockets.serve(handle_client, "localhost", 3000)

print("🎥 Backend streaming service started on ws://localhost:3000")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

## Configuration

### Update Backend URL in React Native App

Set the backend URL in your `.env` file or `app.json`:

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_BACKEND_URL": "ws://your-backend-url:3000"
    }
  }
}
```

Or update `services/rtmpStreamingService.ts`:

```typescript
this.backendUrl = 'ws://your-backend-url:3000';
```

## Deployment Options

### Option 1: Local Development (ngrok)

1. Run backend service locally
2. Use ngrok to expose it:
   ```bash
   ngrok http 3000
   ```
3. Use ngrok URL in app: `ws://your-ngrok-url.ngrok.io`

### Option 2: Cloud Deployment

Deploy to:
- **Heroku**: Easy Node.js deployment
- **AWS EC2**: Full control
- **Google Cloud Run**: Serverless
- **Railway**: Simple deployment

### Option 3: Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Testing

1. Start backend service
2. Run React Native app
3. Start streaming
4. Check Mux dashboard for active stream

## Troubleshooting

### FFmpeg not found
- Install FFmpeg: `brew install ffmpeg` (Mac) or `apt-get install ffmpeg` (Linux)
- Ensure FFmpeg is in PATH

### Connection refused
- Check backend URL is correct
- Ensure backend is running
- Check firewall/network settings

### Stream not appearing on Mux
- Verify RTMP URL is correct
- Check FFmpeg logs for errors
- Ensure frames are being received

## Performance Optimization

1. **Frame Rate**: Adjust based on network (15-30 fps)
2. **Resolution**: Lower resolution = less bandwidth (720p recommended)
3. **Bitrate**: Adjust based on network (1-3 Mbps)
4. **Queue Management**: Backend should handle frame queue efficiently

## Security Considerations

1. **Authentication**: Add authentication to WebSocket connection
2. **Rate Limiting**: Prevent abuse
3. **Input Validation**: Validate all incoming data
4. **HTTPS/WSS**: Use secure connections in production

