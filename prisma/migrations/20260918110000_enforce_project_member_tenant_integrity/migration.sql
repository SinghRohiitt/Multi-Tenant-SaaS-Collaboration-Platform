-- Add tenant identity to membership rows and use composite foreign keys so a
-- project member can only reference a project and user in the same tenant.
ALTER TABLE "User" ADD CONSTRAINT "User_id_tenantId_key" UNIQUE ("id", "tenantId");
ALTER TABLE "Project" ADD CONSTRAINT "Project_id_tenantId_key" UNIQUE ("id", "tenantId");

ALTER TABLE "ProjectMember" ADD COLUMN "tenantId" TEXT;
UPDATE "ProjectMember" AS member
SET "tenantId" = project."tenantId"
FROM "Project" AS project
WHERE project."id" = member."projectId";
ALTER TABLE "ProjectMember" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_projectId_fkey";
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_userId_fkey";
CREATE INDEX "ProjectMember_tenantId_projectId_idx" ON "ProjectMember"("tenantId", "projectId");

ALTER TABLE "ProjectMember"
  ADD CONSTRAINT "ProjectMember_projectId_tenantId_fkey"
  FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMember"
  ADD CONSTRAINT "ProjectMember_userId_tenantId_fkey"
  FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
