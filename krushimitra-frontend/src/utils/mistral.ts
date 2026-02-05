// Local Mistral AI integration for React Native/Expo
// This connects to the backend API that runs the Mistral model

import { serverManager } from '../services/serverManager';

async function getBaseUrl(): Promise<string> {
  await serverManager.initialize();
  return serverManager.getBackendEndpoint() || (process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001');
}

interface MistralResponse {
  answer: string;
  question: string;
  response_time: number;
  timestamp: string;
  language: string;
}

/**
 * Query the local Mistral LLM via backend API (streaming response)
 * @param prompt - The prompt to send to the AI
 * @returns AsyncIterable of response chunks
 */
export async function* queryMistralStream(prompt: string): AsyncIterable<string> {
  try {
    console.log('Calling local Mistral API for streaming response...');
    const base = await getBaseUrl();
    const response = await fetch(`${base}/api/mistral/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        language: 'hindi',
        stream: true
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.trim()) {
          yield chunk;
        }
      }
    } finally {
      reader.releaseLock();
    }
    
  } catch (error) {
    console.error('Error with local Mistral API (streaming):', error);
    
    // Fallback to simple response
    try {
      const fallbackResponse = await queryMistral(prompt);
      // Simulate streaming by yielding words
      const words = fallbackResponse.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (fallbackError) {
      throw new Error('Local Mistral AI error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

/**
 * Query the local Mistral LLM via backend API (single response)
 * @param prompt - The prompt to send to the AI
 * @returns Promise<string> - The AI response
 */
export async function queryMistral(prompt: string): Promise<string> {
  try {
    console.log('Calling local Mistral API...');
    const base = await getBaseUrl();
    const response = await fetch(`${base}/api/mistral/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        language: 'hindi',
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: MistralResponse = await response.json();
    return data.answer || 'कोई उत्तर नहीं मिला।';
    
  } catch (error) {
    console.error('Error with local Mistral API:', error);
    
    // Provide more helpful error messages
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('स्थानीय एआई सर्वर से कनेक्शन नहीं हो पा रहा। कृपया सुनिश्चित करें कि backend server चल रहा है।');
    }
    
    throw new Error('Local Mistral AI error: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Get farming advice in Hindi
 * @param question - The question in Hindi or English
 * @returns Promise<string> - The AI response in Hindi
 */
export async function getMistralHindiAdvice(question: string): Promise<string> {
  try {
    const base = await getBaseUrl();
    const response = await fetch(`${base}/api/mistral/advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        language: 'hindi',
        type: 'farming_advice'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: MistralResponse = await response.json();
    return data.answer || 'कोई सलाह नहीं मिली।';
    
  } catch (error) {
    console.error('Error with local Mistral AI (Hindi):', error);
    return await queryMistral(question); // Fallback to general query
  }
}

/**
 * Diagnose crop issues using local Mistral AI
 * @param crop - Type of crop
 * @param symptoms - Crop symptoms
 * @returns Promise<string> - Diagnosis and treatment advice
 */
export async function diagnoseCropWithMistral(crop: string, symptoms: string): Promise<string> {
  try {
    const base = await getBaseUrl();
    const response = await fetch(`${base}/api/mistral/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crop: crop,
        symptoms: symptoms,
        language: 'hindi'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: MistralResponse = await response.json();
    return data.answer || 'निदान में समस्या हुई।';
    
  } catch (error) {
    console.error('Error with crop diagnosis:', error);
    
    // Fallback to general query
    const fallbackPrompt = `मेरे ${crop} के पौधे में ये लक्षण हैं: ${symptoms}। कृपया समस्या का निदान और उपचार बताएं।`;
    return await queryMistral(fallbackPrompt);
  }
}

/**
 * Test connection to local Mistral API
 * @returns Promise<boolean> - True if connection successful
 */
export async function testMistralConnection(): Promise<boolean> {
  try {
    const base = await getBaseUrl();
    const response = await fetch(`${base}/api/mistral/health`, {
      method: 'GET',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Mistral connection test failed:', error);
    return false;
  }
}