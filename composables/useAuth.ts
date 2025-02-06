import { AuthError, AuthErrorType } from "~/types/auth";
import type {
  AuthTokens,
  JwtPayload,
  LoginCredentials,
  AuthUser,
} from "~/types/auth";
import { jwtDecode } from "jwt-decode";

/**
 * Composable for handling JWT authentication
 */
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

  const user = useState<AuthUser | null>("auth_user", () => null);
  const loading = useState<boolean>("auth_loading", () => false);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  /**
   * Check if access token is expired
   */
  const isTokenExpired = computed(() => {
    if (!accessToken.value) return true;
    try {
      const payload = jwtDecode<JwtPayload>(accessToken.value);
      // Add 10s buffer to prevent edge cases
      return Date.now() >= payload.exp * 1000 - 10000;
    } catch {
      return true;
    }
  });

  /**
   * Parse JWT payload into user data
   */
  const parseUserFromToken = (token: string): AuthUser => {
    const payload = jwtDecode<JwtPayload>(token);
    return {
      id: payload.sub,
      roles: payload.roles || [],
      email: payload.email || "",
    };
  };

  /**
   * Login with email and password
   */
  const login = async (credentials: LoginCredentials) => {
    loading.value = true;
    try {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await $fetch<AuthTokens>("/api/auth/login", {
          method: "POST",
          body: credentials,
        });

      accessToken.value = newAccessToken;
      refreshToken.value = newRefreshToken;
      user.value = parseUserFromToken(newAccessToken);
    } catch (error: any) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        error.message || "Invalid credentials"
      );
    } finally {
      loading.value = false;
    }
  };

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = async (): Promise<string> => {
    if (!refreshToken.value) {
      throw new AuthError(
        AuthErrorType.REFRESH_FAILED,
        "No refresh token available"
      );
    }

    try {
      const { accessToken: newAccessToken } = await $fetch<AuthTokens>(
        "/api/auth/refresh",
        {
          method: "POST",
          body: { refreshToken: refreshToken.value },
        }
      );

      accessToken.value = newAccessToken;
      user.value = parseUserFromToken(newAccessToken);
      return newAccessToken;
    } catch (error: any) {
      throw new AuthError(
        AuthErrorType.REFRESH_FAILED,
        error.message || "Failed to refresh token"
      );
    }
  };

  /**
   * Logout user and clear auth state
   */
  const logout = async () => {
    loading.value = true;
    try {
      // Invalidate refresh token on server
      if (refreshToken.value) {
        await $fetch("/api/auth/logout", {
          method: "POST",
          body: { refreshToken: refreshToken.value },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear auth state
      accessToken.value = null;
      refreshToken.value = null;
      user.value = null;
      loading.value = false;
    }
  };

  /**
   * Check if user has required role
   */
  const hasRole = (role: string): boolean => {
    return user.value?.roles.includes(role) || false;
  };

  /**
   * Initialize auth state from stored tokens
   */
  const initialize = async () => {
    loading.value = true;
    try {
      if (accessToken.value) {
        if (isTokenExpired.value) {
          await refreshAccessToken();
        } else {
          user.value = parseUserFromToken(accessToken.value);
        }
      }
    } catch (error) {
      // Clear invalid auth state
      accessToken.value = null;
      refreshToken.value = null;
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Initialize auth state on client
  if (process.client) {
    initialize();
  }

  return {
    // State
    user,
    loading,
    isAuthenticated,
    isTokenExpired,
    accessToken,

    // Methods
    login,
    logout,
    refreshAccessToken,
    hasRole,
  };
};
