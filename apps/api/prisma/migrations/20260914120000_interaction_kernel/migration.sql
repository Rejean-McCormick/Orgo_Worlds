-- Interaction Kernel v1.1 boundary storage.
-- No IK-specific outbox is created: existing outbox_messages remains authoritative for delivery.

CREATE TABLE "public"."artifact_links" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "world_id" UUID NOT NULL,
  "world_release_id" UUID NOT NULL,
  "subject_type" TEXT NOT NULL,
  "subject_id" UUID NOT NULL,
  "relation" TEXT NOT NULL,
  "artifact_owner" TEXT NOT NULL,
  "artifact_owner_organization" TEXT NOT NULL DEFAULT '',
  "artifact_owner_instance" TEXT NOT NULL DEFAULT '',
  "artifact_type" TEXT NOT NULL,
  "artifact_id" TEXT NOT NULL,
  "artifact_version" TEXT NOT NULL DEFAULT '',
  "digest" TEXT,
  "locator" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "artifact_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "artifact_links_identity_key"
  ON "public"."artifact_links"("organization_id", "world_id", "subject_type", "subject_id", "relation", "artifact_owner", "artifact_owner_organization", "artifact_owner_instance", "artifact_type", "artifact_id", "artifact_version");
CREATE INDEX "artifact_links_org_world_subject_created_idx"
  ON "public"."artifact_links"("organization_id", "world_id", "subject_type", "subject_id", "created_at");
CREATE INDEX "artifact_links_artifact_idx"
  ON "public"."artifact_links"("artifact_owner", "artifact_type", "artifact_id");

CREATE TABLE "public"."build_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "world_id" UUID NOT NULL,
  "world_release_id" UUID NOT NULL,
  "build_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "record" JSONB NOT NULL,
  "record_hash" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "build_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "build_records_org_world_build_key"
  ON "public"."build_records"("organization_id", "world_id", "build_id");
CREATE INDEX "build_records_org_world_status_created_idx"
  ON "public"."build_records"("organization_id", "world_id", "status", "created_at");

CREATE TABLE "public"."release_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "world_id" UUID NOT NULL,
  "world_release_id" UUID NOT NULL,
  "release_id" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "build_ref" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "record" JSONB NOT NULL,
  "record_hash" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "release_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "release_records_org_world_release_revision_key"
  ON "public"."release_records"("organization_id", "world_id", "release_id", "revision");
CREATE INDEX "release_records_org_world_release_revision_idx"
  ON "public"."release_records"("organization_id", "world_id", "release_id", "revision");
CREATE INDEX "release_records_org_world_status_created_idx"
  ON "public"."release_records"("organization_id", "world_id", "status", "created_at");
