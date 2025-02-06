/**
 * JWT payload structure
 */
export interface JwtPayload {
  /** User ID stored in the sub claim */
  sub: string;
  /** Token expiration timestamp */
  exp: number;
  /** Token issued at timestamp */
  iat: number;
  /** Optional user roles */
  roles?: string[];
  /** User email */
  email: string;
}

/**
 * Authentication tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  REFRESH_FAILED = "REFRESH_FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
}

/**
 * Authentication error
 */
export class AuthError extends Error {
  constructor(public type: AuthErrorType, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * User state stored in auth composable
 */
export interface AuthUser {
  id: string;
  roles: string[];
  email: string;
}
