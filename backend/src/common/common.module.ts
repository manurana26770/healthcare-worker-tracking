import { Module } from '@nestjs/common';
import { LocationScopeHelper } from './auth/location-scope.helper';

/**
 * Common module - Shared utilities and services used across the application
 *
 * Includes:
 * - LocationScopeHelper: Prisma query scoping by user location
 * - Exception filters and validation factories (bootstrapped globally)
 * - Other cross-cutting concerns as they arise
 */
@Module({
  providers: [LocationScopeHelper],
  exports: [LocationScopeHelper],
})
export class CommonModule {}
