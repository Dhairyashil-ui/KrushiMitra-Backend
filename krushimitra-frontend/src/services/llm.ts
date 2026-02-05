/**
 * Unified LLM Service with Cloud + Local Hybrid Support
 * Automatically uses cloud when available, falls back to local
 */

import { queryOllamaStream } from '../utils/ollama';
import { queryCloudLLMStream, type CloudLLMConfig } from './cloudLLM';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}


export type LLMMode = 'cloud' | 'local' | 'hybrid';

export interface LLMResponse {
  text: string;
  provider: 'cloud' | 'local';
  model: string;
  error?: string;
}

/**
 * Get current LLM mode from environment
 */
function getLLMMode(): LLMMode {
  const mode = process.env.EXPO_PUBLIC_LLM_MODE || 'hybrid';
  return mode as LLMMode;
}

/**
 * Query LLM with automatic provider selection and failover
 */
export async function* queryLLMStream(
  prompt: string,
  _conversationHistory?: ChatMessage[],
  userContext?: any
): AsyncGenerator<string> {
  const mode = getLLMMode();
  console.log('🤖 LLM Mode:', mode);
  console.log('📋 User Context:', userContext ? 'Included' : 'Not provided');
  
  // Hybrid mode: Try local first, then cloud
  if (mode === 'hybrid') {
    try {
      console.log('🔄 Trying local Ollama first...');
      yield* queryLocalOnly(prompt, userContext);
      return;
    } catch (error) {
      console.warn('⚠️ Local Ollama failed, trying cloud fallback...', error);
      try {
        yield* queryCloudOnly(prompt, userContext);
        return;
      } catch (cloudError) {
        console.error('❌ Both local and cloud failed');
        throw new Error('Both local and cloud LLM failed. Please check your configuration.');
      }
    }
  }
  
  // Cloud-only mode
  if (mode === 'cloud') {
    try {
      yield* queryCloudOnly(prompt, userContext);
      return;
    } catch (error) {
      console.error('☁️ Cloud LLM failed:', error);
      throw error;
    }
  }
  
  // Local-only mode
  yield* queryLocalOnly(prompt, userContext);
}

/**
 * Query cloud LLM only
 */
async function* queryCloudOnly(prompt: string, userContext?: any): AsyncGenerator<string> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || process.env.EXPO_PUBLIC_CLOUD_LLM_API_KEY;
  const provider = (process.env.EXPO_PUBLIC_CLOUD_LLM_PROVIDER || 'groq') as any;
  
  if (!apiKey) {
    throw new Error('Cloud LLM API key not configured. Set EXPO_PUBLIC_GROQ_API_KEY in .env');
  }
  
  console.log(`☁️ Using cloud LLM: ${provider}`);
  
  // Build user context data
  const userName = userContext?.user_data?.user_name || 'किसान';
  const userLocation = userContext?.user_data?.user_location?.address || 'अज्ञात स्थान';
  const currentWeather = userContext?.weather_data?.current?.description || 'जानकारी उपलब्ध नहीं';
  
  // Build prompt with the requested format
  const systemPrompt = `You are KrushiAI, a simple farming assistant.
Start the answer with the user's name.
Reply only in easy Hindi (Devanagari).
User name = ${userName}
User location = ${userLocation}
Weather at that location = ${currentWeather}

Use this data to answer the user's question.`;
  
  const userMessage = `--- USER QUESTION ---
${prompt}
-----------------------

Your Answer (in Hindi):`;
  
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];
  
  const config: CloudLLMConfig = {
    provider,
    apiKey,
    model: process.env.EXPO_PUBLIC_CLOUD_LLM_MODEL || 
           (provider === 'groq' ? 'llama3-8b-8192' : 'meta-llama/llama-3-8b-instruct')
  };
  
  console.log('📤 Sending to cloud LLM:', {
    provider: config.provider,
    model: config.model,
    hasApiKey: !!config.apiKey,
    apiKeyPrefix: config.apiKey?.substring(0, 4),
    systemPromptLength: systemPrompt.length,
    userMessageLength: userMessage.length
  });
  
  yield* queryCloudLLMStream(messages, config);
}

/**
 * Query local Ollama only
 */
async function* queryLocalOnly(prompt: string, userContext?: any): AsyncGenerator<string> {
  // Build user context data
  const userName = userContext?.user_data?.user_name || 'किसान';
  const userLocation = userContext?.user_data?.user_location?.address || 'अज्ञात स्थान';
  const currentWeather = userContext?.weather_data?.current?.description || 'जानकारी उपलब्ध नहीं';
  
  // Build prompt with the requested format
  const fullPrompt = `You are KrushiAI, a simple farming assistant.
Start the answer with the user's name.
Reply only in easy Hindi (Devanagari).
User name = ${userName}
User location = ${userLocation}
Weather at that location = ${currentWeather}

Use this data to answer the user's question.

--- USER QUESTION ---
${prompt}
-----------------------

Your Answer (in Hindi):`;
  
  console.log('📝 Formatted Prompt:', fullPrompt.substring(0, 200) + '...');
  yield* queryOllamaStream(fullPrompt);
}

/**
 * Query LLM (non-streaming) with automatic failover
 */
export async function queryLLM(prompt: string): Promise<LLMResponse> {
  let fullResponse = '';
  const mode = getLLMMode();
  
  try {
    for await (const chunk of queryLLMStream(prompt)) {
      fullResponse += chunk;
    }
    return {
      text: fullResponse,
      provider: mode === 'local' ? 'local' : 'cloud',
      model: mode === 'local' ? 'llama3.2:1b' : 'llama3-8b'
    };
  } catch (error) {
    console.error('LLM error:', error);
    return {
      text: '',
      provider: mode === 'local' ? 'local' : 'cloud',
      model: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
