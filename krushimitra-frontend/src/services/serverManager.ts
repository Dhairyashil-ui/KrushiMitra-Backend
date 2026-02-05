/**
 * Unified Server Manager
 * Central configuration for ALL services (Ollama, Whisper, TTS, Backend)
 * Automatically discovers servers and manages connections
 */

import { discoverServerCached, clearDiscoveryCache } from './serverDiscovery';

export interface ServerEndpoint {
  url: string;
  type: 'discovered' | 'configured' | 'cloud';
  available: boolean;
  lastChecked?: number;
}

export interface ServerConfig {
  ollama: ServerEndpoint | null;
  whisper: ServerEndpoint | null;
  tts: ServerEndpoint | null;
  backend: ServerEndpoint | null;
}

/**
 * Server Manager - Singleton instance
 */
class ServerManager {
  private config: ServerConfig = {
    ollama: null,
    whisper: null,
    tts: null,
    backend: null
  };

  private initPromise: Promise<void> | null = null;
  private isInitialized = false;
  private isDiscovering = false; // Global lock to prevent discovery storms
  private isRefreshing = false; // Prevent overlapping refresh cycles
  private lastDiscoveryTime = 0; // Track last discovery timestamp
  private offlineStartTime: number | null = null; // Track when offline period began
  private onlineStableTimer: any = null; // Timer to verify stable online period
  private stableCached: {
    backendUrl?: string;
    ollamaUrl?: string;
    whisperUrl?: string;
    ttsUrl?: string;
  } = {}; // Holds first discovered endpoints to prevent flip-flop

  /**
   * Initialize server discovery
   */
  async initialize(): Promise<void> {
    // Return existing initialization promise if already running
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized with valid servers
    if (this.isInitialized && this.hasValidServers()) {
      // Keep stable cached endpoints updated once
      this.cacheStableValues();
      return Promise.resolve();
    }

    // Prevent discovery if already in progress
    if (this.isDiscovering) {
      console.log('⏸️ Discovery already in progress, skipping...');
      return Promise.resolve();
    }

    this.initPromise = this.discoverAllServers();
    
    try {
      await this.initPromise;
      this.isInitialized = true;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * Check if we have valid discovered servers
   */
  private hasValidServers(): boolean {
    return !!(this.config.backend?.url || this.config.ollama?.url);
  }

  private cacheStableValues(): void {
    if (!this.stableCached.backendUrl && this.config.backend?.url) {
      this.stableCached.backendUrl = this.config.backend.url;
      this.stableCached.ttsUrl = this.config.backend.url + '/tts';
    }
    if (!this.stableCached.ollamaUrl && this.config.ollama?.url) {
      this.stableCached.ollamaUrl = this.config.ollama.url + '/api/generate';
    }
    if (!this.stableCached.whisperUrl && this.config.whisper?.url) {
      this.stableCached.whisperUrl = this.config.whisper.url + '/transcribe';
    }
  }

  /**
   * Discover all servers in parallel
   */
  private async discoverAllServers(): Promise<void> {
    // Set discovery lock
    this.isDiscovering = true;
    this.lastDiscoveryTime = Date.now();
    
    console.debug('[ServerManager] Discovering servers (initial/forced)');

    try {
      const [ollamaServer, backendServer] = await Promise.all([
        this.discoverOllama(),
        this.discoverBackend()
      ]);

    // Whisper and TTS run on same backend server
    if (backendServer) {
      this.config.whisper = {
        url: backendServer.url.replace(':3001', ':5001'),
        type: 'discovered',
        available: false, // Will check separately if needed
        lastChecked: Date.now()
      };
      
      this.config.tts = backendServer;
    }

      this.cacheStableValues();
      console.debug('[ServerManager] Discovery complete', {
        ollama: this.config.ollama?.url || 'not found',
        backend: this.config.backend?.url || 'not found'
      });
    } finally {
      // Release discovery lock
      this.isDiscovering = false;
    }
  }

  /**
   * Discover Ollama server
   */
  private async discoverOllama(): Promise<ServerEndpoint | null> {
    // Check environment variable first for mobile/production use
    const envUrl = process.env.EXPO_PUBLIC_OLLAMA_SERVER;
    
    if (envUrl && !envUrl.includes('localhost')) {
      // User has configured a specific URL (e.g., ngrok tunnel for mobile access)
      const endpoint = {
        url: envUrl,
        type: 'configured' as const,
        available: true,
        lastChecked: Date.now()
      };
      
      this.config.ollama = endpoint;
      console.debug('[ServerManager] Using configured Ollama (mobile-ready)', endpoint.url);
      return endpoint;
    }
    
    try {
      // Try auto-discovery for local development
      const discovered = await discoverServerCached('ollama');
      
      if (discovered && discovered.reachable) {
        const endpoint = {
          url: `http://${discovered.ip}:${discovered.port}`,
          type: 'discovered' as const,
          available: true,
          lastChecked: Date.now()
        };
        
        this.config.ollama = endpoint;
        console.debug('[ServerManager] Ollama discovered', endpoint.url);
        return endpoint;
      }
    } catch (error) {
      console.debug('[ServerManager] Ollama discovery failed', error);
    }

    // Fallback to localhost only if configured
    if (envUrl) {
      const endpoint = {
        url: envUrl,
        type: 'configured' as const,
        available: false,
        lastChecked: Date.now()
      };
      
      this.config.ollama = endpoint;
      console.debug('[ServerManager] Using localhost Ollama (desktop only)', endpoint.url);
      return endpoint;
    }

    console.debug('[ServerManager] Ollama not available - will use cloud LLM fallback');
    this.config.ollama = null;
    return null;
  }

  /**
   * Discover backend server
   */
  private async discoverBackend(): Promise<ServerEndpoint | null> {
    // Check environment variables first for mobile/production use
    const overrideUrl = process.env.EXPO_PUBLIC_BACKEND_OVERRIDE;
    const envUrl = overrideUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
    
    if (envUrl && !envUrl.includes('localhost')) {
      // User has configured a specific URL (e.g., ngrok, cloud, or LAN IP)
      const endpoint = {
        url: envUrl,
        type: 'configured' as const,
        available: true,
        lastChecked: Date.now()
      };
      
      this.config.backend = endpoint;
      this.config.tts = endpoint;
      console.debug('[ServerManager] Using configured backend (mobile-ready)', endpoint.url);
      return endpoint;
    }
    
    try {
      // Try auto-discovery for local development
      const discovered = await discoverServerCached('backend');
      
      if (discovered && discovered.reachable) {
        const endpoint = {
          url: `http://${discovered.ip}:${discovered.port}`,
          type: 'discovered' as const,
          available: true,
          lastChecked: Date.now()
        };
        
        this.config.backend = endpoint;
        this.config.tts = endpoint; // TTS runs on same server
        console.debug('[ServerManager] Backend discovered', endpoint.url);
        return endpoint;
      }
    } catch (error) {
      console.debug('[ServerManager] Backend discovery failed', error);
    }

    // Fallback to localhost only if no other option
    if (envUrl) {
      const endpoint = {
        url: envUrl,
        type: 'configured' as const,
        available: false,
        lastChecked: Date.now()
      };
      
      this.config.backend = endpoint;
      this.config.tts = endpoint;
      console.debug('[ServerManager] Using localhost backend (desktop only)', endpoint.url);
      return endpoint;
    }

    console.warn('[ServerManager] Backend not available - set EXPO_PUBLIC_BACKEND_URL for mobile');
    this.config.backend = null;
    return null;
  }

  /**
   * Get Ollama endpoint URL
   */
  getOllamaEndpoint(): string | null {
    if (this.stableCached.ollamaUrl) return this.stableCached.ollamaUrl;
    if (!this.config.ollama) return null;
    
    // If URL already includes /api/generate (e.g., cloudflare tunnel), don't append it
    const baseUrl = this.config.ollama.url;
    if (baseUrl.includes('/api/generate')) {
      return baseUrl;
    }
    
    return `${baseUrl}/api/generate`;
  }

  /**
   * Get Whisper endpoint URL
   */
  getWhisperEndpoint(): string | null {
    if (this.stableCached.whisperUrl) return this.stableCached.whisperUrl;
    if (!this.config.whisper) return null;
    return `${this.config.whisper.url}/transcribe`;
  }

  /**
   * Get TTS endpoint URL
   */
  getTTSEndpoint(): string | null {
    if (this.stableCached.ttsUrl) return this.stableCached.ttsUrl;
    if (!this.config.tts) return null;
    return `${this.config.tts.url}/tts`;
  }

  /**
   * Get backend endpoint URL
   */
  getBackendEndpoint(): string | null {
    if (this.stableCached.backendUrl) return this.stableCached.backendUrl;
    if (!this.config.backend) return null;
    return this.config.backend.url;
  }

  /**
   * Check if a service is available
   */
  isServiceAvailable(service: 'ollama' | 'whisper' | 'tts' | 'backend'): boolean {
    const endpoint = this.config[service];
    return endpoint !== null && endpoint.available !== false;
  }

  /**
   * Refresh server discovery (call when network changes)
   */
  async refresh(force: boolean = false, reason: string = 'network-change'): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    try {
      const elapsed = Date.now() - this.lastDiscoveryTime;
      // Prevent frequent refresh unless forced or servers invalid
      if (!force && elapsed < 10000) return;
      if (!force && this.hasValidServers()) return;
      clearDiscoveryCache();
      this.isInitialized = false;
      await this.initialize();
      console.debug(`[ServerManager] Configuration refreshed (${reason})`);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ServerConfig {
    return { ...this.config };
  }

  /**
   * Manually set a server endpoint (for testing or override)
   */
  setEndpoint(service: 'ollama' | 'whisper' | 'tts' | 'backend', url: string): void {
    this.config[service] = {
      url,
      type: 'configured',
      available: true,
      lastChecked: Date.now()
    };
    console.debug(`[ServerManager] Manually set ${service} -> ${url}`);
  }

  /**
   * Called when network transitions offline->online.
   * Waits for stable connectivity (>10s) before forcing discovery refresh.
   */
  public handleOfflineToOnline(): void {
    this.offlineStartTime = this.offlineStartTime || Date.now();
    if (this.onlineStableTimer) {
      clearTimeout(this.onlineStableTimer);
    }
    this.onlineStableTimer = setTimeout(() => {
      // Only force refresh if still online & offline period was >=10s
      const offlineDuration = this.offlineStartTime ? Date.now() - this.offlineStartTime : 0;
      if (offlineDuration >= 10000) {
        this.refresh(true, 'offline-to-online-stable');
      }
      this.offlineStartTime = null; // reset after handling
    }, 10000); // 10s stability window
  }
}

// Export singleton instance
export const serverManager = new ServerManager();

/**
 * Get server configuration (convenience function for components)
 * @returns Object with all server URLs
 */
export function getServerConfig(): { backendUrl: string; ollamaUrl: string; whisperUrl: string; ttsUrl: string } {
  const backend = serverManager.getBackendEndpoint() || 'http://localhost:3001';
  const ollama = serverManager.getOllamaEndpoint() || 'http://localhost:11434/api/generate';
  const whisper = serverManager.getWhisperEndpoint() || 'http://localhost:5001/transcribe';
  const tts = serverManager.getTTSEndpoint() || backend + '/tts';
  return { backendUrl: backend, ollamaUrl: ollama, whisperUrl: whisper, ttsUrl: tts };
}

// Auto-initialize on import
serverManager.initialize().catch(error => {
  console.error('[ServerManager] Failed to initialize:', error);
});
