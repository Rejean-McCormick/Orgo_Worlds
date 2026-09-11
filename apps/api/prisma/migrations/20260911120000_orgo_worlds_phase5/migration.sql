-- Orgo Worlds standalone — phases 1..5
-- Control plane, runtime pinning, core work scoping, default-world backfill.

CREATE TYPE "public"."world_status_enum" AS ENUM ('active', 'maintenance', 'archived');
CREATE TYPE "public"."world_visibility_enum" AS ENUM ('organization', 'private');
CREATE TYPE "public"."world_release_status_enum" AS ENUM ('draft', 'ready', 'current', 'failed', 'archived');
CREATE TYPE "public"."world_membership_role_enum" AS ENUM ('owner', 'maintainer', 'member', 'viewer');

CREATE TABLE "public"."worlds" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "public"."world_status_enum" NOT NULL DEFAULT 'active',
    "visibility" "public"."world_visibility_enum" NOT NULL DEFAULT 'private',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "current_release_id" UUID,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMPTZ(6),
    CONSTRAINT "worlds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."world_releases" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "world_id" UUID NOT NULL,
    "release_number" INTEGER NOT NULL,
    "status" "public"."world_release_status_enum" NOT NULL DEFAULT 'draft',
    "label" TEXT NOT NULL DEFAULT '',
    "config" JSONB NOT NULL DEFAULT '{}',
    "content_hash" TEXT NOT NULL,
    "parent_release_id" UUID,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promoted_at" TIMESTAMPTZ(6),
    CONSTRAINT "world_releases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."world_memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "world_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "public"."world_membership_role_enum" NOT NULL DEFAULT 'viewer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "world_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."world_audit_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "world_id" UUID NOT NULL,
    "release_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "world_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "worlds_organization_id_key_key" ON "public"."worlds"("organization_id", "key");
CREATE UNIQUE INDEX "worlds_organization_id_id_key" ON "public"."worlds"("organization_id", "id");
CREATE INDEX "worlds_organization_id_status_idx" ON "public"."worlds"("organization_id", "status");
CREATE UNIQUE INDEX "worlds_one_default_per_organization_idx" ON "public"."worlds"("organization_id") WHERE "is_default" = true;
CREATE UNIQUE INDEX "world_releases_world_id_release_number_key" ON "public"."world_releases"("world_id", "release_number");
CREATE UNIQUE INDEX "world_releases_world_id_id_key" ON "public"."world_releases"("world_id", "id");
CREATE UNIQUE INDEX "world_releases_organization_id_id_key" ON "public"."world_releases"("organization_id", "id");
CREATE INDEX "world_releases_organization_id_world_id_status_idx" ON "public"."world_releases"("organization_id", "world_id", "status");
CREATE UNIQUE INDEX "world_releases_one_current_per_world_idx" ON "public"."world_releases"("world_id") WHERE "status" = 'current';
CREATE UNIQUE INDEX "world_memberships_world_id_user_id_key" ON "public"."world_memberships"("world_id", "user_id");
CREATE INDEX "world_memberships_organization_id_user_id_is_active_idx" ON "public"."world_memberships"("organization_id", "user_id", "is_active");
CREATE INDEX "world_audit_events_world_id_created_at_idx" ON "public"."world_audit_events"("world_id", "created_at");

ALTER TABLE "public"."worlds" ADD CONSTRAINT "worlds_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."worlds" ADD CONSTRAINT "worlds_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."world_releases" ADD CONSTRAINT "world_releases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."world_releases" ADD CONSTRAINT "world_releases_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."world_releases" ADD CONSTRAINT "world_releases_parent_release_id_fkey" FOREIGN KEY ("parent_release_id") REFERENCES "public"."world_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."world_releases" ADD CONSTRAINT "world_releases_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."worlds" ADD CONSTRAINT "worlds_current_release_id_fkey" FOREIGN KEY ("current_release_id") REFERENCES "public"."world_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."world_memberships" ADD CONSTRAINT "world_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."world_memberships" ADD CONSTRAINT "world_memberships_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."world_memberships" ADD CONSTRAINT "world_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."world_audit_events" ADD CONSTRAINT "world_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."world_audit_events" ADD CONSTRAINT "world_audit_events_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."world_audit_events" ADD CONSTRAINT "world_audit_events_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."world_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."world_audit_events" ADD CONSTRAINT "world_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Cross-column invariants: organization and release must belong to the same World.
ALTER TABLE "public"."world_releases" ADD CONSTRAINT "world_releases_org_world_consistency_fkey" FOREIGN KEY ("organization_id", "world_id") REFERENCES "public"."worlds"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."world_memberships" ADD CONSTRAINT "world_memberships_org_world_consistency_fkey" FOREIGN KEY ("organization_id", "world_id") REFERENCES "public"."worlds"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."world_audit_events" ADD CONSTRAINT "world_audit_org_world_consistency_fkey" FOREIGN KEY ("organization_id", "world_id") REFERENCES "public"."worlds"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."worlds" ADD CONSTRAINT "worlds_current_release_same_world_fkey" FOREIGN KEY ("id", "current_release_id") REFERENCES "public"."world_releases"("world_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add World provenance to the core operational path.
ALTER TABLE "public"."tasks" ADD COLUMN "world_id" UUID, ADD COLUMN "world_release_id" UUID;
ALTER TABLE "public"."cases" ADD COLUMN "world_id" UUID, ADD COLUMN "world_release_id" UUID;
ALTER TABLE "public"."signals" ADD COLUMN "world_id" UUID, ADD COLUMN "world_release_id" UUID;
ALTER TABLE "public"."workflow_definitions" ADD COLUMN "world_id" UUID;
ALTER TABLE "public"."workflow_versions" ADD COLUMN "world_release_id" UUID;
ALTER TABLE "public"."workflow_instances" ADD COLUMN "world_id" UUID, ADD COLUMN "world_release_id" UUID;
ALTER TABLE "public"."idempotency_records" ADD COLUMN "world_id" UUID, ADD COLUMN "world_release_id" UUID;
ALTER TABLE "public"."work_events" ADD COLUMN "world_id" UUID, ADD COLUMN "world_release_id" UUID;
ALTER TABLE "public"."outbox_messages" ADD COLUMN "world_id" UUID, ADD COLUMN "world_release_id" UUID;

-- Every pre-existing organization receives one deterministic Main World and r1.
INSERT INTO "public"."worlds" (
  "id", "organization_id", "key", "title", "description", "status", "visibility", "is_default", "created_at", "updated_at"
)
SELECT
  md5('orgo-world-main:' || o."id"::text)::uuid,
  o."id", 'main', 'Main', 'Backfilled default operational World.', 'active', 'organization', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "public"."organizations" o
ON CONFLICT ("organization_id", "key") DO NOTHING;

INSERT INTO "public"."world_releases" (
  "id", "organization_id", "world_id", "release_number", "status", "label", "config", "content_hash", "created_at", "promoted_at"
)
SELECT
  md5('orgo-world-main-r1:' || w."organization_id"::text)::uuid,
  w."organization_id", w."id", 1, 'current', 'Initial', '{}'::jsonb,
  md5('orgo-world-main-r1-config:' || w."organization_id"::text), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "public"."worlds" w
WHERE w."is_default" = true
ON CONFLICT ("world_id", "release_number") DO NOTHING;

UPDATE "public"."worlds" w
SET "current_release_id" = r."id"
FROM "public"."world_releases" r
WHERE r."world_id" = w."id" AND r."release_number" = 1 AND w."current_release_id" IS NULL;

INSERT INTO "public"."world_memberships" (
  "id", "organization_id", "world_id", "user_id", "role", "is_active", "created_at", "updated_at"
)
SELECT
  md5('orgo-world-main-member:' || u."id"::text)::uuid,
  u."organization_id", w."id", u."id", 'member', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "public"."user_accounts" u
JOIN "public"."worlds" w ON w."organization_id" = u."organization_id" AND w."is_default" = true
ON CONFLICT ("world_id", "user_id") DO NOTHING;

UPDATE "public"."tasks" t SET "world_id" = w."id", "world_release_id" = w."current_release_id"
FROM "public"."worlds" w WHERE w."organization_id" = t."organization_id" AND w."is_default" = true;
UPDATE "public"."cases" c SET "world_id" = w."id", "world_release_id" = w."current_release_id"
FROM "public"."worlds" w WHERE w."organization_id" = c."organization_id" AND w."is_default" = true;
UPDATE "public"."signals" s SET "world_id" = w."id", "world_release_id" = w."current_release_id"
FROM "public"."worlds" w WHERE w."organization_id" = s."organization_id" AND w."is_default" = true;
UPDATE "public"."workflow_definitions" d SET "world_id" = w."id"
FROM "public"."worlds" w WHERE w."organization_id" = d."organization_id" AND w."is_default" = true;
UPDATE "public"."workflow_versions" v SET "world_release_id" = w."current_release_id"
FROM "public"."workflow_definitions" d
JOIN "public"."worlds" w ON w."organization_id" = d."organization_id" AND w."is_default" = true
WHERE v."workflow_definition_id" = d."id";
UPDATE "public"."workflow_instances" i SET "world_id" = w."id", "world_release_id" = w."current_release_id"
FROM "public"."worlds" w WHERE w."organization_id" = i."organization_id" AND w."is_default" = true;
UPDATE "public"."idempotency_records" i SET "world_id" = w."id", "world_release_id" = w."current_release_id"
FROM "public"."worlds" w WHERE w."organization_id" = i."organization_id" AND w."is_default" = true;
UPDATE "public"."work_events" e SET "world_id" = w."id", "world_release_id" = w."current_release_id"
FROM "public"."worlds" w WHERE w."organization_id" = e."organization_id" AND w."is_default" = true;
UPDATE "public"."outbox_messages" m SET "world_id" = w."id", "world_release_id" = w."current_release_id"
FROM "public"."worlds" w WHERE w."organization_id" = m."organization_id" AND w."is_default" = true;

ALTER TABLE "public"."tasks" ALTER COLUMN "world_id" SET NOT NULL, ALTER COLUMN "world_release_id" SET NOT NULL;
ALTER TABLE "public"."cases" ALTER COLUMN "world_id" SET NOT NULL, ALTER COLUMN "world_release_id" SET NOT NULL;
ALTER TABLE "public"."signals" ALTER COLUMN "world_id" SET NOT NULL, ALTER COLUMN "world_release_id" SET NOT NULL;
ALTER TABLE "public"."workflow_instances" ALTER COLUMN "world_id" SET NOT NULL, ALTER COLUMN "world_release_id" SET NOT NULL;
ALTER TABLE "public"."idempotency_records" ALTER COLUMN "world_id" SET NOT NULL, ALTER COLUMN "world_release_id" SET NOT NULL;
ALTER TABLE "public"."work_events" ALTER COLUMN "world_id" SET NOT NULL, ALTER COLUMN "world_release_id" SET NOT NULL;
ALTER TABLE "public"."outbox_messages" ALTER COLUMN "world_id" SET NOT NULL, ALTER COLUMN "world_release_id" SET NOT NULL;

DROP INDEX IF EXISTS "public"."signals_organization_id_source_idempotency_key_key";
DROP INDEX IF EXISTS "public"."signals_organization_id_source_external_reference_key";
DROP INDEX IF EXISTS "public"."workflow_definitions_organization_id_code_key";
DROP INDEX IF EXISTS "public"."idempotency_records_organization_id_operation_key_key";

CREATE UNIQUE INDEX "signals_organization_id_world_id_source_idempotency_key_key" ON "public"."signals"("organization_id", "world_id", "source", "idempotency_key");
CREATE UNIQUE INDEX "signals_organization_id_world_id_source_external_reference_key" ON "public"."signals"("organization_id", "world_id", "source", "external_reference");
CREATE UNIQUE INDEX "workflow_definitions_organization_id_world_id_code_key" ON "public"."workflow_definitions"("organization_id", "world_id", "code");
CREATE UNIQUE INDEX "idempotency_records_organization_id_world_id_operation_key_key" ON "public"."idempotency_records"("organization_id", "world_id", "operation", "key");

CREATE INDEX "tasks_organization_id_world_id_idx" ON "public"."tasks"("organization_id", "world_id");
CREATE INDEX "tasks_world_id_world_release_id_idx" ON "public"."tasks"("world_id", "world_release_id");
CREATE INDEX "cases_organization_id_world_id_idx" ON "public"."cases"("organization_id", "world_id");
CREATE INDEX "cases_world_id_world_release_id_idx" ON "public"."cases"("world_id", "world_release_id");
CREATE INDEX "signals_organization_id_world_id_received_at_idx" ON "public"."signals"("organization_id", "world_id", "received_at");
CREATE INDEX "workflow_definitions_organization_id_world_id_idx" ON "public"."workflow_definitions"("organization_id", "world_id");
CREATE INDEX "workflow_versions_world_release_id_idx" ON "public"."workflow_versions"("world_release_id");
CREATE INDEX "work_events_organization_id_world_id_aggregate_type_aggregate_id_created_at_idx" ON "public"."work_events"("organization_id", "world_id", "aggregate_type", "aggregate_id", "created_at");
CREATE INDEX "outbox_messages_world_id_status_available_at_idx" ON "public"."outbox_messages"("world_id", "status", "available_at");

ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_world_release_id_fkey" FOREIGN KEY ("world_release_id") REFERENCES "public"."world_releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_world_release_id_fkey" FOREIGN KEY ("world_release_id") REFERENCES "public"."world_releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."signals" ADD CONSTRAINT "signals_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."signals" ADD CONSTRAINT "signals_world_release_id_fkey" FOREIGN KEY ("world_release_id") REFERENCES "public"."world_releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_definitions" ADD CONSTRAINT "workflow_definitions_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_versions" ADD CONSTRAINT "workflow_versions_world_release_id_fkey" FOREIGN KEY ("world_release_id") REFERENCES "public"."world_releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_instances" ADD CONSTRAINT "workflow_instances_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_instances" ADD CONSTRAINT "workflow_instances_world_release_id_fkey" FOREIGN KEY ("world_release_id") REFERENCES "public"."world_releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."idempotency_records" ADD CONSTRAINT "idempotency_records_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."idempotency_records" ADD CONSTRAINT "idempotency_records_world_release_id_fkey" FOREIGN KEY ("world_release_id") REFERENCES "public"."world_releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."work_events" ADD CONSTRAINT "work_events_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."work_events" ADD CONSTRAINT "work_events_world_release_id_fkey" FOREIGN KEY ("world_release_id") REFERENCES "public"."world_releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."outbox_messages" ADD CONSTRAINT "outbox_messages_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."outbox_messages" ADD CONSTRAINT "outbox_messages_world_release_id_fkey" FOREIGN KEY ("world_release_id") REFERENCES "public"."world_releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The release provenance on runtime rows must be a release of the same World.
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_world_release_same_world_fkey" FOREIGN KEY ("world_id", "world_release_id") REFERENCES "public"."world_releases"("world_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_world_release_same_world_fkey" FOREIGN KEY ("world_id", "world_release_id") REFERENCES "public"."world_releases"("world_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."signals" ADD CONSTRAINT "signals_world_release_same_world_fkey" FOREIGN KEY ("world_id", "world_release_id") REFERENCES "public"."world_releases"("world_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_instances" ADD CONSTRAINT "workflow_instances_world_release_same_world_fkey" FOREIGN KEY ("world_id", "world_release_id") REFERENCES "public"."world_releases"("world_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."idempotency_records" ADD CONSTRAINT "idempotency_world_release_same_world_fkey" FOREIGN KEY ("world_id", "world_release_id") REFERENCES "public"."world_releases"("world_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."work_events" ADD CONSTRAINT "work_events_world_release_same_world_fkey" FOREIGN KEY ("world_id", "world_release_id") REFERENCES "public"."world_releases"("world_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."outbox_messages" ADD CONSTRAINT "outbox_world_release_same_world_fkey" FOREIGN KEY ("world_id", "world_release_id") REFERENCES "public"."world_releases"("world_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
