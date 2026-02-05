/**
 * Cloud-based LLM Service
 * Supports multiple providers with automatic failover
 */

export type CloudLLMProvider = 'groq' | 'openrouter' | 'together';

export interface CloudLLMConfig {
  provider: CloudLLMProvider;
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Provider configurations
 */
const PROVIDER_CONFIGS = {
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    models: {
      llama3: 'llama3-70b-8192',
      llama3Fast: 'llama3-8b-8192'
    }
  },
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    models: {
      llama3: 'meta-llama/llama-3-70b-instruct',
      llama3Fast: 'meta-llama/llama-3-8b-instruct'
    }
  },
  together: {
    baseURL: 'https://api.together.xyz/v1',
    models: {
      llama3: 'meta-llama/Llama-3-70b-chat-hf',
      llama3Fast: 'meta-llama/Llama-3-8b-chat-hf'
    }
  }
};

/**
 * Query cloud LLM (streaming)
 */
export async function* queryCloudLLMStream(
  messages: ChatMessage[],
  config: CloudLLMConfig
): AsyncGenerator<string> {
  const providerConfig = PROVIDER_CONFIGS[config.provider];
  const endpoint = `${providerConfig.baseURL}/chat/completions`;
  
  console.log(`🌐 Querying ${config.provider} LLM...`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...(config.provider === 'openrouter' ? {
          'HTTP-Referer': 'https://krushimitra.app',
          'X-Title': 'KrushiMitra'
        } : {})
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048
      })
    });
    
    if (!response.ok || !response.body) {
      // Get error details from response
      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        console.error(`${config.provider} error response:`, errorBody);
        errorDetails += ` - ${errorBody}`;
      } catch (e) {
        // Ignore if can't read error body
      }
      throw new Error(`${config.provider} request failed: ${errorDetails}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Ignore malformed lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error(`Error querying ${config.provider}:`, error);
    throw new Error(
      `Failed to connect to ${config.provider}. ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Query cloud LLM (non-streaming)
 */
export async function queryCloudLLM(
  messages: ChatMessage[],
  config: CloudLLMConfig
): Promise<string> {
  const providerConfig = PROVIDER_CONFIGS[config.provider];
  const endpoint = `${providerConfig.baseURL}/chat/completions`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...(config.provider === 'openrouter' ? {
          'HTTP-Referer': 'https://krushimitra.app',
          'X-Title': 'KrushiMitra'
        } : {})
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 2048
      })
    });
    
    if (!response.ok) {
      throw new Error(`${config.provider} request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error(`Error querying ${config.provider}:`, error);
    throw new Error(
      `Failed to connect to ${config.provider}. ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get default cloud LLM config from environment
 */
export function getCloudLLMConfig(): CloudLLMConfig {
  const provider = (process.env.EXPO_PUBLIC_CLOUD_LLM_PROVIDER || 'groq') as CloudLLMProvider;
  const apiKey = process.env.EXPO_PUBLIC_CLOUD_LLM_API_KEY || '';
  
  const providerConfig = PROVIDER_CONFIGS[provider];
  const model = process.env.EXPO_PUBLIC_CLOUD_LLM_MODEL || providerConfig.models.llama3Fast;
  
  return {
    provider,
    apiKey,
    model
  };
}
