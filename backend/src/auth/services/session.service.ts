import { Injectable, Logger } from "@nestjs/common";
import { serialize, parse } from "cookie";
import { Request, Response } from "express";
import { AuthSessionPayload } from "../types/auth-session.types";

const SESSION_COOKIE_NAME = "auth0_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const MAX_SESSION_COOKIE_BYTES = 3800;

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  readSessionFromRequest(request: Request): AuthSessionPayload | null {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    const cookies = parse(cookieHeader);
    const raw = cookies[SESSION_COOKIE_NAME];

    if (!raw) {
      return null;
    }

    // Protect against oversized cookies and malformed payloads.
    if (raw.length > MAX_SESSION_COOKIE_BYTES * 2) {
      this.logger.warn("Session cookie too large; ignoring payload");
      return null;
    }

    try {
      const session = JSON.parse(raw) as AuthSessionPayload;
      if (!this.isValidSession(session)) {
        return null;
      }

      return session;
    } catch (error) {
      this.logger.warn(
        `Failed to parse session cookie: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  setSessionCookie(response: Response, session: AuthSessionPayload): void {
    const sessionValue = this.serializeSessionPayload(session);
    const serialized = serialize(SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    response.append("Set-Cookie", serialized);
  }

  clearSessionCookie(response: Response): void {
    const serialized = serialize(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    response.append("Set-Cookie", serialized);
  }

  private isValidSession(session: unknown): session is AuthSessionPayload {
    if (!session || typeof session !== "object") {
      return false;
    }

    const payload = session as AuthSessionPayload;
    return Boolean(payload.user && typeof payload.user === "object");
  }

  private serializeSessionPayload(session: AuthSessionPayload): string {
    const fullPayload = JSON.stringify(session);

    if (Buffer.byteLength(fullPayload, "utf8") <= MAX_SESSION_COOKIE_BYTES) {
      return fullPayload;
    }

    this.logger.warn("Session payload exceeds cookie size limit; writing user-only session payload");

    const userOnlyPayload = JSON.stringify({ user: session.user });
    if (Buffer.byteLength(userOnlyPayload, "utf8") <= MAX_SESSION_COOKIE_BYTES) {
      return userOnlyPayload;
    }

    throw new Error("Session user payload exceeds cookie size limit");
  }
}
