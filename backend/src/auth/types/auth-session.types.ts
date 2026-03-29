export interface AuthSessionPayload {
  user: Record<string, unknown>;
  tokens?: Record<string, unknown>;
}

export interface Auth0TokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
  [key: string]: unknown;
}
