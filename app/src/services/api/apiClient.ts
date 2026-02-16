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

// Global loading state callbacks
type LoadingCallback = (isLoading: boolean) => void;
let loadingCallback: LoadingCallback | null = null;
type ErrorCallback = (message: string) => void;
let errorCallback: ErrorCallback | null = null;

/**
 * Register a callback to be notified when API loading state changes
 * @param callback Function to call with loading state (true/false)
 */
export function setLoadingCallback(callback: LoadingCallback | null) {
  loadingCallback = callback;
}

export function setErrorCallback(callback: ErrorCallback | null) {
  errorCallback = callback;
}

/**
 * Notify registered callback of loading state change
 */
function notifyLoading(isLoading: boolean) {
  if (loadingCallback) {
    loadingCallback(isLoading);
  }
}

function notifyError(message: string) {
  if (errorCallback) {
    errorCallback(message);
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (typeof data === 'string' && data.trim().length > 0) {
      return data;
    }

    if (data && typeof data === 'object') {
      const errorData = data as Record<string, unknown>;

      if (
        typeof errorData.message === 'string' &&
        errorData.message.trim().length > 0
      ) {
        return errorData.message;
      }

      if (typeof errorData.error === 'string' && errorData.error.trim().length > 0) {
        return errorData.error;
      }

      if (typeof errorData.detail === 'string' && errorData.detail.trim().length > 0) {
        return errorData.detail;
      }
    }
  } catch (error) {
    console.error('Failed to parse API error response:', error);
  }

  return `API Error: ${response.status} ${response.statusText}`;
}

/**
 * Perform a GET request to the API
 * @param path The endpoint path (e.g., '/api/v1/incidents')
 */
export async function get<T>(path: string): Promise<T> {
  try {
    notifyLoading(true);
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      notifyError(error.message);
    } else {
      notifyError('Unknown API error occurred.');
    }
    console.error(`API GET Error for ${path}:`, error);
    throw error;
  } finally {
    notifyLoading(false);
  }
}

/**
 * Perform a POST request to the API
 * @param path The endpoint path
 * @param body The JSON body payload
 */
export async function post<T>(path: string, body: any): Promise<T> {
  try {
    notifyLoading(true);
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      notifyError(error.message);
    } else {
      notifyError('Unknown API error occurred.');
    }
    console.error(`API POST Error for ${path}:`, error);
    throw error;
  } finally {
    notifyLoading(false);
  }
}
