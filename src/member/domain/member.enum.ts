export enum Permission {
  EDIT_CHAT_INFO = 'edit_chat_info',
  ADD_MEMBERS = 'add_members',
  BAN_MEMBERS = 'ban_members',
  SEND_MESSAGES = 'send_messages',
  EDIT_PERMISSIONS = 'edit_permissions',
  DELETE_MESSAGES = 'delete_messages',
}

export enum Role {
  MEMBER = 'member',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export const ROLE_RANK: Record<Role, number> = {
  [Role.MEMBER]: 0,
  [Role.ADMIN]: 1,
  [Role.SUPER_ADMIN]: 2,
};

export const DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.MEMBER]: [Permission.SEND_MESSAGES],
  [Role.ADMIN]: [
    Permission.EDIT_CHAT_INFO,
    Permission.ADD_MEMBERS,
    Permission.BAN_MEMBERS,
    Permission.SEND_MESSAGES,
    Permission.DELETE_MESSAGES,
  ],
  [Role.SUPER_ADMIN]: Object.values(Permission),
};
