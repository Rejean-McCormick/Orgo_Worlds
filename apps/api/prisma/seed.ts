import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { passwordHash } from '../src/orgo/modules/identity/identity.service';
import { hash } from '../src/orgo/platform/contracts';

async function seed() {
  const password = process.env.ORGO_ADMIN_PASSWORD;
  if (!password || password.length < 12)
    throw new Error('Set ORGO_ADMIN_PASSWORD to at least 12 characters.');
  const db = new PrismaClient();
  try {
    const slug = process.env.ORGO_ORGANIZATION ?? 'orgo-worlds';
    const email = (
      process.env.ORGO_ADMIN_EMAIL ?? 'admin@example.test'
    ).toLowerCase();
    const digest = await passwordHash(password);
    await db.$transaction(async (tx) => {
      const organization = await tx.organization.upsert({
        where: { slug },
        create: {
          slug,
          display_name: process.env.ORGO_ORGANIZATION_NAME ?? 'Orgo Worlds',
          status: 'active',
          timezone: 'UTC',
          default_locale: 'fr-CA',
        },
        update: {},
      });
      const user = await tx.userAccount.upsert({
        where: {
          organization_id_email: { organization_id: organization.id, email },
        },
        create: {
          organization_id: organization.id,
          email,
          display_name: 'Administrateur',
          password_hash: digest,
          auth_provider: 'local',
          status: 'active',
        },
        update: {},
      });
      const role = await tx.role.upsert({
        where: {
          organization_id_code: {
            organization_id: organization.id,
            code: 'administrator',
          },
        },
        create: {
          organization_id: organization.id,
          code: 'administrator',
          display_name: 'Administrateur',
          description: 'Administration Orgo',
          is_system_role: true,
        },
        update: {},
      });
      const permission = await tx.permission.upsert({
        where: { code: '*' },
        create: { code: '*', description: 'All organization permissions' },
        update: {},
      });
      if (
        !(await tx.rolePermission.findFirst({
          where: { role_id: role.id, permission_id: permission.id },
        }))
      )
        await tx.rolePermission.create({
          data: {
            role_id: role.id,
            permission_id: permission.id,
            granted_at: new Date(),
          },
        });
      if (
        !(await tx.userRoleAssignment.findFirst({
          where: { user_id: user.id, role_id: role.id, revoked_at: null },
        }))
      )
        await tx.userRoleAssignment.create({
          data: {
            user_id: user.id,
            role_id: role.id,
            assigned_at: new Date(),
            scope_type: 'global',
          },
        });
      const world = await tx.world.upsert({
        where: {
          organization_id_key: { organization_id: organization.id, key: 'main' },
        },
        create: {
          organization_id: organization.id,
          key: 'main',
          title: 'Main',
          description: 'Default operational World.',
          visibility: 'organization',
          is_default: true,
          created_by_user_id: user.id,
        },
        update: { is_default: true },
      });
      let release = await tx.worldRelease.findFirst({
        where: { world_id: world.id, status: 'current' },
      });
      if (!release) {
        release = await tx.worldRelease.create({
          data: {
            organization_id: organization.id,
            world_id: world.id,
            release_number: 1,
            status: 'current',
            label: 'Initial',
            config: {},
            content_hash: hash({ world: 'main', release: 1, config: {} }),
            created_by_user_id: user.id,
            promoted_at: new Date(),
          },
        });
        await tx.world.update({
          where: { id: world.id },
          data: { current_release_id: release.id },
        });
      } else if (world.current_release_id !== release.id) {
        await tx.world.update({
          where: { id: world.id },
          data: { current_release_id: release.id },
        });
      }
      await tx.worldMembership.upsert({
        where: { world_id_user_id: { world_id: world.id, user_id: user.id } },
        create: {
          organization_id: organization.id,
          world_id: world.id,
          user_id: user.id,
          role: 'owner',
        },
        update: { role: 'owner', is_active: true },
      });

      await tx.organizationProfile.upsert({
        where: { organization_id: organization.id },
        create: {
          organization_id: organization.id,
          profile_code: 'general',
          version: 1,
          reactivity_profile: { default_seconds: 43200 },
          transparency_profile: {},
          pattern_sensitivity_profile: {},
          retention_profile: {},
        },
        update: {},
      });
    });
    console.log(
      'Organization, administrator, Main World and initial release provisioned. Existing passwords are preserved.',
    );
  } finally {
    await db.$disconnect();
  }
}
seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
