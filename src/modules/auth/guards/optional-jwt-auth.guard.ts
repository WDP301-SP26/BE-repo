import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

export interface RequestUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Override handleRequest to allow requests without authentication
   * @param err - Error from JWT validation
   * @param user - User object from JWT strategy's validate() method
   * @returns User object if authenticated, null otherwise
   */
  handleRequest<TUser = RequestUser>(
    err: Error | null,
    user: TUser | false,
  ): TUser | null {
    // Return user if authenticated, otherwise return null (don't throw error)
    if (err || !user) {
      return null;
    }
    return user;
  }

  /**
   * Determine if the request should be allowed to proceed
   * @param context - Execution context
   * @returns Boolean or Promise/Observable of boolean
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Call parent canActivate but catch any errors to make authentication optional
    const result = super.canActivate(context);

    if (result instanceof Promise) {
      return result.catch(() => true);
    }

    if (result instanceof Observable) {
      return result;
    }

    return result;
  }
}
