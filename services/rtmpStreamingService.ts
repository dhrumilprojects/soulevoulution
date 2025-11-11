/**
 * RTMP Streaming Service
 * 
 * This service handles communication with a backend service that receives
 * video frames and streams them to RTMP (e.g., Mux).
 * 
 * The backend service should:
 * 1. Receive video frames via WebSocket or HTTP
 * 2. Encode frames to H.264
 * 3. Stream to RTMP URL (rtmp://live.mux.com/app/{stream_key})
 */

interface StreamConfig {
  rtmpUrl: string;
  width: number;
  height: number;
  bitrate: number;
  fps: number;
  audioSampleRate?: number;
  audioChannels?: number;
}

class RTMPStreamingService {
  private isStreamingActive = false;
  private streamConfig: StreamConfig | null = null;
  private ws: WebSocket | null = null;
  private backendUrl: string;
  private frameQueue: string[] = [];
  private isProcessingQueue = false;
  private maxQueueSize = 10; // Limit queue to prevent memory issues

  constructor() {
    // Backend URL - update this to your backend service URL
    // For development, you can use ngrok or similar to expose local backend
    this.backendUrl = 'ws://192.168.1.4:3000';
  }

  /**
   * Start streaming to RTMP via backend
   */
  async startStream(
    rtmpUrl: string,
    width: number = 1280,
    height: number = 720,
    bitrate: number = 2500000,
    fps: number = 30
  ): Promise<boolean> {
    try {
      if (this.isStreamingActive) {
        console.warn('Stream is already active');
        return false;
      }

      this.streamConfig = {
        rtmpUrl,
        width,
        height,
        bitrate,
        fps,
        audioSampleRate: 44100, // Standard audio sample rate
        audioChannels: 2, // Stereo
      };

      // Connect to backend WebSocket
      const wsUrl = this.backendUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        this.ws.onopen = () => {
          console.log('✅ Connected to backend streaming service');
          
          // Send stream configuration
          this.ws?.send(JSON.stringify({
            type: 'config',
            streamId: streamId,
            config: this.streamConfig,
          }));
        };

        // Wait for config acknowledgment
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'config_ack') {
              console.log('✅ Stream configured:', message.streamId);
              this.isStreamingActive = true;
              this.startProcessingQueue();
              resolve(true);
            } else if (message.type === 'error') {
              console.error('❌ Backend error:', message.message);
              this.isStreamingActive = false;
              reject(new Error(message.message));
            } else if (message.type === 'pong') {
              // Heartbeat response
            }
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isStreamingActive = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket closed');
          this.isStreamingActive = false;
          this.ws = null;
        };
      });
    } catch (error) {
      console.error('Failed to start RTMP stream:', error);
      this.isStreamingActive = false;
      return false;
    }
  }

  /**
   * Send a video frame to the backend
   */
  async sendVideoFrame(frameBase64: string): Promise<void> {
    await this.sendFrame('video', frameBase64);
  }

  /**
   * Send an audio frame to the backend
   */
  async sendAudioFrame(audioBase64: string, timestamp: number): Promise<void> {
    await this.sendFrame('audio', audioBase64, timestamp);
  }

  /**
   * Send a frame (video or audio) to the backend
   */
  private async sendFrame(type: 'video' | 'audio', dataBase64: string, timestamp?: number): Promise<void> {
    if (!this.isStreamingActive) {
      console.warn('⚠️ Cannot send frame: streaming not active');
      return;
    }
    
    if (!this.ws) {
      console.warn('⚠️ Cannot send frame: WebSocket not initialized');
      return;
    }
    
    if (this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`⚠️ Cannot send frame: WebSocket state is ${this.ws.readyState} (expected OPEN=1)`);
      return;
    }

    // Add to queue if processing
    if (this.isProcessingQueue) {
      if (this.frameQueue.length < this.maxQueueSize) {
        this.frameQueue.push(frameBase64);
      } else {
        console.warn('⚠️ Frame queue full, dropping frame');
      }
      return;
    }

    try {
      // Send frame directly if queue is empty
      this.ws.send(JSON.stringify({
        type: type === 'video' ? 'video_frame' : 'audio_frame',
        data: dataBase64,
        timestamp: timestamp || Date.now(),
      }));
    } catch (error) {
      console.error(`❌ Failed to send ${type} frame:`, error);
    }
  }

  /**
   * Process queued frames
   */
  private startProcessingQueue(): void {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    const processQueue = () => {
      if (!this.isStreamingActive || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.isProcessingQueue = false;
        return;
      }

      if (this.frameQueue.length > 0) {
        const frame = this.frameQueue.shift();
        if (frame) {
          try {
            this.ws.send(JSON.stringify({
              type: 'video_frame',
              data: frame,
              timestamp: Date.now(),
            }));
          } catch (error) {
            console.error('Failed to send queued frame:', error);
          }
        }
      }

      // Continue processing
      setTimeout(processQueue, 33); // ~30fps
    };

    processQueue();
  }

  /**
   * Stop streaming
   */
  async stopStream(): Promise<void> {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'stop' }));
        this.ws.close();
      }
      
      this.isStreamingActive = false;
      this.streamConfig = null;
      this.ws = null;
      this.frameQueue = [];
      this.isProcessingQueue = false;
      
      console.log('✅ Stopped RTMP stream');
    } catch (error) {
      console.error('Failed to stop RTMP stream:', error);
    }
  }

  /**
   * Check if currently streaming
   */
  getIsStreaming(): boolean {
    return this.isStreamingActive && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current stream configuration
   */
  getStreamConfig(): StreamConfig | null {
    return this.streamConfig;
  }
}

export default new RTMPStreamingService();

