import { AuthError, AuthErrorType } from "~/types/auth";
import { useAuth } from "~/composables/useAuth";
import type { UseFetchOptions } from "#app";
import type { NitroFetchRequest, NitroFetchOptions } from "nitropack";

/**
 * Queue for storing requests that failed due to expired token
 */
let refreshQueue: Promise<void> | null = null;

/**
 * Type for request options
 */
type ApiOptions<T> = Omit<UseFetchOptions<T>, "method">;

/**
 * Type for HTTP methods
 */
type Method = "get" | "post" | "put" | "delete";

/**
 * Type for request handlers
 */
type RequestContext = {
  options: {
    headers?: Record<string, string>;
    [key: string]: unknown;
  };
};

/**
 * Type for response handlers
 */
type ResponseContext = {
  response: Response;
};

/**
 * Type for fetch options
 */
type FetchOptions = NitroFetchOptions<NitroFetchRequest, Method>;

/**
 * Composable for making authenticated API requests with automatic token refresh
 */
export const useAuthApi = () => {
  const auth = useAuth();
  const config = useRuntimeConfig();

  /**
   * Create base fetch options
   */
  const createFetchOptions = <T>(options: ApiOptions<T> = {}): FetchOptions => {
    const baseHeaders = {
      Authorization: `Bearer ${auth.accessToken.value}`,
      "Content-Type": "application/json",
    };

    const headers = {
      ...baseHeaders,
      ...(options.headers || {}),
    };

    return {
      baseURL: config.public.apiBase,
      headers,
      async onRequest({ options }: RequestContext) {
        // Check token expiration before request
        if (auth.isTokenExpired.value) {
          // If already refreshing, wait for it to complete
          if (refreshQueue) {
            await refreshQueue;
          } else {
            // Start new refresh
            refreshQueue = (async () => {
              try {
                await auth.refreshAccessToken();
              } catch (error) {
                auth.logout();
                navigateTo("/signin");
              } finally {
                refreshQueue = null;
              }
            })();
            await refreshQueue;
          }

          // Update Authorization header with new token
          const currentHeaders = options.headers || {};
          options.headers = {
            ...currentHeaders,
            Authorization: `Bearer ${auth.accessToken.value}`,
          };
        }
      },
      async onResponseError({ response }: ResponseContext) {
        if (response?.status === 401) {
          await auth.logout();
          navigateTo("/signin");
        }
      },
      ...options,
    } as FetchOptions;
  };

  /**
   * Make authenticated request with method
   */
  const request = <T>(
    method: Method,
    url: NitroFetchRequest,
    data?: Record<string, any>,
    options: ApiOptions<T> = {}
  ): Promise<T> => {
    if (!auth.isAuthenticated.value) {
      throw new AuthError(
        AuthErrorType.UNAUTHORIZED,
        "Authentication required"
      );
    }

    const fetchOptions = {
      ...createFetchOptions<T>(options),
      method,
    };

    if (data) {
      fetchOptions.body = data;
    }

    return $fetch<T>(url, fetchOptions);
  };

  return {
    get: <T>(url: NitroFetchRequest, options?: ApiOptions<T>) =>
      request<T>("get", url, undefined, options),

    post: <T>(
      url: NitroFetchRequest,
      data: Record<string, any>,
      options?: ApiOptions<T>
    ) => request<T>("post", url, data, options),

    put: <T>(
      url: NitroFetchRequest,
      data: Record<string, any>,
      options?: ApiOptions<T>
    ) => request<T>("put", url, data, options),

    delete: <T>(url: NitroFetchRequest, options?: ApiOptions<T>) =>
      request<T>("delete", url, undefined, options),
  };
};
