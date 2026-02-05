/**
 * API Configuration - Environment-based with auto-discovery
 * Supports cloud, local, and hybrid modes
 */

export type Environment = 'development' | 'production' | 'hybrid';

export interface APIEndpoint {
  name: string;
  url: string;
  type: 'cloud' | 'local';
  priority: number;
  healthCheck?: string;
}

export interface APIConfig {
  environment: Environment;
  llm: {
    primary: APIEndpoint;
    fallback?: APIEndpoint;
  };
  tts: {
    primary: APIEndpoint;
    fallback?: APIEndpoint;
  };
  backend: {
    primary: APIEndpoint;
    fallback?: APIEndpoint;
  };
}

/**
 * Cloud-based LLM options (always accessible)
 * Choose one based on your preference
 */
const CLOUD_LLM_ENDPOINTS = {
  // Option 1: OpenRouter (supports Llama3 and many models)
  openrouter: {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    type: 'cloud' as const,
    priority: 1,
    healthCheck: 'https://openrouter.ai/api/v1/models'
  },
  
  // Option 2: Groq (free tier, very fast Llama3)
  groq: {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    type: 'cloud' as const,
    priority: 1,
    healthCheck: 'https://api.groq.com/openai/v1/models'
  },
  
  // Option 3: Together.ai (good free tier)
  together: {
    name: 'Together AI',
    url: 'https://api.together.xyz/v1/chat/completions',
    type: 'cloud' as const,
    priority: 1,
    healthCheck: 'https://api.together.xyz/v1/models'
  }
};

/**
 * Local Ollama detection
 * Will auto-discover or use fallback IPs
 */
const LOCAL_OLLAMA_ENDPOINTS = {
  localhost: {
    name: 'Ollama Local',
    url: 'http://localhost:11434/api/generate',
    type: 'local' as const,
    priority: 2,
    healthCheck: 'http://localhost:11434/api/tags'
  },
  autoDetect: {
    name: 'Ollama Auto-Detect',
    url: '', // Will be populated by auto-discovery
    type: 'local' as const,
    priority: 3
  }
};

/**
 * Get API configuration based on environment
 */
export function getAPIConfig(): APIConfig {
  const env = (process.env.EXPO_PUBLIC_ENVIRONMENT || 'hybrid') as Environment;
  
  // Production: Cloud-only (most reliable)
  if (env === 'production') {
    return {
      environment: env,
      llm: {
        primary: {
          name: 'Ollama Cloud',
          url: process.env.EXPO_PUBLIC_OLLAMA_SERVER || 'http://localhost:11434/api/generate',
          type: 'cloud',
          priority: 1
        },
        fallback: CLOUD_LLM_ENDPOINTS.groq, // Fallback if needed
      },
      tts: {
        primary: {
          name: 'Backend TTS',
          url: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-backend.com',
          type: 'cloud',
          priority: 1
        }
      },
      backend: {
        primary: {
          name: 'Backend API',
          url: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-backend.com',
          type: 'cloud',
          priority: 1
        }
      }
    };
  }
  
  // Development: Local-only
  if (env === 'development') {
    return {
      environment: env,
      llm: {
        primary: LOCAL_OLLAMA_ENDPOINTS.localhost,
        fallback: CLOUD_LLM_ENDPOINTS.groq
      },
      tts: {
        primary: {
          name: 'Backend TTS Local',
          url: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001',
          type: 'local',
          priority: 1
        }
      },
      backend: {
        primary: {
          name: 'Backend Local',
          url: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001',
          type: 'local',
          priority: 1
        }
      }
    };
  }
  
  // Hybrid: Try local first, fallback to cloud (best of both worlds)
  return {
    environment: env,
    llm: {
      primary: LOCAL_OLLAMA_ENDPOINTS.localhost,
      fallback: CLOUD_LLM_ENDPOINTS.groq
    },
    tts: {
      primary: {
        name: 'Backend TTS',
        url: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001',
        type: 'local',
        priority: 1
      },
      fallback: {
        name: 'Browser TTS',
        url: 'browser://speech-synthesis',
        type: 'local',
        priority: 2
      }
    },
    backend: {
      primary: {
        name: 'Backend Local',
        url: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001',
        type: 'local',
        priority: 1
      }
    }
  };
}

/**
 * Common local IP ranges for auto-discovery
 */
export const LOCAL_IP_RANGES = [
  'localhost',
  '127.0.0.1',
  '192.168.1.',
  '192.168.0.',
  '10.0.0.',
  '10.0.1.',
  '172.16.0.'
];
