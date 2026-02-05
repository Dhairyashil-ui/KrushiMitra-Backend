import { serverManager } from '../services/serverManager';
import { debugDedup } from './log';

// Connection timeout for initial local attempt
// Adjusted to 30s (per request). Set OLLAMA_DISABLE_ABORT=1 to disable abort entirely during testing.
const LOCAL_CONNECT_TIMEOUT_MS = 300000;
const ABORT_DISABLED = process.env.OLLAMA_DISABLE_ABORT === '1';
// Streaming overall timeout safeguard
const STREAM_TIMEOUT_MS = 30000;

export type OllamaResponse = {
  response: string;
};

/**
 * Get Ollama endpoint from server manager (auto-discovered or configured)
 */
async function getOllamaEndpoint(): Promise<string> {
  // Ensure server manager is initialized
  await serverManager.initialize();
  
  const endpoint = serverManager.getOllamaEndpoint();
  
  if (!endpoint) {
    throw new Error(
      'Ollama server not available. Make sure Ollama is running or configure cloud LLM in .env'
    );
  }
  
  return endpoint;
}


/**
 * Query Ollama with a single prompt (non-streaming).
 */
export async function queryOllama(prompt: string): Promise<string> {
  const endpoint = await getOllamaEndpoint();
  debugDedup('[Ollama] Query (non-stream) local attempt');
  let res: Response;
  if (ABORT_DISABLED) {
    debugDedup('[Ollama] Abort disabled (non-stream)');
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'llama3.2:1b', 
        prompt, 
        stream: false,
        options: {
          num_predict: 2048,  // Max tokens to generate (default is usually 128)
          temperature: 0.7,
          top_p: 0.9
        }
      })
    });
  } else {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), LOCAL_CONNECT_TIMEOUT_MS); // 15s connect/generation window
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'llama3.2:1b', 
        prompt, 
        stream: false,
        options: {
          num_predict: 2048,  // Max tokens to generate
          temperature: 0.7,
          top_p: 0.9
        }
      }),
      signal: controller.signal
    });
    clearTimeout(to);
  }
  if (!res.ok) throw new Error(`Ollama request failed ${res.status}`);
  const data = (await res.json()) as OllamaResponse;
  if (!data || typeof data.response !== 'string') throw new Error('Invalid Ollama response');
  return data.response;
}

/**
 * Stream responses from Ollama (Async generator).
 */
export async function* queryOllamaStream(prompt: string): AsyncGenerator<string> {
  const endpoint = await getOllamaEndpoint();
  debugDedup('[Ollama] Stream start local attempt');
  let res: Response;
  if (ABORT_DISABLED) {
    debugDedup('[Ollama] Abort disabled (stream)');
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'llama3.2:1b', 
        prompt, 
        stream: true,
        options: {
          num_predict: 2048,  // Max tokens to generate
          temperature: 0.7,
          top_p: 0.9
        }
      })
    });
  } else {
    const controller = new AbortController();
    const connectTimeout = setTimeout(() => controller.abort(), LOCAL_CONNECT_TIMEOUT_MS); // 15s initial streaming window
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'llama3.2:1b', 
        prompt, 
        stream: true,
        options: {
          num_predict: 2048,  // Max tokens to generate
          temperature: 0.7,
          top_p: 0.9
        }
      }),
      signal: controller.signal
    });
    clearTimeout(connectTimeout);
  }
  if (!res.ok || !res.body) throw new Error(`Ollama streaming failed ${res.status}`);

  const overallAbort = new AbortController();
  const overallTimer = setTimeout(() => overallAbort.abort(), STREAM_TIMEOUT_MS);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;
        try {
          const obj = JSON.parse(line) as Partial<OllamaResponse> & { done?: boolean };
          if (typeof obj.response === 'string' && obj.response.length > 0) {
            yield obj.response;
          }
          if ((obj as any).done === true) {
            clearTimeout(overallTimer);
            return;
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }
  } finally {
    clearTimeout(overallTimer);
    reader.releaseLock();
  }
}

// Cloud fallback removed – strict local-only behavior.
