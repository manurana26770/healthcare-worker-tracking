import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role-based access control guard
 *
 * Checks if authenticated user has at least one of the required roles
 * Must be used AFTER AuthGuard (which validates session and attaches req.user)
 *
 * Usage:
 *   @UseGuards(AuthGuard, RolesGuard)
 *   @RequireRoles('MANAGER', 'ADMIN')
 *   @Get('manager-dashboard')
 *   async getManagerDashboard(@CurrentUser() user) { ... }
 *
 * If no roles are specified via @RequireRoles, the guard allows all authenticated users
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // If no roles specified, allow all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      this.logger.warn('Forbidden: User has no role assigned');
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        code: 'ROLE_REQUIRED',
        requiredRoles,
      });
    }

    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      this.logger.warn(
        `Forbidden: User role '${user.role}' not in required roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException({
        message: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE',
        userRole: user.role,
        requiredRoles,
      });
    }

    this.logger.debug(`User ${user.email} authorized with role: ${user.role}`);
    return true;
  }
}
