import { Controller, Get, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { Auth0Service } from "../services/auth0.service";
import { SessionService } from "../services/session.service";

@Controller()
export class LogoutController {
  constructor(
    private readonly auth0Service: Auth0Service,
    private readonly sessionService: SessionService,
  ) {}

  @Get("logout")
  logout(@Req() request: Request, @Res() response: Response): void {
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

    response.redirect(this.auth0Service.buildLogoutUrl(redirectUrl.toString()));
  }
}
