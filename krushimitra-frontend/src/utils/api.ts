// API utility functions for KrushiAI

import { serverManager } from '../services/serverManager';

/**
 * Get backend API base URL from server manager
 */
async function getAPIBaseURL(): Promise<string> {
  await serverManager.initialize();
  const endpoint = serverManager.getBackendEndpoint();
  
  if (!endpoint) {
    // Fallback to localhost for development
    return 'http://localhost:3001';
  }
  
  return endpoint;
}

interface AIInteraction {
  farmerId?: string;  // Legacy support
  userId?: string;    // New field
  query: string;
  response: string;
  context?: Record<string, any>;
}

/**
 * Save AI interaction to MongoDB
 * @param interaction - The AI interaction data to save
 * @returns Promise<boolean> - Whether the save was successful
 */
export async function saveAIInteraction(interaction: AIInteraction): Promise<boolean> {
  try {
    const apiUrl = await getAPIBaseURL();
    
    // Example API call:
    const response = await fetch(`${apiUrl}/ai/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-12345' // In a real app, you would get this from authentication
      },
      body: JSON.stringify(interaction)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('AI interaction saved successfully:', result);
    return true;
  } catch (error) {
    console.error('Error saving AI interaction:', error);
    return false;
  }
}

/**
 * Get recent AI interactions for context
 * @param farmerId - The farmer's ID
 * @param limit - Number of interactions to retrieve (default: 10)
 * @returns Promise<Array> - Array of recent interactions
 */
export async function getRecentAIInteractions(farmerId: string, limit: number = 10): Promise<any[]> {
  try {
    const apiUrl = await getAPIBaseURL();
    
    const response = await fetch(`${apiUrl}/ai/interactions/${farmerId}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-12345' // In a real app, you would get this from authentication
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching recent AI interactions:', error);
    return [];
  }
}

interface MandiPriceFilters {
  crop?: string;
  location?: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
}

/**
 * Fetch mandi prices with optional filtering
 * @param filters - Optional filters for crop, location, category, price range
 * @returns Promise<Array> - Array of mandi price objects
 */
export async function fetchMandiPrices(filters?: MandiPriceFilters): Promise<any[]> {
  try {
    const apiUrl = await getAPIBaseURL();
    
    const queryParams = new URLSearchParams();
    
    if (filters?.crop) queryParams.append('crop', filters.crop);
    if (filters?.location) queryParams.append('location', filters.location);
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.priceRange) {
      queryParams.append('minPrice', filters.priceRange.min.toString());
      queryParams.append('maxPrice', filters.priceRange.max.toString());
    }

    const response = await fetch(`${apiUrl}/mandiprices?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-12345' // In a real app, you would get this from authentication
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching mandi prices:', error);
    return [];
  }
}

/**
 * Get search suggestions for commodities
 * @param query - Search query string
 * @returns Promise<Array> - Array of suggestion strings
 */
export async function getCommoditySuggestions(query: string): Promise<string[]> {
  try {
    const apiUrl = await getAPIBaseURL();
    
    const response = await fetch(`${apiUrl}/mandiprices/suggestions?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-12345'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching commodity suggestions:', error);
    return [];
  }
}