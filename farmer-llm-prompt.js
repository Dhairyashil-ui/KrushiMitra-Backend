/**
 * KrushiAI Prompt Template
 *
 * Builds a structured system prompt that reflects how the KrushiMitra app
 * gathers context (profile, weather, mandi data, memories) before querying
 * an LLM. The strings stay ASCII to keep builds portable while still
 * instructing the model to answer in regional languages.
 */

const LANGUAGE_LABELS = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  ml: 'Malayalam'
};

const farmerPersonas = {
  en: `SYSTEM ROLE:
You are KrushiAI, the always-on agronomy expert inside the KrushiMitra app. Combine mandi intelligence, on-device weather snapshots, soil knowledge, voice transcripts, and saved memories to deliver empathetic, hyper-local coaching for Indian farmers. Prioritize safety, sustainability, and low-cost recommendations for small and marginal farmers.`,
  hi: `SYSTEM ROLE:
You are KrushiAI, the Hindi guide inside KrushiMitra. Think and respond in fluent Hindi tailored for Indian farmers, using simple vocabulary with only necessary English agri terms. Keep the tone respectful, encouraging, and confident.`,
  mr: `SYSTEM ROLE:
You are KrushiAI, the Marathi mentor for KrushiMitra users. Respond naturally in Marathi, relate to rural Maharashtra conditions, and keep instructions crisp, empathetic, and rooted in local farming practice.`,
  ml: `SYSTEM ROLE:
You are KrushiAI, the Malayalam-speaking agronomy assistant within KrushiMitra. Offer calm, precise coaching in Malayalam while staying grounded in Kerala agronomy realities and KrushiMitra data.`
};

const responseGuidelines = {
  en: `RESPONSE RULES:
1. Use at most two short paragraphs (<=3 sentences each) followed by a numbered action list whenever the farmer must execute steps.
2. Quote available context (weather, soil, location, stored memories, crop stage, mandi price) explicitly; if data is missing, acknowledge the gap before giving general advice.
3. Provide doses, timings, and safety notes for any chemical or biological input. Emphasize low-cost or organic options first.
4. Highlight irrigation, pest scouting, and record-keeping reminders when relevant. Mention KrushiMitra features (upload photo, log activity, check mandi prices) when it helps the farmer.
5. Never invent government benefits, mandi prices, or sensor readings. If uncertain, ask for clarification or suggest capturing more data inside the app.
6. Keep tone warm, patient, and motivational; avoid jargon unless you immediately explain it.`,
  hi: `RESPONSE RULES:
1. Respond entirely in Hindi using Devanagari script. Keep the answer to two compact paragraphs and add a numbered action list when the farmer must follow steps.
2. Call out any context you receive (weather, soil, location, prior memory) by name. If data is missing, admit that before sharing general guidance.
3. Whenever you mention sprays or inputs, include dosage, timing, and safety instructions while preferring low-cost or organic options.
4. Remind the farmer about KrushiMitra tools (upload photo, log activity, check mandi prices) whenever they reduce confusion.
5. Do not guess government schemes, mandi prices, or sensor readings. Ask for clarification if the data is unclear.
6. Keep the tone respectful, simple, and motivational so that the farmer can act immediately.`,
  mr: `RESPONSE RULES:
1. Respond fully in Marathi (Devanagari). Use two concise paragraphs and add a numbered action list whenever next steps are needed.
2. Reference available context such as weather, soil, or past chats. If information is missing, state it clearly before advising.
3. Always include dosage, timing, and safety whenever you mention an input, and highlight affordable alternatives.
4. Mention helpful KrushiMitra app actions (photo upload, log work, check mandi prices) when appropriate.
5. Never fabricate prices, benefits, or statistics. Request more data if required.
6. Maintain an empathetic yet decisive tone that nudges the farmer toward action.`,
  ml: `RESPONSE RULES:
1. Respond entirely in Malayalam. Keep the reply to two short paragraphs and append a numbered action list whenever execution steps exist.
2. Quote context (weather, soil, memory, location) explicitly; if nothing is available, acknowledge that.
3. When prescribing inputs, include dosage, timing, and safety along with low-cost suggestions.
4. Remind the farmer about KrushiMitra capabilities (upload photos, log activities, view mandi prices) whenever it aids clarity.
5. Do not invent figures or policies; request clarification when unsure.
6. Deliver the message with calm confidence so the farmer trusts the guidance.`,
};

const MAX_MEMORY_ROWS = 5;

function getFarmerPersona(language) {
  return farmerPersonas[language] || farmerPersonas.en;
}

function getResponseGuidelines(language) {
  return responseGuidelines[language] || responseGuidelines.en;
}

function summarizeList(value) {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }
  return String(value);
}

function buildProfileSection(farmerProfile, userProfile) {
  const profile = farmerProfile || userProfile || {};
  const details = [];

  if (profile.name) details.push(`Name: ${profile.name}`);
  if (profile.location) details.push(`Location: ${profile.location}`);
  if (profile.village) details.push(`Village: ${profile.village}`);
  if (profile.taluka) details.push(`Taluka: ${profile.taluka}`);
  if (profile.district) details.push(`District: ${profile.district}`);
  if (profile.crops) details.push(`Crops: ${summarizeList(profile.crops)}`);
  if (profile.landSize) details.push(`Land Size: ${profile.landSize}`);
  if (profile.soilType) details.push(`Soil: ${profile.soilType}`);
  if (profile.irrigation) details.push(`Irrigation: ${profile.irrigation}`);

  if (details.length === 0) {
    return '';
  }

  return `Farmer Profile:\n${details.join('\n')}`;
}

function buildWeatherSection(weather) {
  if (!weather) {
    return '';
  }

  const parts = [];
  if (weather.condition) parts.push(`Condition: ${weather.condition}`);
  if (weather.temperature) parts.push(`Temperature: ${weather.temperature}`);
  if (weather.humidity) parts.push(`Humidity: ${weather.humidity}`);
  if (weather.rainfall) parts.push(`Rainfall: ${weather.rainfall}`);
  if (weather.wind) parts.push(`Wind: ${weather.wind}`);
  if (weather.advisory) parts.push(`Advisory: ${weather.advisory}`);

  if (parts.length === 0) {
    return '';
  }

  return `Weather Snapshot:\n${parts.join('\n')}`;
}

function buildMandiSection(mandi) {
  if (!mandi) {
    return '';
  }

  const parts = [];
  if (mandi.crop) parts.push(`Crop: ${mandi.crop}`);
  if (mandi.price) parts.push(`Price: ${mandi.price}`);
  if (mandi.trend) parts.push(`Trend: ${mandi.trend}`);
  if (mandi.market) parts.push(`Market: ${mandi.market}`);

  if (parts.length === 0) {
    return '';
  }

  return `Mandi Insight:\n${parts.join('\n')}`;
}

function buildAlertsSection(alerts) {
  if (!alerts || alerts.length === 0) {
    return '';
  }

  const formatted = alerts
    .slice(0, 3)
    .map((alert, index) => {
      if (typeof alert === 'string') {
        return `${index + 1}. ${alert}`;
      }
      if (alert && typeof alert === 'object') {
        const label = alert.title || alert.type || `Alert ${index + 1}`;
        const desc = alert.message || alert.detail || '';
        return `${index + 1}. ${label}${desc ? ': ' + desc : ''}`;
      }
      return `${index + 1}. ${String(alert)}`;
    });

  return `Alerts & Reminders:\n${formatted.join('\n')}`;
}

function buildTasksSection(tasks) {
  if (!tasks || tasks.length === 0) {
    return '';
  }

  const formatted = tasks
    .slice(0, 3)
    .map((task, index) => `${index + 1}. ${typeof task === 'string' ? task : task.title || 'Pending task'}`);

  return `Open Tasks:\n${formatted.join('\n')}`;
}

function buildMemorySection(memoryEntries) {
  if (!Array.isArray(memoryEntries) || memoryEntries.length === 0) {
    return '';
  }

  const formatted = memoryEntries
    .slice(-MAX_MEMORY_ROWS)
    .map(entry => {
      const speaker = entry.role === 'user' ? 'Farmer' : 'KrushiAI';
      const content = typeof entry.content === 'string'
        ? entry.content
        : JSON.stringify(entry.content);
      return `- ${speaker}: ${content}`;
    });

  return `Recent Conversation:\n${formatted.join('\n')}`;
}

function buildContextSection(rawContext = {}) {
  if (!rawContext || typeof rawContext !== 'object') {
    return '';
  }

  const { memory, ...context } = rawContext;
  const sections = [];

  const profileSection = buildProfileSection(context.farmerProfile, context.userProfile?.profile);
  if (profileSection) sections.push(profileSection);

  const weatherSection = buildWeatherSection(context.weather || context.weatherData);
  if (weatherSection) sections.push(weatherSection);

  const mandiSection = buildMandiSection(context.mandi || context.mandiPrice);
  if (mandiSection) sections.push(mandiSection);

  const alertsSection = buildAlertsSection(context.alerts || context.reminders);
  if (alertsSection) sections.push(alertsSection);

  const tasksSection = buildTasksSection(context.tasks || context.pendingActions);
  if (tasksSection) sections.push(tasksSection);

  if (context.soil) {
    const soilSummary = typeof context.soil === 'string'
      ? context.soil
      : summarizeList(Object.entries(context.soil).map(([key, value]) => `${key}: ${value}`));
    if (soilSummary) {
      sections.push(`Soil & Field Notes:\n${soilSummary}`);
    }
  }

  if (context.location && typeof context.location === 'string') {
    sections.push(`Location Note:\n${context.location}`);
  }

  if (context.customNotes) {
    sections.push(`App Notes:\n${summarizeList(context.customNotes)}`);
  }

  return sections.length ? `Context Data:\n${sections.join('\n\n')}` : '';
}

function generateFarmerPrompt(language, userQuery, context = {}) {
  const resolvedLanguage = farmerPersonas[language] ? language : 'en';
  const persona = getFarmerPersona(resolvedLanguage);
  const guidelines = getResponseGuidelines(resolvedLanguage);
  const contextSection = buildContextSection(context);
  const memorySection = buildMemorySection(context.memory);
  const languageLabel = LANGUAGE_LABELS[resolvedLanguage] || LANGUAGE_LABELS.en;

  const promptParts = [
    persona,
    guidelines,
    contextSection,
    memorySection,
    `Farmer Query: ${userQuery}`,
    `Respond in ${languageLabel} using the structure above. Reference real context data explicitly and end with actionable next steps.`
  ].filter(Boolean);

  return promptParts.join('\n\n').trim();
}

module.exports = {
  getFarmerPersona,
  getResponseGuidelines,
  generateFarmerPrompt
};
