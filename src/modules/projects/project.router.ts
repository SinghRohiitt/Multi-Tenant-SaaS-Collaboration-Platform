import { Router } from 'express';

import { authorize, Permissions } from '../../common/authorization/authorization.middleware.js';
import { Permission } from '../../common/authorization/rbac.js';
import { getTenantContext } from '../../common/tenant/tenant-context.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createProjectSchema,
  listProjectsSchema,
  projectIdSchema,
  updateProjectSchema,
} from './project.schemas.js';
import * as projectService from './project.service.js';

export const projectRouter = Router();

const createProjectHandler = Permissions(Permission.PROJECT_MANAGE_ASSIGNED)(async (
  request,
  response,
) => {
  const input = createProjectSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  }).body;
  const project = await projectService.createProject(getTenantContext(request), input);
  response.status(201).json({ success: true, data: project });
});

const listProjectsHandler = Permissions(Permission.PROJECT_VIEW_ASSIGNED)(async (
  request,
  response,
) => {
  const input = listProjectsSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  }).query;
  const result = await projectService.listProjects(
    getTenantContext(request),
    request.authorization!,
    input,
  );
  response.status(200).json({ success: true, ...result });
});

const getProjectHandler = Permissions(Permission.PROJECT_VIEW_ASSIGNED)(async (
  request,
  response,
) => {
  const { id } = projectIdSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  }).params;
  const project = await projectService.getProject(
    getTenantContext(request),
    request.authorization!,
    id,
  );
  response.status(200).json({ success: true, data: project });
});

const updateProjectHandler = Permissions(Permission.PROJECT_MANAGE_ASSIGNED)(async (
  request,
  response,
) => {
  const input = updateProjectSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const project = await projectService.updateProject(
    getTenantContext(request),
    request.authorization!,
    input.params.id,
    input.body,
  );
  response.status(200).json({ success: true, data: project });
});

const archiveProjectHandler = Permissions(Permission.PROJECT_MANAGE_ASSIGNED)(async (
  request,
  response,
) => {
  const { id } = projectIdSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  }).params;
  const project = await projectService.archiveProject(
    getTenantContext(request),
    request.authorization!,
    id,
  );
  response.status(200).json({ success: true, data: project });
});

projectRouter.post('/', validate(createProjectSchema), ...authorize(createProjectHandler));
projectRouter.get('/', validate(listProjectsSchema), ...authorize(listProjectsHandler));
projectRouter.get('/:id', validate(projectIdSchema), ...authorize(getProjectHandler));
projectRouter.patch('/:id', validate(updateProjectSchema), ...authorize(updateProjectHandler));
projectRouter.delete('/:id', validate(projectIdSchema), ...authorize(archiveProjectHandler));
