/**
 * Server Auto-Discovery Service
 * Automatically finds local servers without hardcoded IPs
 */

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Global lock to prevent concurrent discovery storms
let isDiscovering = false;

export interface DiscoveredServer {
  ip: string;
  port: number;
  service: 'ollama' | 'backend' | 'tts';
  reachable: boolean;
  latency: number;
}

/**
 * Get current device's local IP address
 */
export async function getLocalIP(): Promise<string | null> {
  try {
    const state = await NetInfo.fetch();
    
    if (Platform.OS === 'web') {
      // For web, we can't get local IP directly, use localhost
      return 'localhost';
    }
    
    // Get IP from network details
    if (state.details && 'ipAddress' in state.details) {
      return state.details.ipAddress as string;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting local IP:', error);
    return null;
  }
}

/**
 * Generate likely IP addresses based on device's IP
 */
function generateLikelyIPs(deviceIP: string): string[] {
  const ips: string[] = [];
  
  // Add localhost
  ips.push('localhost', '127.0.0.1');
  
  if (!deviceIP || deviceIP === 'localhost') {
    // Add common router IPs
    ips.push('192.168.1.1', '192.168.0.1', '10.0.0.1');
    return ips;
  }
  
  // Parse device IP to find subnet
  const parts = deviceIP.split('.');
  if (parts.length === 4) {
    const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
    
    // Scan common host IPs in same subnet
    for (let i = 1; i <= 254; i++) {
      // Skip device's own IP
      if (i.toString() !== parts[3]) {
        ips.push(`${subnet}.${i}`);
      }
    }
  }
  
  return ips;
}

/**
 * Check if a server is reachable at given IP and port
 */
async function checkServer(
  ip: string,
  port: number,
  path: string = '/health',
  timeout: number = 2000
): Promise<{ reachable: boolean; latency: number }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`http://${ip}:${port}${path}`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    return {
      reachable: response.ok,
      latency
    };
  } catch (error) {
    return {
      reachable: false,
      latency: Date.now() - startTime
    };
  }
}

/**
 * Discover Ollama server on local network
 */
export async function discoverOllamaServer(): Promise<DiscoveredServer | null> {
  if (isDiscovering) {
    return null;
  }
  isDiscovering = true;
  console.debug('[Discovery] Starting Ollama scan');
  
  // Get device's local IP
  const deviceIP = await getLocalIP();
  console.debug('[Discovery] Device IP:', deviceIP);
  
  // Generate likely IPs to check
  const likelyIPs = generateLikelyIPs(deviceIP || 'localhost');
  console.debug('[Discovery] Candidate IP count:', likelyIPs.length);
  
  // Check Ollama on port 11434
  const ollamaPort = 11434;
  
  // Quick check on most likely IPs first
  const priorityIPs = ['localhost', '127.0.0.1'];
  if (deviceIP) {
    const parts = deviceIP.split('.');
    if (parts.length === 4) {
      // Add gateway (usually .1)
      priorityIPs.push(`${parts[0]}.${parts[1]}.${parts[2]}.1`);
    }
  }
  
  // Check priority IPs first
  for (const ip of priorityIPs) {
    const result = await checkServer(ip, ollamaPort, '/api/tags', 3000);
    if (result.reachable) {
      console.debug(`[Discovery] Ollama found @ ${ip}:${ollamaPort} (${result.latency}ms)`);
      isDiscovering = false;
      return {
        ip,
        port: ollamaPort,
        service: 'ollama',
        reachable: true,
        latency: result.latency
      };
    }
  }
  
  // If not found in priority, scan remaining IPs (in parallel batches)
  const batchSize = 10;
  const remainingIPs = likelyIPs.filter(ip => !priorityIPs.includes(ip));
  
  for (let i = 0; i < remainingIPs.length; i += batchSize) {
    const batch = remainingIPs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(ip => checkServer(ip, ollamaPort, '/api/tags', 1500))
    );
    
    const foundIndex = results.findIndex(r => r.reachable);
    if (foundIndex !== -1) {
      const ip = batch[foundIndex];
      console.debug(`[Discovery] Ollama found @ ${ip}:${ollamaPort} (${results[foundIndex].latency}ms)`);
      isDiscovering = false;
      return {
        ip,
        port: ollamaPort,
        service: 'ollama',
        reachable: true,
        latency: results[foundIndex].latency
      };
    }
  }
  isDiscovering = false;
  console.debug('[Discovery] Ollama not found');
  return null;
}

/**
 * Discover backend server on local network
 */
export async function discoverBackendServer(): Promise<DiscoveredServer | null> {
  if (isDiscovering) {
    return null;
  }
  isDiscovering = true;
  console.debug('[Discovery] Starting backend scan');
  
  const deviceIP = await getLocalIP();
  const backendPort = 3001;
  
  // Priority IPs for backend
  const priorityIPs = ['localhost', '127.0.0.1'];
  if (deviceIP) {
    const parts = deviceIP.split('.');
    if (parts.length === 4) {
      priorityIPs.push(`${parts[0]}.${parts[1]}.${parts[2]}.1`);
    }
  }
  
  for (const ip of priorityIPs) {
    const result = await checkServer(ip, backendPort, '/health', 2000);
    if (result.reachable) {
      console.debug(`[Discovery] Backend found @ ${ip}:${backendPort} (${result.latency}ms)`);
      isDiscovering = false;
      return {
        ip,
        port: backendPort,
        service: 'backend',
        reachable: true,
        latency: result.latency
      };
    }
  }
  isDiscovering = false;
  console.debug('[Discovery] Backend not found');
  return null;
}

/**
 * Cache discovered servers to avoid repeated scans
 */
const discoveryCache = new Map<string, { server: DiscoveredServer; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function discoverServerCached(
  service: 'ollama' | 'backend'
): Promise<DiscoveredServer | null> {
  const cacheKey = service;
  const cached = discoveryCache.get(cacheKey);
  
  // Return cached if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.debug(`[Discovery] Using cached ${service} @ ${cached.server.ip}`);
    return cached.server;
  }
  
  // Discover new
  const server = service === 'ollama' 
    ? await discoverOllamaServer()
    : await discoverBackendServer();
  
  // Cache if found
  if (server) {
    discoveryCache.set(cacheKey, {
      server,
      timestamp: Date.now()
    });
  }
  
  return server;
}

/**
 * Clear discovery cache (call when network changes)
 */
export function clearDiscoveryCache() {
  discoveryCache.clear();
  console.debug('[Discovery] Cache cleared');
}
