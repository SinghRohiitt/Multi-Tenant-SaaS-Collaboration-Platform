import { prisma } from '../../database/prisma.js';
import { Permission, RoleName, rolePermissions } from './rbac.js';

/** Creates the canonical RBAC catalog for a tenant. Safe to invoke repeatedly. */
export const provisionTenantRbac = async (tenantId: string): Promise<void> => {
  await prisma.$transaction(async (transaction) => {
    for (const code of Object.values(Permission)) {
      await transaction.permission.upsert({
        where: { code },
        create: { code },
        update: {},
      });
    }

    for (const [name, permissions] of Object.entries(rolePermissions) as [
      RoleName,
      readonly Permission[],
    ][]) {
      const role = await transaction.role.upsert({
        where: { tenantId_name: { tenantId, name } },
        create: { tenantId, name },
        update: {},
      });
      for (const code of permissions) {
        const permission = await transaction.permission.findUniqueOrThrow({ where: { code } });
        await transaction.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
          create: { roleId: role.id, permissionId: permission.id },
          update: {},
        });
      }
    }
  });
};

export const assignRole = async (
  userId: string,
  tenantId: string,
  roleName: RoleName,
): Promise<void> => {
  await provisionTenantRbac(tenantId);
  const role = await prisma.role.findUniqueOrThrow({
    where: { tenantId_name: { tenantId, name: roleName } },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
};
