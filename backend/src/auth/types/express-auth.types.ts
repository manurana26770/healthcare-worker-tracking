import { Request } from 'express';
import { AuthSessionPayload } from './auth-session.types';

/**
 * Extended Express Request type with auth context
 *
 * When AuthGuard validates and attaches user/session:
 * - request.user: The authenticated user from session
 * - request.session: Full session payload including tokens
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthSessionPayload['user'];
      session?: AuthSessionPayload;
    }
  }
}

/**
 * Ensure this file is treated as a module
 */
export {};
