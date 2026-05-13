import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../domain/member.enum';

export const PERMISSION_KEY = 'permission';
export const RequiresPermission = (permission: Permission) =>
  SetMetadata(PERMISSION_KEY, permission);
