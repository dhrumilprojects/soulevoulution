import Constants from 'expo-constants';

type MuxConfig = {
  accessTokenId: string;
  secretKey: string;
  apiBaseUrl: string;
};

const extra = (Constants.expoConfig as any)?.extra || {};

export const muxConfig: MuxConfig = {
  accessTokenId: extra.MUX_ACCESS_TOKEN_ID || '',
  secretKey: extra.MUX_SECRET_KEY || '',
  apiBaseUrl: 'https://api.mux.com/v1',
};

export interface LiveStream {
  id: string;
  stream_key: string;
  status: 'idle' | 'active' | 'disconnected';
  reconnect_window?: number;
  new_asset_settings?: {
    playback_policy: string[];
  };
  playback_ids?: Array<{
    id: string;
    policy: string;
  }>;
  created_at?: string;
}

export interface CreateLiveStreamResponse {
  data: LiveStream;
}

class MuxService {
  private base64Encode(str: string): string {
    // React Native compatible base64 encoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;
    
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  }

  private getAuthHeader(): string {
    const credentials = `${muxConfig.accessTokenId}:${muxConfig.secretKey}`;
    const base64 = this.base64Encode(credentials);
    return `Basic ${base64}`;
  }

  async createLiveStream(eventName: string): Promise<{ success: boolean; liveStream?: LiveStream; error?: string }> {
    try {
      if (!muxConfig.accessTokenId || !muxConfig.secretKey) {
        return { success: false, error: 'Mux is not configured. Please add MUX_ACCESS_TOKEN_ID and MUX_SECRET_KEY to app.json' };
      }

      const response = await fetch(`${muxConfig.apiBaseUrl}/video/v1/live-streams`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playback_policy: ['public'],
          new_asset_settings: {
            playback_policy: ['public'],
          },
          reconnect_window: 60,
          reconnect_slate_url: undefined,
          reduced_latency: true,
          latency_mode: 'low',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mux API error: ${response.status} - ${errorText}`);
      }

      const data: CreateLiveStreamResponse = await response.json();
      
      return {
        success: true,
        liveStream: data.data,
      };
    } catch (error) {
      console.error('Error creating Mux live stream:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create live stream',
      };
    }
  }

  async getLiveStream(streamId: string): Promise<{ success: boolean; liveStream?: LiveStream; error?: string }> {
    try {
      if (!muxConfig.accessTokenId || !muxConfig.secretKey) {
        return { success: false, error: 'Mux is not configured' };
      }

      const response = await fetch(`${muxConfig.apiBaseUrl}/video/v1/live-streams/${streamId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mux API error: ${response.status} - ${errorText}`);
      }

      const data: CreateLiveStreamResponse = await response.json();
      
      return {
        success: true,
        liveStream: data.data,
      };
    } catch (error) {
      console.error('Error fetching Mux live stream:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live stream',
      };
    }
  }

  async deleteLiveStream(streamId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!muxConfig.accessTokenId || !muxConfig.secretKey) {
        return { success: false, error: 'Mux is not configured' };
      }

      const response = await fetch(`${muxConfig.apiBaseUrl}/video/v1/live-streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mux API error: ${response.status} - ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting Mux live stream:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete live stream',
      };
    }
  }
}

const muxService = new MuxService();
export default muxService;

