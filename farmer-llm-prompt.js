/**
 * Farmer-Friendly LLaMA 3 Prompt Templates
 * 
 * This module provides prompt templates to guide the LLaMA 3 model to respond
 * in a farmer-friendly manner in Hindi, Malayalam, and English.
 */

// Farmer-friendly persona for each language

// Guidelines for each language to ensure farmer-friendly responses


/**
 * Get the farmer-friendly persona for a specific language
 * @param {string} language - Language code (en, hi, ml, mr)
 * @returns {string} Persona prompt for the specified language
 */
function getFarmerPersona(language) {
  return farmerPersonas[language] || farmerPersonas.en;
}

/**
 * Get response guidelines for a specific language
 * @param {string} language - Language code (en, hi, ml, mr)
 * @returns {string} Response guidelines for the specified language
 */
function getResponseGuidelines(language) {
  return responseGuidelines[language] || responseGuidelines.en;
}

/**
 * Generate a complete prompt for the LLaMA 3 model
 * @param {string} language - Language code (en, hi, ml, mr)
 * @param {string} userQuery - The farmer's question
 * @param {Object} context - Additional context (farmer profile, location, etc.)
 * @returns {string} Complete prompt for the LLaMA 3 model
 */
function generateFarmerPrompt(language, userQuery, context = {}) {
  const persona = getFarmerPersona(language);
  const guidelines = getResponseGuidelines(language);
  
  // Context information to help personalize the response
  const contextInfo = context.farmerProfile ? `
Farmer Context:
- Name: ${context.farmerProfile.name || 'Farmer'}
- Location: ${context.farmerProfile.location || 'India'}
- Crops: ${context.farmerProfile.crops ? context.farmerProfile.crops.join(', ') : 'Not specified'}
- Language: ${context.farmerProfile.language || language}` : '';
  
  return `${persona}

${contextInfo}

Question: ${userQuery}

${guidelines}

Please provide a helpful, farmer-friendly response in ${language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : language === 'ml' ? 'Malayalam' : 'Marathi'}:`;
}

module.exports = {
  getFarmerPersona,
  getResponseGuidelines,
  generateFarmerPrompt
};