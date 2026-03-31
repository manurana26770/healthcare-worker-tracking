import { SessionService } from "../src/auth/services/session.service";
import { Request, Response } from "express";

describe("SessionService hardening", () => {
  let service: SessionService;

  beforeEach(() => {
    service = new SessionService();
  });

  it("returns null when cookie payload is malformed JSON", () => {
    const request = {
      headers: {
        cookie: "auth0_session=not-json",
      },
    } as Request;

    const session = service.readSessionFromRequest(request);
    expect(session).toBeNull();
  });

  it("falls back to user-only cookie payload when full session is too large", () => {
    const append = jest.fn();
    const response = { append } as unknown as Response;

    service.setSessionCookie(response, {
      user: { id: "u1", email: "care@example.com", role: "CARE_WORKER" },
      tokens: { access_token: "x".repeat(10000) },
    });

    expect(append).toHaveBeenCalledTimes(1);
    const setCookieHeader = String(append.mock.calls[0][1]);

    expect(setCookieHeader).toContain("auth0_session=");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("SameSite=Lax");

    const encodedValue = setCookieHeader.split(";")[0].replace("auth0_session=", "");
    const decodedValue = decodeURIComponent(encodedValue);

    expect(decodedValue).toContain("\"user\"");
    expect(decodedValue).not.toContain("access_token");
  });

  it("throws when even user payload is too large", () => {
    const append = jest.fn();
    const response = { append } as unknown as Response;

    expect(() =>
      service.setSessionCookie(response, {
        user: {
          id: "u1",
          email: "oversized@example.com",
          profileBlob: "y".repeat(20000),
        },
      }),
    ).toThrow("Session user payload exceeds cookie size limit");
  });
});
