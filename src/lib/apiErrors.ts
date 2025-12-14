// API error handler that extracts and formats error messages
export function parseApiError(error: unknown): string {
  // Handle Response objects (from fetch)
  if (error instanceof Response) {
    return `HTTP ${error.status}: ${error.statusText}`;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle objects with error property (common API response format)
  if (typeof error === "object" && error !== null) {
    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Fallback
  return "An unexpected error occurred";
}

// Fetch wrapper that handles errors
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorData: { error: string } = { error: `HTTP ${response.status}` };

      if (contentType?.includes("application/json")) {
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, use default error
        }
      }

      const error = new Error(parseApiError(errorData));
      (error as any).status = response.status;
      (error as any).response = errorData;
      throw error;
    }

    return response;
  } catch (error) {
    throw error;
  }
}

// Helper function to make API calls with error handling
export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetchWithErrorHandling(url, options);
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text() as Promise<T>;
}
