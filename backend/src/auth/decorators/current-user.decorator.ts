import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthSessionPayload } from '../types/auth-session.types';

/**
 * @CurrentUser - Injects the authenticated user into handler methods
 *
 * Extracts req.user (set by AuthGuard) and passes it to the handler function
 *
 * Usage:
 *   @UseGuards(AuthGuard)
 *   @Get('profile')
 *   async getProfile(@CurrentUser() user: AuthSessionPayload['user']) {
 *     return { user };
 *   }
 *
 * The guard (AuthGuard) must be applied before this decorator will work
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
