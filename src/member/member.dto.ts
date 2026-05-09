import { IsArray, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Permission, Role } from './member.enum';

export class AddMemberDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions?: Permission[];
}

export class UpdatePermissionsDto {
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}

export class UpdateRoleDto {
  @IsEnum(Role)
  role: Role;
}
