import { getDefaultVoice } from './voiceConfig';

export interface TTSResult {
  audioUrl?: string; // Object URL for fetched audio
  usedFallback: boolean; // True if browser TTS or text-only fallback used
  error?: string; // Error message if failed
}

// 3s network timeout per requirements
const TTS_TIMEOUT_MS = 3000;

// Fetch TTS audio with abort + graceful fallback.
// Does NOT throw; returns a structured result so callers can proceed with LLM text immediately.
export async function requestTTS(
  text: string,
  language: string = 'hi',
  voice?: string,
  timeoutMs: number = TTS_TIMEOUT_MS
): Promise<TTSResult> {
  const backend = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const selectedVoice = voice || getDefaultVoice(language, 'chat');
  const url = `${backend}/tts?lang=${language}&voice=${selectedVoice}&text=${encodeURIComponent(text)}`;
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(to);
    if (!res.ok) {
      return fallback(`HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return { audioUrl: objectUrl, usedFallback: false };
  } catch (err: any) {
    clearTimeout(to);
    const reason = err?.name === 'AbortError' ? 'timeout' : (err?.message || 'network-error');
    return fallback(reason);
  }
}

// Browser speech synthesis (primary method - works offline, no backend needed)
// Browser synthesis retained only as fallback now
function useBrowserTTS(text: string, language: string): TTSResult {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ml' ? 'ml-IN' : 'en-US';
      window.speechSynthesis.speak(utter);
      return { usedFallback: true };
    } catch (e) {
      return { usedFallback: true, error: 'browser-tts-failed' };
    }
  }
  return { usedFallback: true, error: 'no-browser-tts' };
}

// Backend TTS fallback (web only) or silent text-only fallback.
function fallback(error: string): TTSResult {
  return useBrowserTTS('', 'en');
}

// Utility to revoke object URLs when audio finished
export function releaseTTS(result: TTSResult) {
  if (result.audioUrl) {
    URL.revokeObjectURL(result.audioUrl);
  }
}

// Example convenience that fires TTS without blocking calling code
export async function playTTS(text: string, language: string = 'hi', voice?: string) {
  const r = await requestTTS(text, language, voice);
  if (r.audioUrl) {
    const audio = new Audio(r.audioUrl);
    audio.play().catch(err => console.debug('[TTS] Audio play error', err));
    audio.onended = () => releaseTTS(r);
  } else if (r.usedFallback) {
    console.debug('[TTS] Using fallback (no audio).', r.error);
  }
  return r; // caller can still display text instantly
}

export default { requestTTS, playTTS, releaseTTS };