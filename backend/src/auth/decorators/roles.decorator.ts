import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for storing required roles on route handlers
 */
export const ROLES_KEY = 'roles';

/**
 * @RequireRoles - Decorator to specify role requirements for a route
 *
 * Must be used with RolesGuard:
 *   @UseGuards(AuthGuard, RolesGuard)
 *   @RequireRoles('MANAGER', 'ADMIN')
 *   @Get('dashboard')
 *   async getDashboard(@CurrentUser() user) { ... }
 *
 * If @RequireRoles is not specified, RolesGuard allows all authenticated users
 *
 * Supported role values (from Prisma schema):
 * - 'CARE_WORKER': Line worker role
 * - 'MANAGER': Manager role with staff oversight
 * - 'ADMIN': Full system admin access
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);
