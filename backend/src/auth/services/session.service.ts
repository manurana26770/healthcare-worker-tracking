import { Injectable } from "@nestjs/common";
import { serialize, parse } from "cookie";
import { Request, Response } from "express";
import { AuthSessionPayload } from "../types/auth-session.types";

const SESSION_COOKIE_NAME = "auth0_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

@Injectable()
export class SessionService {
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

    try {
      const session = JSON.parse(raw) as AuthSessionPayload;
      if (!session.user) {
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  setSessionCookie(response: Response, session: AuthSessionPayload): void {
    const serialized = serialize(SESSION_COOKIE_NAME, JSON.stringify(session), {
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
}
