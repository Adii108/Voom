/**
 * Centralized API client for communicating with the FastAPI backend.
 *
 * All backend calls go through this module so that:
 * - The base URL is configured in one place
 * - Error handling is consistent
 * - Switching from fetch to axios (or similar) requires changes in only one file
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Generic fetch wrapper with consistent error handling.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "An unexpected error occurred",
    }));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * API methods organized by resource.
 * Will be expanded as we build out features.
 */
export const api = {
  /** Health check — verify backend connectivity. */
  health: () => request<{ status: string; app: string; version: string }>("/api/health"),
};
