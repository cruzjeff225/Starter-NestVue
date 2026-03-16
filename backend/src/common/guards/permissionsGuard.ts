import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissionsRequired = this.reflector.get<string[]>(
      'permisos',
      context.getHandler(),
    );
    if (!permissionsRequired) return true;

    const { user } = context.switchToHttp().getRequest();
    const permissionsUser: string[] = user?.permissions ?? [];

    if (permissionsUser.includes('superadmin:todo')) return true;

    return permissionsRequired.every((p) => permissionsUser.includes(p));
  }
}
