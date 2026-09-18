export const RoleName = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const Permission = {
  TENANT_USERS_MANAGE: 'tenant.users.manage',
  PROJECT_VIEW_ASSIGNED: 'project.assigned.view',
  PROJECT_MANAGE_ASSIGNED: 'project.assigned.manage',
  PROJECT_MEMBERS_MANAGE: 'project.members.manage',
  TASK_VIEW_ASSIGNED: 'task.assigned.view',
  TASK_CREATE: 'task.create',
  TASK_UPDATE: 'task.update',
  TASK_UPDATE_ASSIGNED: 'task.assigned.update',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const rolePermissions: Record<RoleName, readonly Permission[]> = {
  [RoleName.ADMIN]: Object.values(Permission),
  [RoleName.MANAGER]: [
    Permission.PROJECT_VIEW_ASSIGNED,
    Permission.PROJECT_MANAGE_ASSIGNED,
    Permission.PROJECT_MEMBERS_MANAGE,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
  ],
  [RoleName.MEMBER]: [
    Permission.PROJECT_VIEW_ASSIGNED,
    Permission.TASK_VIEW_ASSIGNED,
    Permission.TASK_UPDATE_ASSIGNED,
  ],
};

export const isRoleName = (value: string): value is RoleName =>
  Object.values(RoleName).includes(value as RoleName);

export const isPermission = (value: string): value is Permission =>
  Object.values(Permission).includes(value as Permission);
