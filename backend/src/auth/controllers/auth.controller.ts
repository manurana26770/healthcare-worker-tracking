import { Controller, Get, HttpStatus, Logger, Query, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthCallbackQueryDto } from "../dto/auth-callback-query.dto";
import { Auth0Service } from "../services/auth0.service";
import { AuthUserService } from "../services/auth-user.service";
import { SessionService } from "../services/session.service";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth0Service: Auth0Service,
    private readonly authUserService: AuthUserService,
    private readonly sessionService: SessionService,
  ) {}

  @Get("login")
  login(@Res() response: Response): void {
    try {
      const authUrl = this.auth0Service.buildAuthorizeUrl();
      response.redirect(authUrl);
    } catch (error) {
      this.logger.error("Login failed", error instanceof Error ? error.stack : String(error));
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Auth0 configuration missing" });
    }
  }

  @Get("signup")
  signup(@Res() response: Response): void {
    try {
      const authUrl = this.auth0Service.buildAuthorizeUrl();
      response.redirect(authUrl);
    } catch (error) {
      this.logger.error("Signup failed", error instanceof Error ? error.stack : String(error));
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Auth0 configuration missing" });
    }
  }

  @Get("callback")
  async callback(@Query() query: AuthCallbackQueryDto, @Res() response: Response): Promise<void> {
    const baseUrl = this.auth0Service.getBaseUrl();

    try {
      if (query.error) {
        const description = query.error_description ?? "";
        response.redirect(`${baseUrl}?error=${query.error}&description=${description}`);
        return;
      }

      if (!query.code) {
        response.redirect(`${baseUrl}?error=no_code`);
        return;
      }

      const tokens = await this.auth0Service.exchangeCodeForTokens(query.code);

      if (tokens.error) {
        response.redirect(`${baseUrl}?error=token_exchange_failed&details=${tokens.error}`);
        return;
      }

      const accessToken = typeof tokens.access_token === "string" ? tokens.access_token : "";
      if (!accessToken) {
        response.redirect(`${baseUrl}?error=token_exchange_failed&details=missing_access_token`);
        return;
      }

      const auth0User = await this.auth0Service.getUserInfo(accessToken);
      const { dbUser, enhancedUser, isNewUser } = await this.authUserService.findOrCreateUser(auth0User);
      const redirectUrl = this.authUserService.getRedirectUrl(baseUrl, isNewUser, dbUser.role);

      this.sessionService.setSessionCookie(response, {
        user: enhancedUser,
        tokens: tokens as Record<string, unknown>,
      });

      response.redirect(redirectUrl);
    } catch (error) {
      this.logger.error("Callback failed", error instanceof Error ? error.stack : String(error));
      response.redirect(`${baseUrl}?error=callback_failed`);
    }
  }

  @Get("session")
  session(@Req() request: Request): { user: Record<string, unknown> | null } {
    const session = this.sessionService.readSessionFromRequest(request);

    if (!session || !session.user) {
      return { user: null };
    }

    return { user: session.user };
  }

  @Get("logout")
  authLogout(@Req() request: Request, @Res() response: Response): void {
    this.handleLogout(request, response);
  }

  handleLogout(request: Request, response: Response): void {
    try {
      const requestUrl = new URL(request.url, `${request.protocol}://${request.get("host")}`);
      const redirectUrl = new URL("/", requestUrl.origin);
      redirectUrl.searchParams.set("logout", "true");
      redirectUrl.searchParams.set("t", Date.now().toString());

      this.sessionService.clearSessionCookie(response);
      response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      response.setHeader("Pragma", "no-cache");
      response.setHeader("Expires", "0");

      if (!this.auth0Service.isConfigured()) {
        response.redirect(redirectUrl.toString());
        return;
      }

      const auth0LogoutUrl = this.auth0Service.buildLogoutUrl(redirectUrl.toString());
      response.redirect(auth0LogoutUrl);
    } catch (error) {
      this.logger.error("Logout failed", error instanceof Error ? error.stack : String(error));
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Logout failed" });
    }
  }
}
