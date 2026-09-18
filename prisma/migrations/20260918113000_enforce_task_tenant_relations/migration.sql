-- Scope task project and assignee references to the same tenant.
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeId_fkey";

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_projectId_tenantId_fkey"
  FOREIGN KEY ("projectId", "tenantId") REFERENCES "Project"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_assigneeId_tenantId_fkey"
  FOREIGN KEY ("assigneeId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Task_tenantId_priority_idx" ON "Task"("tenantId", "priority");
