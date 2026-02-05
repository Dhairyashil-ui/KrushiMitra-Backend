/**
 * Voice Input Service for KrushiMitra
 * Connects React Native voice input to Whisper STT API
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { serverManager } from './serverManager';
import { debugDedup } from '../utils/log';

// Feature flag: Enable/disable Whisper usage entirely
const WHISPER_ENABLED = (process.env.EXPO_PUBLIC_WHISPER_ENABLED || 'false').toLowerCase() === 'true';

export interface VoiceInputConfig {
  language?: string;
  duration?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface TranscriptionResult {
  success: boolean;
  transcription?: string;
  language?: string;
  confidence?: number;
  error?: string;
}

/**
 * Get Whisper API URL from server manager
 */
async function getWhisperAPIUrl(): Promise<string> {
  await serverManager.initialize();
  const endpoint = serverManager.getWhisperEndpoint();
  
  if (!endpoint) {
    throw new Error('Whisper STT service not available');
  }
  
  return endpoint.replace('/transcribe', ''); // Get base URL
}

class VoiceInputService {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  constructor() {
    this.setupAudio();
  }

  private async setupAudio(): Promise<void> {
    try {
      // Request microphone permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error('Microphone permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('✅ Voice input service initialized');
    } catch (error) {
      console.error('❌ Voice input setup error:', error);
      throw error;
    }
  }

  /**
   * Start recording voice input
   */
  async startRecording(config: VoiceInputConfig = {}): Promise<void> {
    try {
      if (this.isRecording) {
        console.warn('Already recording');
        return;
      }

      // Create recording instance
      this.recording = new Audio.Recording();
      
      // Configure recording options
      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      };

      // Start recording
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
      
      this.isRecording = true;
      console.log('🎤 Voice recording started');

      // Auto-stop after duration if specified
      if (config.duration) {
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, config.duration * 1000);
      }

    } catch (error) {
      console.error('❌ Start recording error:', error);
      this.isRecording = false;
      throw error;
    }
  }

  /**
   * Stop recording and return audio URI
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.isRecording || !this.recording) {
        console.warn('Not currently recording');
        return null;
      }

      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      this.isRecording = false;
      this.recording = null;

      console.log('✅ Voice recording stopped, URI:', uri);
      return uri;

    } catch (error) {
      console.error('❌ Stop recording error:', error);
      this.isRecording = false;
      this.recording = null;
      throw error;
    }
  }

  /**
   * Transcribe audio file using Whisper STT API
   */
  async transcribeAudio(audioUri: string, config: VoiceInputConfig = {}): Promise<TranscriptionResult> {
    if (!WHISPER_ENABLED) {
      // Non-blocking fallback: attempt browser SpeechSynthesis if available
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        debugDedup('[Whisper] Disabled – using browser speech fallback (no transcription)');
        const utter = new SpeechSynthesisUtterance(textPreview(textFromAudioUri(audioUri)));
        try { window.speechSynthesis.speak(utter); } catch {}
      }
      return { success: false, error: 'Whisper STT disabled' };
    }
    try {
      console.log('🔄 Transcribing audio with Whisper...');

      // Get Whisper endpoint from server manager
      const whisperUrl = await getWhisperAPIUrl();

      // Create form data for file upload
      const formData = new FormData();
      
      // Add audio file
      const audioFile = {
        uri: audioUri,
        type: 'audio/wav',
        name: 'voice_input.wav',
      } as any;
      
      formData.append('audio', audioFile);
      formData.append('language', config.language || 'hi');

      // Send to Whisper STT API
      const response = await fetch(`${whisperUrl}/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`STT API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Transcription successful:', result.transcription);
        return {
          success: true,
          transcription: result.transcription,
          language: result.language,
          confidence: result.confidence,
        };
      } else {
        throw new Error(result.error || 'Transcription failed');
      }

    } catch (error) {
      console.error('❌ Transcription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transcription error',
      };
    }
  }

  /**
   * Record and transcribe in one call
   */
  async recordAndTranscribe(config: VoiceInputConfig = {}): Promise<TranscriptionResult> {
    if (!WHISPER_ENABLED) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        debugDedup('[Whisper] Disabled – browser speech synthesis invoked');
      }
      return { success: false, error: 'Whisper STT disabled' };
    }
    try {
      // Start recording
      await this.startRecording(config);

      // Wait for recording duration (default 5 seconds)
      const duration = config.duration || 5;
      await new Promise(resolve => setTimeout(resolve, duration * 1000));

      // Stop recording
      const audioUri = await this.stopRecording();
      
      if (!audioUri) {
        throw new Error('Failed to record audio');
      }

      // Transcribe
      return await this.transcribeAudio(audioUri, config);

    } catch (error) {
      console.error('❌ Record and transcribe error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if currently recording
   */
  get isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Test Whisper STT API connection
   */
  async testConnection(): Promise<boolean> {
    if (!WHISPER_ENABLED) {
      debugDedup('[Whisper] Health skipped (disabled)');
      return false;
    }
    try {
      const whisperUrl = await getWhisperAPIUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      const response = await fetch(`${whisperUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const result = await response.json();
      debugDedup(`[Whisper] Health ok ready=${result.ready}`);
      return result.ready === true;
    } catch (error) {
      debugDedup('[Whisper] Health failed or timed out');
      return false;
    }
  }
}

// Export singleton instance
export const voiceInputService = new VoiceInputService();

// Helper functions for React Native integration
export const startVoiceInput = (config?: VoiceInputConfig) => voiceInputService.startRecording(config);
export const stopVoiceInput = () => voiceInputService.stopRecording();
export const transcribeVoice = (audioUri: string, config?: VoiceInputConfig) => voiceInputService.transcribeAudio(audioUri, config);
export const recordAndTranscribeVoice = (config?: VoiceInputConfig) => voiceInputService.recordAndTranscribe(config);
export const testWhisperConnection = () => voiceInputService.testConnection();

// Helpers to produce short preview text from audio URI (placeholder only)
function textFromAudioUri(_uri: string): string {
  // Real implementation would perform local approximation; here we keep empty
  return '';
}
function textPreview(text: string): string { return text.slice(0, 50); }