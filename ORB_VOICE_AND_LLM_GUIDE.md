# Orb TTS & LLM Configuration Guide

## 🎤 Orb Voice Settings (FIXED ✅)

### Location: `KrushiMitra-Backend/server.js`

**Lines 1512-1516** - Orb Voice Configuration

```javascript
// <Say> verb with male voice for friendly, natural tone
response.say({
  voice: 'man', // Male voice - sounds more like a friend
  language: 'hi-IN' // Hindi for natural Indian accent
}, message);
```

### What Was Changed:
- ✅ **Voice**: Changed from `'alice'` (female, robotic) to `'man'` (male, friendly)
- ✅ **Language**: Changed from `'en-IN'` to `'hi-IN'` for more natural Indian accent
- ✅ **Tone**: Now sounds more like a real friend

### Available Twilio Voice Options:
- `'man'` - Male voice (current)
- `'woman'` - Female voice
- `'alice'` - Female, supports multiple languages
- `'Polly.Aditi'` - Indian female voice (AWS Polly)
- `'Polly.Raveena'` - Indian female voice (AWS Polly)

### To Adjust Speed:
Add this parameter to the `say()` method:
```javascript
response.say({
  voice: 'man',
  language: 'hi-IN',
  rate: '110%' // 110% = faster, 90% = slower
}, message);
```

---

## 🤖 LLM Prompt & Instructions

### Location: `KrushiMitra-Backend/farmer-llm-prompt.js`

This file contains **ALL the AI personality and behavior instructions** for KrushiAI.

### Key Sections:

#### 1. **System Role / Personality** (Lines 17-26)
Defines how the AI should behave:

```javascript
const farmerPersonas = {
  en: `SYSTEM ROLE:
You are KrushiAI, the always-on agronomy expert inside the KrushiMitra app...`,
  
  hi: `SYSTEM ROLE:
You are KrushiAI, the Hindi guide inside KrushiMitra...`,
  
  mr: `SYSTEM ROLE:
You are KrushiAI, the Marathi mentor for KrushiMitra users...`,
  
  ml: `SYSTEM ROLE:
You are KrushiAI, the Malayalam-speaking agronomy assistant...`
};
```

**To make it more friendly/emotional:**
Edit lines 18-19 and add personality traits like:
```javascript
en: `SYSTEM ROLE:
You are KrushiAI, a warm and enthusiastic farming friend who genuinely cares about farmers' success. 
You're like a knowledgeable older brother who combines expert agronomy advice with emotional support.
Show excitement when farmers share good news, empathy during challenges, and encouragement always.
Use conversational language, occasional emojis in text responses, and express emotions naturally.`
```

#### 2. **Response Guidelines** (Lines 28-57)
Controls how the AI responds:

```javascript
const responseGuidelines = {
  en: `RESPONSE RULES:
1. Use at most two short paragraphs...
2. Quote available context...
3. Provide doses, timings...
4. Highlight irrigation, pest scouting...
5. Never invent government benefits...
6. Keep tone warm, patient, and motivational...`
};
```

**To add more emotion:**
Edit line 35-36 and change to:
```javascript
6. Keep tone warm, enthusiastic, and supportive like a close friend. 
   Use phrases like "Great question!", "I'm excited to help!", "You're doing amazing!".
   Show genuine care and celebrate farmer's efforts. Use conversational language.
```

#### 3. **Main Prompt Generator** (Lines 233-251)
This function combines everything:

```javascript
function generateFarmerPrompt(language, userQuery, context = {}) {
  const persona = getFarmerPersona(resolvedLanguage);
  const guidelines = getResponseGuidelines(resolvedLanguage);
  const contextSection = buildContextSection(context);
  const memorySection = buildMemorySection(context.memory);
  
  return promptParts.join('\n\n').trim();
}
```

---

## 🎯 Quick Customization Guide

### To Make Orb Sound More Emotional:

**Option 1: Twilio Voice (Current)**
- Already fixed to male voice ✅
- Limited emotion capability
- Fast and reliable

**Option 2: ElevenLabs (Premium)**
You have ElevenLabs installed! For MUCH better emotional voice:

1. Get an ElevenLabs API key
2. Choose a voice ID (they have very natural male voices)
3. I can integrate it to replace the Twilio voice

Would you like me to integrate ElevenLabs for premium emotional voice?

### To Make AI Text Responses More Friendly:

**Edit these lines in `farmer-llm-prompt.js`:**

1. **Line 18-19** - Add personality traits
2. **Line 35-36** - Add emotional response style
3. **Line 29-34** - Adjust response format

---

## 📍 File Locations Summary

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| **Orb Voice** | `server.js` | 1512-1516 | Voice settings (FIXED ✅) |
| **Orb Message** | `server.js` | 1501-1510 | What Orb says |
| **AI Personality** | `farmer-llm-prompt.js` | 17-26 | System role/character |
| **AI Response Style** | `farmer-llm-prompt.js` | 28-57 | How AI responds |
| **Prompt Builder** | `farmer-llm-prompt.js` | 233-251 | Combines everything |

---

## 🔧 Example: Making AI More Emotional

### Current (Professional):
```
"You are KrushiAI, the always-on agronomy expert..."
"Keep tone warm, patient, and motivational..."
```

### Suggested (Friendly & Emotional):
```
"You are KrushiAI, a passionate farming buddy who treats every farmer like family.
You celebrate their wins, empathize with challenges, and always have their back.
Think of yourself as their most supportive friend who happens to be an agronomy genius."

"Keep tone enthusiastic and conversational like chatting with a close friend.
Use phrases like 'Awesome!', 'I'm so glad you asked!', 'You've got this!'.
Show genuine excitement, concern, and encouragement in every response."
```

---

## 🎬 Next Steps

1. ✅ **Orb Voice Fixed** - Now male voice with Hindi accent
2. 📝 **Want more emotion?** - Let me know if you want me to:
   - Update the AI personality prompts
   - Integrate ElevenLabs for premium voice
   - Add more conversational phrases

Just tell me what changes you'd like!

---

**Last Updated:** February 5, 2026
**Status:** Orb Voice Fixed ✅ | LLM Prompts Located ✅
