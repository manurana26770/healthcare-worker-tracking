import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SessionService } from '../services/session.service';

/**
 * AuthGuard - Extracts and validates session from cookies
 *
 * On successful extraction:
 * - Attaches req.user to the request if user exists in session
 * - Attaches req.session to the request with full session payload
 *
 * On failure:
 * - Throws UnauthorizedException if session is missing or malformed
 *
 * Usage: Apply to routes/controllers that require authentication
 *   @UseGuards(AuthGuard)
 *   async getSomething(@Req() req) { ... }
 *
 * With @CurrentUser decorator:
 *   @UseGuards(AuthGuard)
 *   async getSomething(@CurrentUser() user: AuthSessionPayload['user']) { ... }
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly sessionService: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Extract session from cookie header
    const session = this.sessionService.readSessionFromRequest(request);

    if (!session || !session.user) {
      this.logger.warn('Unauthorized attempt: no valid session');
      throw new UnauthorizedException({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // Attach session and user to request for downstream handlers
    request.session = session;
    request.user = session.user;

    this.logger.debug(
      `Session validated for user: ${session.user.email}`,
    );

    return true;
  }
}
