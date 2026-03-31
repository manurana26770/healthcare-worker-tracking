import { Controller, Get, INestApplication, UseGuards } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { CurrentUser } from "../src/auth/decorators/current-user.decorator";
import { RequireRoles } from "../src/auth/decorators/roles.decorator";
import { AuthGuard } from "../src/auth/guards/auth.guard";
import { RolesGuard } from "../src/auth/guards/roles.guard";
import { SessionService } from "../src/auth/services/session.service";

@Controller("protected")
class ProtectedTestController {
  @Get("me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: Record<string, unknown>) {
    return { user };
  }

  @Get("manager")
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles("MANAGER", "ADMIN")
  manager(@CurrentUser() user: Record<string, unknown>) {
    return { ok: true, user };
  }
}

describe("AuthGuard + RolesGuard", () => {
  let app: INestApplication;

  jest.setTimeout(30000);

  beforeAll(async () => {
    process.env.NODE_ENV = "test";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProtectedTestController],
      providers: [SessionService, AuthGuard, RolesGuard],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("returns 401 for protected route when session cookie is missing", async () => {
    const response = await request(app.getHttpServer()).get("/api/protected/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authentication required");
  });

  it("returns 200 for protected route with valid session cookie", async () => {
    const session = encodeURIComponent(
      JSON.stringify({ user: { id: "u1", email: "worker@example.com", role: "CARE_WORKER" } }),
    );

    const response = await request(app.getHttpServer())
      .get("/api/protected/me")
      .set("Cookie", `auth0_session=${session}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("worker@example.com");
  });

  it("returns 403 when role does not satisfy requirement", async () => {
    const session = encodeURIComponent(
      JSON.stringify({ user: { id: "u1", email: "worker@example.com", role: "CARE_WORKER" } }),
    );

    const response = await request(app.getHttpServer())
      .get("/api/protected/manager")
      .set("Cookie", `auth0_session=${session}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toContain("Insufficient permissions");
  });

  it("returns 200 when user has required role", async () => {
    const session = encodeURIComponent(
      JSON.stringify({ user: { id: "u2", email: "manager@example.com", role: "MANAGER" } }),
    );

    const response = await request(app.getHttpServer())
      .get("/api/protected/manager")
      .set("Cookie", `auth0_session=${session}`);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.user.email).toBe("manager@example.com");
  });
});
