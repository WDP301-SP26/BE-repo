import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to allow requests without authentication
  handleRequest(err: any, user: any) {
    // Return user if authenticated, otherwise return null (don't throw error)
    return user;
  }

  canActivate(context: ExecutionContext) {
    // Add your custom logic here if needed
    return super.canActivate(context) as boolean | Promise<boolean>;
  }
}
