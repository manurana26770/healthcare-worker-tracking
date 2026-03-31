import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { Auth0Service } from "../src/auth/services/auth0.service";

describe("Phase 3F Auth Parity", () => {
  let app: INestApplication;
  let auth0Service: Auth0Service;

  jest.setTimeout(30000);

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.AUTH0_ISSUER_BASE_URL = "https://tenant.example.auth0.com";
    process.env.AUTH0_CLIENT_ID = "test-client-id";
    process.env.AUTH0_CLIENT_SECRET = "test-client-secret";
    process.env.AUTH0_BASE_URL = "http://localhost:3000";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();

    auth0Service = app.get(Auth0Service);
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/auth/session returns user: null when no cookie", async () => {
    const response = await request(app.getHttpServer()).get("/api/auth/session");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: null });
  });

  it("GET /api/auth/session returns user: null for malformed cookie", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/auth/session")
      .set("Cookie", "auth0_session=not-json");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: null });
  });

  it("GET /api/auth/session returns user from valid cookie payload", async () => {
    const sessionPayload = encodeURIComponent(
      JSON.stringify({ user: { id: "u_123", email: "person@example.com", role: "CARE_WORKER" } }),
    );

    const response = await request(app.getHttpServer())
      .get("/api/auth/session")
      .set("Cookie", `auth0_session=${sessionPayload}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: "u_123",
        email: "person@example.com",
        role: "CARE_WORKER",
      },
    });
  });

  it("GET /api/auth/login redirects to Auth0 authorize URL", async () => {
    const response = await request(app.getHttpServer()).get("/api/auth/login");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("https://tenant.example.auth0.com/authorize");
    expect(response.headers.location).toContain("response_type=code");
    expect(response.headers.location).toContain("client_id=test-client-id");
    expect(response.headers.location).toContain(
      encodeURIComponent("http://localhost:3000/api/auth/callback"),
    );
    expect(response.headers.location).toContain("scope=openid+profile+email");
    expect(response.headers.location).toContain("state=");
  });

  it("GET /api/auth/signup redirects to Auth0 authorize URL", async () => {
    const response = await request(app.getHttpServer()).get("/api/auth/signup");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("https://tenant.example.auth0.com/authorize");
    expect(response.headers.location).toContain("response_type=code");
    expect(response.headers.location).toContain("client_id=test-client-id");
  });

  it("GET /api/auth/callback redirects with upstream error", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/auth/callback?error=access_denied&error_description=cancelled",
    );

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      "http://localhost:3000?error=access_denied&description=cancelled",
    );
  });

  it("GET /api/auth/callback redirects with no_code when missing code", async () => {
    const response = await request(app.getHttpServer()).get("/api/auth/callback");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("http://localhost:3000?error=no_code");
  });

  it("GET /api/auth/callback redirects when token exchange returns error", async () => {
    jest
      .spyOn(auth0Service, "exchangeCodeForTokens")
      .mockResolvedValueOnce({ error: "invalid_grant" });

    const response = await request(app.getHttpServer()).get("/api/auth/callback?code=abc123");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      "http://localhost:3000?error=token_exchange_failed&details=invalid_grant",
    );
  });

  it("GET /api/logout clears auth cookie and redirects to Auth0 logout", async () => {
    const response = await request(app.getHttpServer()).get("/api/logout");

    expect(response.status).toBe(302);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("auth0_session=")]),
    );
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("Max-Age=0")]),
    );
    expect(response.headers["cache-control"]).toBe("no-cache, no-store, must-revalidate");
    expect(response.headers.location).toContain("https://tenant.example.auth0.com/v2/logout");
    expect(response.headers.location).toContain("client_id=test-client-id");
    expect(response.headers.location).toContain("returnTo=");
  });

  it("GET /api/auth/logout behaves like /api/logout", async () => {
    const response = await request(app.getHttpServer()).get("/api/auth/logout");

    expect(response.status).toBe(302);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("auth0_session=")]),
    );
    expect(response.headers.location).toContain("https://tenant.example.auth0.com/v2/logout");
  });
});
