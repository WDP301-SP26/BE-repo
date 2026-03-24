import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Role } from '../../../entities';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RolesRequest extends Request {
  user?: {
    role?: string;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private isRole(value: string | undefined): value is Role {
    return !!value && Object.values(Role).includes(value as Role);
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RolesRequest>();
    const userRole = request.user?.role;

    if (!this.isRole(userRole)) {
      return false;
    }

    return requiredRoles.includes(userRole);
  }
}
