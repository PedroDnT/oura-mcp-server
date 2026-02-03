/**
 * Oura API Client
 *
 * Handles all API requests to Oura API v2 with OAuth2 authentication
 */

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { OURA_API_BASE_URL } from "../constants.js";

/**
 * Oura API Client class
 */
export class OuraClient {
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("Oura access token is required");
    }
    this.accessToken = accessToken;
  }

  /**
   * Make authenticated request to Oura API (single page)
   */
  async makeRequestPage<T>(
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    try {
      const config: AxiosRequestConfig = {
        method: "GET",
        url: `${OURA_API_BASE_URL}/${endpoint}`,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
        params: this.cleanParams(params),
        timeout: 30000,
      };

      const response = await axios(config);
      return response.data as T;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Make authenticated request (backwards-compatible name)
   */
  async makeRequest<T>(
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    return this.makeRequestPage<T>(endpoint, params);
  }

  /**
   * Fetch all pages for list endpoints that return { data, next_token }
   */
  async makeRequestAllPages<T extends { data: any[]; next_token: string | null }>(
    endpoint: string,
    params?: Record<string, string | number | undefined>,
    opts?: { maxPages?: number; maxItems?: number }
  ): Promise<T> {
    const maxPages = opts?.maxPages ?? 10;
    const maxItems = opts?.maxItems ?? 10000;

    let nextToken: string | null = null;
    let page = 0;
    const collected: any[] = [];
    let lastResponse: T | null = null;

    do {
      const response: T = await this.makeRequestPage<T>(endpoint, {
        ...(params ?? {}),
        next_token: nextToken ?? undefined,
      });
      lastResponse = response;

      const items = Array.isArray(response?.data) ? response.data : [];
      collected.push(...items);

      if (collected.length >= maxItems) {
        collected.length = maxItems;
        nextToken = null;
        break;
      }

      nextToken = response?.next_token ?? null;
      page += 1;
    } while (nextToken && page < maxPages);

    if (!lastResponse) {
      return { data: [], next_token: null } as unknown as T;
    }

    return {
      ...(lastResponse as any),
      data: collected,
      next_token: nextToken && page < maxPages ? nextToken : null,
    };
  }

  /**
   * Remove undefined values from params
   */
  private cleanParams(
    params?: Record<string, string | number | undefined>
  ): Record<string, string | number> | undefined {
    if (!params) return undefined;

    const cleaned: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  /**
   * Handle API errors with helpful messages
   */
  private handleApiError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        switch (status) {
          case 400:
            return new Error(
              `Bad Request: ${data?.detail || "Invalid parameters provided"}. Check date format (YYYY-MM-DD) and parameter values.`
            );
          case 401:
            return new Error(
              "Authentication failed: Invalid or expired access token. Please refresh your OAuth token."
            );
          case 403:
            return new Error(
              "Permission denied: You don't have access to this data. Ensure your Oura membership is active."
            );
          case 404:
            return new Error(
              `Resource not found: ${data?.detail || "The requested data does not exist"}`
            );
          case 426:
            return new Error(
              "Upgrade required: This endpoint requires an active Oura membership. Please check your subscription status."
            );
          case 429:
            return new Error(
              "Rate limit exceeded: Too many requests. Oura API allows 5000 requests per day. Please wait before retrying."
            );
          case 500:
          case 502:
          case 503:
          case 504:
            return new Error(
              `Oura API server error (${status}): The Oura service is temporarily unavailable. Please try again later.`
            );
          default:
            return new Error(
              `API request failed with status ${status}: ${data?.detail || axiosError.message}`
            );
        }
      } else if (axiosError.code === "ECONNABORTED") {
        return new Error(
          "Request timeout: The Oura API took too long to respond. Please try again."
        );
      } else if (axiosError.code === "ENOTFOUND") {
        return new Error(
          "Network error: Unable to reach Oura API. Check your internet connection."
        );
      }
    }

    return error instanceof Error
      ? error
      : new Error(`Unexpected error: ${String(error)}`);
  }
}
