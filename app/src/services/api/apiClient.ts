// Generic API wrapper for the Donki-Wonki backend

// const BASE_URL = 'https://prod-on-the-way.onrender.com';
const BASE_URL = 'https://donki-wonki.onrender.com';

const WAKE_TIMEOUT_MS = 60000; // 60 seconds
const WAKE_RETRY_ATTEMPTS = 3;

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

/**
 * Registers a callback for API-level error notifications.
 */
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

/**
 * Perform a GET request to the API
 * @param path The endpoint path (e.g., '/api/v1/incidents')
 * @returns Parsed JSON response typed as T
 * @throws Error when the HTTP status is not OK or request fails
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
 * @returns Parsed JSON response typed as T
 * @throws Error when the HTTP status is not OK or request fails
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


function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wake up Render backend from cold start (free tier spins down after inactivity)
 * Retries with exponential backoff to handle slow cold starts
 * @returns Promise that resolves when server is awake, rejects after max retries
 */
export async function wakeServer(): Promise<void> {
  for (let attempt = 1; attempt <= WAKE_RETRY_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WAKE_TIMEOUT_MS);

      const response = await fetch(`${config.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`Server wake successful (attempt ${attempt}/${WAKE_RETRY_ATTEMPTS})`);
        return;
      }

      console.warn(`Server wake attempt ${attempt}/${WAKE_RETRY_ATTEMPTS} failed: ${response.status}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Server wake attempt ${attempt}/${WAKE_RETRY_ATTEMPTS} failed: ${errorMessage}`);

      // Wait 2 seconds before retrying
      if (attempt < WAKE_RETRY_ATTEMPTS) {
        const backoffDelay = 2000 * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await sleep(backoffDelay);
      }
    }
  }

  throw new Error('Failed to wake server after maximum retry attempts');
}
