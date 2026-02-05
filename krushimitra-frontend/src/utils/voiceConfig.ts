// Voice configuration for AI4Bharat TTS
// This file centralizes voice settings for the entire app

export interface Voice {
  id: string;
  name: string;
  description: string;
  language: string;
  gender: 'male' | 'female';
}

export const AVAILABLE_VOICES: Record<string, Voice> = {
  hindi_male: {
    id: 'male',
    name: 'AI4Bharat Hindi Male',
    description: 'Professional Hindi male voice from AI4Bharat TTS',
    language: 'hi',
    gender: 'male'
  },
  hindi_female: {
    id: 'female',
    name: 'AI4Bharat Hindi Female',
    description: 'Clear and warm Hindi female voice from AI4Bharat TTS',
    language: 'hi',
    gender: 'female'
  },
  english_female: {
    id: 'female',
    name: 'AI4Bharat English Female',
    description: 'Indian English accent female voice',
    language: 'en',
    gender: 'female'
  }
};

// Default voice selection based on language and context
export const getDefaultVoice = (language: string = 'hi', context: 'chat' | 'orb' | 'welcome' = 'chat'): string => {
  switch (language) {
    case 'hi':
      // Use female voice for better user experience with farming conversations
      return 'female';
    case 'mr':
    case 'ml':
    case 'ta':
    case 'te':
    case 'kn':
    case 'gu':
    case 'bn':
    case 'as':
    case 'or':
      return 'female'; // AI4Bharat supports multiple Indic languages
    default:
      return 'female'; // Default to female voice
  }
};

// Generate TTS URL with proper voice selection for AI4Bharat
export const generateTTSUrl = (
  baseUrl: string,
  text: string,
  language: string = 'hi',
  context: 'chat' | 'orb' | 'welcome' = 'chat',
  customVoice?: string
): string => {
  const voice = customVoice || getDefaultVoice(language, context);
  return `${baseUrl}/tts?lang=${language}&voice=${voice}&text=${encodeURIComponent(text)}`;
};

// Voice utility functions for components
export const VoiceUtils = {
  // Get voice for AI chat responses
  getChatVoice: (language: string = 'hi') => getDefaultVoice(language, 'chat'),
  
  // Get voice for voice orb
  getOrbVoice: (language: string = 'hi') => getDefaultVoice(language, 'orb'),
  
  // Get voice for welcome messages
  getWelcomeVoice: (language: string = 'hi') => getDefaultVoice(language, 'welcome'),
  
  // Generate TTS URL for AI chat
  getChatTTSUrl: (baseUrl: string, text: string, language: string = 'hi') => 
    generateTTSUrl(baseUrl, text, language, 'chat'),
  
  // Generate TTS URL for voice orb
  getOrbTTSUrl: (baseUrl: string, text: string, language: string = 'hi') => 
    generateTTSUrl(baseUrl, text, language, 'orb'),
  
  // Generate TTS URL for welcome messages
  getWelcomeTTSUrl: (baseUrl: string, text: string, language: string = 'hi') => 
    generateTTSUrl(baseUrl, text, language, 'welcome'),
};