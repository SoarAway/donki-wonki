// Generic API wrapper for the Donki-Wonki backend

// The base URL for the backend API
// If you are running locally on Android, use 'http://10.0.2.2:8000'
// If you are running on production, use the deployed URL
const BASE_URL = 'https://donki-wonki.onrender.com';

interface ApiConfig {
  baseUrl: string;
}

const config: ApiConfig = {
  baseUrl: BASE_URL,
};

/**
 * Perform a GET request to the API
 * @param path The endpoint path (e.g., '/api/v1/incidents')
 */
export async function get<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API GET Error for ${path}:`, error);
    throw error;
  }
}

/**
 * Perform a POST request to the API
 * @param path The endpoint path
 * @param body The JSON body payload
 */
export async function post<T>(path: string, body: any): Promise<T> {
  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API POST Error for ${path}:`, error);
    throw error;
  }
}
