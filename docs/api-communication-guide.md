# Nuxt 3 API Communication Guide

## Table of Contents

1. [Introduction](#introduction)
2. [API Communication Methods](#api-communication-methods)
3. [Building Reusable API Composables](#building-reusable-api-composables)
4. [Error Handling](#error-handling)
5. [Type Safety](#type-safety)
6. [Authentication](#authentication)
7. [Complex Scenarios](#complex-scenarios)
8. [Best Practices](#best-practices)

## Introduction

This guide covers comprehensive patterns for handling API communication in Nuxt 3 applications. We'll explore different approaches, their use cases, and best practices for building maintainable and type-safe API integrations.

## API Communication Methods

### $fetch

The global `$fetch` helper is the most basic method for making HTTP requests. It's best suited for:

- One-off API calls
- Server-side API calls
- Situations where you don't need automatic request state management

```typescript
// Basic usage
const data = await $fetch("https://api.example.com/posts");

// With options
const response = await $fetch("https://api.example.com/posts", {
  method: "POST",
  body: { title: "New Post" },
});
```

### useFetch

`useFetch` is the recommended composable for data fetching in components. It provides:

- Automatic request state management
- SSR support
- Built-in caching
- TypeScript support

```typescript
// Basic usage
const { data, pending, error, refresh } = await useFetch("/api/posts");

// With options
const { data, pending, error } = await useFetch("/api/posts", {
  method: "POST",
  body: { title: "New Post" },
  transform: (response) => response.data,
  pick: ["id", "title"],
});
```

### useAsyncData

`useAsyncData` is more flexible than `useFetch` and is ideal when you need:

- Custom async operations
- Multiple API calls
- Data transformation before caching

```typescript
const { data, pending, error, refresh } = await useAsyncData(
  "posts", // unique key
  async () => {
    const [posts, categories] = await Promise.all([
      $fetch("/api/posts"),
      $fetch("/api/categories"),
    ]);
    return {
      posts,
      categories,
      timestamp: Date.now(),
    };
  }
);
```

### useLazyFetch

`useLazyFetch` is similar to `useFetch` but doesn't block navigation:

```typescript
const { data, pending, error } = useLazyFetch("/api/posts");
```

## Building Reusable API Composables

### Base API Composable

Create a base composable for common API functionality:

```typescript
// composables/useApi.ts
export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase;

  const apiFetch = $fetch.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return {
    async get<T>(url: string, options = {}) {
      return await apiFetch<T>(url, {
        ...options,
        method: "GET",
      });
    },

    async post<T>(url: string, data: any, options = {}) {
      return await apiFetch<T>(url, {
        ...options,
        method: "POST",
        body: data,
      });
    },

    // Add other methods (PUT, DELETE, etc.)
  };
};
```

### Resource-specific Composables

Build composables for specific API resources:

```typescript
// composables/useUsers.ts
interface User {
  id: number;
  name: string;
  email: string;
}

export const useUsers = () => {
  const api = useApi();
  const {
    data: users,
    pending,
    error,
    refresh,
  } = useAsyncData("users", () => api.get<User[]>("/users"));

  const getUser = async (id: number) => {
    return await api.get<User>(`/users/${id}`);
  };

  const createUser = async (userData: Omit<User, "id">) => {
    return await api.post<User>("/users", userData);
  };

  return {
    users,
    pending,
    error,
    refresh,
    getUser,
    createUser,
  };
};
```

## Error Handling

### Global Error Handler

```typescript
// composables/useApi.ts
export const useApi = () => {
  const handleError = (error: any) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      navigateTo("/signin");
    } else if (error.response?.status === 404) {
      // Handle not found
      showError({ statusCode: 404, message: "Resource not found" });
    } else {
      // Handle other errors
      console.error("API Error:", error);
      throw error;
    }
  };

  const apiFetch = $fetch.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    onError: handleError,
  });

  // ... rest of the implementation
};
```

### Component-level Error Handling

```typescript
const { data, error } = await useFetch("/api/posts", {
  onError: (error) => {
    // Handle component-specific errors
    useToast().error({
      title: "Error",
      message: error.message,
    });
  },
});
```

## Type Safety

### API Response Types

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    perPage: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Using with composables
const { data } = await useFetch<ApiResponse<User[]>>("/api/users");
```

### Request Types

```typescript
// types/api.ts
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface UserFilters extends PaginationParams {
  role?: string;
  status?: "active" | "inactive";
}

// Using in composables
export const useUsers = () => {
  const getUsers = (filters: UserFilters) => {
    return api.get<ApiResponse<User[]>>("/users", {
      params: filters,
    });
  };
};
```

## Authentication

### JWT Authentication Implementation

```typescript
// types/auth.ts
interface JwtPayload {
  sub: string; // User ID
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  roles?: string[]; // Optional user roles
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// composables/useAuth.ts
export const useAuth = () => {
  const accessToken = useCookie("access_token", {
    maxAge: 3600, // 1 hour
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  const refreshToken = useCookie("refresh_token", {
    maxAge: 7 * 24 * 3600, // 7 days
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  const user = useState<JwtPayload | null>("auth_user", () => null);

  const isAuthenticated = computed(() => !!accessToken.value);
  const isTokenExpired = computed(() => {
    if (!accessToken.value) return true;
    const payload = decodeJwt(accessToken.value);
    return Date.now() >= payload.exp * 1000;
  });

  const login = async (credentials: { email: string; password: string }) => {
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await $fetch<AuthTokens>("/api/auth/login", {
        method: "POST",
        body: credentials,
      });

    accessToken.value = newAccessToken;
    refreshToken.value = newRefreshToken;
    user.value = decodeJwt(newAccessToken);
  };

  const refreshAccessToken = async () => {
    if (!refreshToken.value) throw new Error("No refresh token");

    const { accessToken: newAccessToken } = await $fetch<AuthTokens>(
      "/api/auth/refresh",
      {
        method: "POST",
        body: { refreshToken: refreshToken.value },
      }
    );

    accessToken.value = newAccessToken;
    user.value = decodeJwt(newAccessToken);
    return newAccessToken;
  };

  const logout = async () => {
    // Invalidate refresh token on the server
    if (refreshToken.value) {
      try {
        await $fetch("/api/auth/logout", {
          method: "POST",
          body: { refreshToken: refreshToken.value },
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    // Clear tokens and user data
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
  };

  return {
    accessToken,
    user,
    isAuthenticated,
    isTokenExpired,
    login,
    refreshAccessToken,
    logout,
  };
};

// composables/useAuthApi.ts
export const useAuthApi = () => {
  const auth = useAuth();
  const config = useRuntimeConfig();

  // Queue for storing requests that failed due to expired token
  let refreshQueue: Promise<void> | null = null;

  const authFetch = $fetch.create({
    baseURL: config.public.apiBase,
    headers: () => ({
      Authorization: `Bearer ${auth.accessToken.value}`,
    }),
    async onRequest({ options }) {
      // Check token expiration before request
      if (auth.isTokenExpired.value) {
        // If already refreshing, wait for it to complete
        if (refreshQueue) {
          await refreshQueue;
        } else {
          // Start new refresh
          refreshQueue = auth
            .refreshAccessToken()
            .catch(() => {
              // If refresh fails, redirect to login
              auth.logout();
              navigateTo("/signin");
            })
            .finally(() => {
              refreshQueue = null;
            });
          await refreshQueue;
        }

        // Update Authorization header with new token
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${auth.accessToken.value}`,
        };
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        await auth.logout();
        navigateTo("/signin");
      }
    },
  });

  return {
    async get<T>(url: string, options = {}) {
      if (!auth.isAuthenticated.value) {
        throw new Error("Authentication required");
      }

      return await authFetch<T>(url, {
        ...options,
        method: "GET",
      });
    },

    async post<T>(url: string, data: any, options = {}) {
      if (!auth.isAuthenticated.value) {
        throw new Error("Authentication required");
      }

      return await authFetch<T>(url, {
        ...options,
        method: "POST",
        body: data,
      });
    },
    // ... other methods
  };
};
```

### Key JWT Authentication Features

1. **Secure Token Storage**

   - HTTP-only cookies for both access and refresh tokens
   - Appropriate expiration times (1 hour for access token, 7 days for refresh token)
   - Secure cookie options (httpOnly, secure, sameSite)
   - Type-safe JWT payload handling

2. **Automatic Token Management**

   - Token expiration checking before requests
   - Automatic token refresh mechanism
   - Request queuing during token refresh
   - Concurrent refresh request prevention

3. **Security Best Practices**

   - Server-side token invalidation on logout
   - Proper error handling for failed refreshes
   - Automatic redirection on authentication failures
   - Protection against token exposure

4. **Type Safety**

   - Strong typing for JWT payload
   - Type-safe authentication state
   - Proper error handling with TypeScript

5. **Request Handling**
   - Automatic token injection in requests
   - Request queuing during token refresh
   - Proper cleanup on authentication failures
   - Consistent error handling

## Complex Scenarios

### Dependent Data Fetching

```typescript
const useUserPosts = (userId: number) => {
  const { data: user } = await useFetch<User>(`/api/users/${userId}`);

  const { data: posts } = await useAsyncData(
    `user-${userId}-posts`,
    async () => {
      if (!user.value) return [];
      return await $fetch(`/api/users/${userId}/posts`);
    },
    {
      watch: [user],
    }
  );

  return {
    user,
    posts,
  };
};
```

### Optimistic Updates

```typescript
const useOptimisticPosts = () => {
  const { data: posts, refresh } = await useFetch<Post[]>("/api/posts");

  const addPost = async (newPost: Omit<Post, "id">) => {
    // Optimistically add the post
    posts.value = [...posts.value, { id: "temp", ...newPost }];

    try {
      // Make the actual API call
      await $fetch("/api/posts", {
        method: "POST",
        body: newPost,
      });
      // Refresh to get the real data
      await refresh();
    } catch (error) {
      // Revert on error
      posts.value = posts.value.filter((p) => p.id !== "temp");
      throw error;
    }
  };

  return {
    posts,
    addPost,
  };
};
```

## Best Practices

1. **Request Caching**

   - Use unique keys for `useAsyncData` and `useFetch`
   - Implement stale-while-revalidate pattern for frequently changing data
   - Clear cache when needed using `clearNuxtData()`

2. **Performance**

   - Use `useLazyFetch` for below-the-fold content
   - Implement request debouncing for search inputs
   - Use `pick` to select only needed fields

3. **Error Handling**

   - Implement global error handling
   - Add specific error handling for critical operations
   - Provide user-friendly error messages

4. **Type Safety**

   - Define interfaces for all API responses
   - Use TypeScript generics for reusable composables
   - Validate API responses against types

5. **Authentication**

   - Handle token refresh automatically
   - Implement request queuing during token refresh
   - Clear sensitive data on logout

6. **Testing**
   - Mock API calls in tests
   - Test error scenarios
   - Verify loading states

Remember to adapt these patterns based on your specific needs and requirements. The key is to maintain consistency across your application while ensuring type safety and good error handling.
