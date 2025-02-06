import { UseFetchOptions } from "nuxt/app";

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  pending: boolean;
}

interface ApiError {
  statusCode: number;
  message: string;
}

export function useApi() {
  const config = useRuntimeConfig();

  const defaultOptions: UseFetchOptions<unknown> = {
    baseURL: config.public.apiBaseUrl || 'http://localhost:3000/api',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  async function get<T>(endpoint: string, options: UseFetchOptions<T> = {}) {
    const response: ApiResponse<T> = {
      data: null,
      error: null,
      pending: true,
    };

    try {
      const { data, error } = await useFetch<T>(endpoint, {
        ...defaultOptions,
        ...options,
        method: 'GET',
      });

      if (error.value) {
        throw error.value;
      }

      response.data = data.value;
    } catch (err) {
      response.error = err as Error;
    } finally {
      response.pending = false;
    }

    return response;
  }

  async function post<T>(endpoint: string, body: unknown, options: UseFetchOptions<T> = {}) {
    const response: ApiResponse<T> = {
      data: null,
      error: null,
      pending: true,
    };

    try {
      const { data, error } = await useFetch<T>(endpoint, {
        ...defaultOptions,
        ...options,
        method: 'POST',
        body,
      });

      if (error.value) {
        throw error.value;
      }

      response.data = data.value;
    } catch (err) {
      response.error = err as Error;
    } finally {
      response.pending = false;
    }

    return response;
  }

  async function put<T>(endpoint: string, body: unknown, options: UseFetchOptions<T> = {}) {
    const response: ApiResponse<T> = {
      data: null,
      error: null,
      pending: true,
    };

    try {
      const { data, error } = await useFetch<T>(endpoint, {
        ...defaultOptions,
        ...options,
        method: 'PUT',
        body,
      });

      if (error.value) {
        throw error.value;
      }

      response.data = data.value;
    } catch (err) {
      response.error = err as Error;
    } finally {
      response.pending = false;
    }

    return response;
  }

  async function del<T>(endpoint: string, options: UseFetchOptions<T> = {}) {
    const response: ApiResponse<T> = {
      data: null,
      error: null,
      pending: true,
    };

    try {
      const { data, error } = await useFetch<T>(endpoint, {
        ...defaultOptions,
        ...options,
        method: 'DELETE',
      });

      if (error.value) {
        throw error.value;
      }

      response.data = data.value;
    } catch (err) {
      response.error = err as Error;
    } finally {
      response.pending = false;
    }

    return response;
  }

  async function patch<T>(endpoint: string, body: unknown, options: UseFetchOptions<T> = {}) {
    const response: ApiResponse<T> = {
      data: null,
      error: null,
      pending: true,
    };

    try {
      const { data, error } = await useFetch<T>(endpoint, {
        ...defaultOptions,
        ...options,
        method: 'PATCH',
        body,
      });

      if (error.value) {
        throw error.value;
      }

      response.data = data.value;
    } catch (err) {
      response.error = err as Error;
    } finally {
      response.pending = false;
    }

    return response;
  }

  return {
    get,
    post,
    put,
    patch,
    delete: del,
  };
}