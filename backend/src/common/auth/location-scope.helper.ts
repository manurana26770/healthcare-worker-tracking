import { Injectable, Logger } from '@nestjs/common';
import { AuthSessionPayload } from '../../auth/types/auth-session.types';

/**
 * LocationScopeHelper - Scope Prisma queries by user location context
 *
 * Prevents users from accessing data outside their assigned location
 * Enforces data isolation at the query level
 *
 * Usage in services:
 *   @Injectable()
 *   export class StaffService {
 *     constructor(
 *       private prisma: PrismaService,
 *       private locationScope: LocationScopeHelper,
 *     ) {}
 *
 *     async getStaff(user: AuthSessionPayload['user']) {
 *       const locationFilter = this.locationScope.buildLocationFilter(user);
 *       return this.prisma.user.findMany({
 *         where: {
 *           ...locationFilter,
 *           role: 'CARE_WORKER',
 *         },
 *       });
 *     }
 *   }
 */
@Injectable()
export class LocationScopeHelper {
  private readonly logger = new Logger(LocationScopeHelper.name);

  /**
   * Build location filter for Prisma queries based on user role and location
   *
   * @param user Authenticated user from session
   * @returns Filter object suitable for Prisma where clauses
   *
   * Behavior:
   * - ADMIN: No location filter (can access all locations)
   * - MANAGER: Can access only own location and assigned locations
   * - CARE_WORKER: Can access only own location
   *
   * Note: Actual location field binding will depend on schema updates
   * Currently a placeholder pending Prisma schema alignment
   */
  buildLocationFilter(user: AuthSessionPayload['user']): Record<string, unknown> {
    // If user has no location info, return empty filter (handled by route guard)
    if (!user) {
      return {};
    }

    // TODO: Implement location scoping based on schema alignment
    // For now, return empty filter as User model doesn't have location field
    // Once schema is updated with locationId/location relation, implement:
    //
    // if (user.role === 'ADMIN') {
    //   return {}; // No restriction
    // }
    //
    // if (user.role === 'MANAGER') {
    //   return {
    //     OR: [
    //       { locationId: user.locationId },
    //       // managers can also access staff from their managed locations
    //       { location: { managedByUserId: user.id } },
    //     ];
    //   };
    // }
    //
    // if (user.role === 'CARE_WORKER') {
    //   return { locationId: user.locationId };
    // }

    this.logger.debug(
      `Location scoping evaluated for user ${user.email} (role: ${user.role})`,
    );

    return {};
  }

  /**
   * Check if user can access specific location
   *
   * @param user Authenticated user
   * @param locationId Location ID to check access for
   * @returns true if user has access to location
   */
  canAccessLocation(
    user: AuthSessionPayload['user'],
    locationId: string | null,
  ): boolean {
    if (!user || !locationId) {
      return false;
    }

    // ADMIN can access all locations
    if (user.role === 'ADMIN') {
      return true;
    }

    // Once schema is updated, check user.locationId === locationId
    // For now, return false as location data is not available
    return false;
  }

  /**
   * Enrich query results with location context for auditing
   *
   * @param user User performing the query
   * @param locationId Target location
   */
  logLocationAccess(user: AuthSessionPayload['user'], locationId: string): void {
    this.logger.debug(
      `[Location Access] User: ${user.email}, Role: ${user.role}, Location: ${locationId}`,
    );
  }
}
