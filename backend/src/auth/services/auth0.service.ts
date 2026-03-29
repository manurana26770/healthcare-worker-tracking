import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import { Auth0TokenResponse } from "../types/auth-session.types";

@Injectable()
export class Auth0Service {
  constructor(private readonly configService: ConfigService) {}

  getBaseUrl(): string {
    return this.configService.get<string>("app.auth0BaseUrl", "http://localhost:3000");
  }

  getIssuerUrl(): string | undefined {
    return this.configService.get<string>("app.auth0IssuerBaseUrl");
  }

  getClientId(): string | undefined {
    return this.configService.get<string>("app.auth0ClientId");
  }

  getClientSecret(): string | undefined {
    return this.configService.get<string>("app.auth0ClientSecret");
  }

  getCallbackUrl(): string {
    return `${this.getBaseUrl()}/api/auth/callback`;
  }

  isConfigured(): boolean {
    return Boolean(this.getIssuerUrl() && this.getClientId());
  }

  buildAuthorizeUrl(): string {
    const issuerUrl = this.getIssuerUrl();
    const clientId = this.getClientId();

    if (!issuerUrl || !clientId) {
      throw new Error("Auth0 configuration missing");
    }

    const state = randomBytes(16).toString("hex");
    const authUrl = new URL("/authorize", issuerUrl);

    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", this.getCallbackUrl());
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("state", state);

    return authUrl.toString();
  }

  async exchangeCodeForTokens(code: string): Promise<Auth0TokenResponse> {
    const issuerUrl = this.getIssuerUrl();
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    if (!issuerUrl || !clientId || !clientSecret) {
      throw new Error("Auth0 configuration missing");
    }

    const tokenResponse = await fetch(`${issuerUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: this.getCallbackUrl(),
      }),
    });

    return (await tokenResponse.json()) as Auth0TokenResponse;
  }

  async getUserInfo(accessToken: string): Promise<Record<string, unknown>> {
    const issuerUrl = this.getIssuerUrl();

    if (!issuerUrl) {
      throw new Error("Auth0 issuer missing");
    }

    const userResponse = await fetch(`${issuerUrl}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return (await userResponse.json()) as Record<string, unknown>;
  }

  buildLogoutUrl(returnToUrl: string): string {
    const issuerUrl = this.getIssuerUrl();
    const clientId = this.getClientId();

    if (!issuerUrl || !clientId) {
      throw new Error("Auth0 configuration missing");
    }

    const encodedReturn = encodeURIComponent(returnToUrl);
    return `${issuerUrl}/v2/logout?client_id=${clientId}&returnTo=${encodedReturn}`;
  }
}
