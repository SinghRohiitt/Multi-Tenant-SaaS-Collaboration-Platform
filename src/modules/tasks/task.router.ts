import { Router, type RequestHandler } from 'express';

import { authorize, Permissions } from '../../common/authorization/authorization.middleware.js';
import { Permission } from '../../common/authorization/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { getTenantContext } from '../../common/tenant/tenant-context.js';
import {
  assignTaskSchema,
  createTaskSchema,
  listTasksSchema,
  taskIdSchema,
  updateTaskSchema,
} from './task.schemas.js';
import * as taskService from './task.service.js';

export const projectTaskRouter = Router({ mergeParams: true });
export const taskRouter = Router();

const createHandler = Permissions(Permission.TASK_CREATE)(async (request, response) => {
  const parsed = createTaskSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const task = await taskService.createTask(
    getTenantContext(request),
    request.authorization!,
    parsed.params.projectId,
    parsed.body,
  );
  response.status(201).json({ success: true, data: task });
});

const getListHandler: RequestHandler = async (request, response) => {
  const parsed = listTasksSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const result = await taskService.listTasks(
    getTenantContext(request),
    request.authorization!,
    parsed.params.projectId,
    parsed.query,
  );
  response.status(200).json({ success: true, ...result });
};

const getHandler: RequestHandler = async (request, response) => {
  const parsed = taskIdSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const task = await taskService.getTask(
    getTenantContext(request),
    request.authorization!,
    parsed.params.id,
  );
  response.status(200).json({ success: true, data: task });
};

const updateHandler: RequestHandler = async (request, response) => {
  const parsed = updateTaskSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const task = await taskService.updateTask(
    getTenantContext(request),
    request.authorization!,
    parsed.params.id,
    parsed.body,
  );
  response.status(200).json({ success: true, data: task });
};

const assignHandler = Permissions(Permission.TASK_UPDATE)(async (request, response) => {
  const parsed = assignTaskSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const task = await taskService.assignTask(
    getTenantContext(request),
    request.authorization!,
    parsed.params.id,
    parsed.body.assigneeId,
  );
  response.status(200).json({ success: true, data: task });
});

const archiveHandler = Permissions(Permission.TASK_UPDATE)(async (request, response) => {
  const parsed = taskIdSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const task = await taskService.archiveTask(
    getTenantContext(request),
    request.authorization!,
    parsed.params.id,
  );
  response.status(200).json({ success: true, data: task });
});

projectTaskRouter.post('/', validate(createTaskSchema), ...authorize(createHandler));
projectTaskRouter.get('/', validate(listTasksSchema), ...authorize(getListHandler));

taskRouter.get('/:id', validate(taskIdSchema), ...authorize(getHandler));
taskRouter.patch('/:id', validate(updateTaskSchema), ...authorize(updateHandler));
taskRouter.patch('/:id/assignee', validate(assignTaskSchema), ...authorize(assignHandler));
taskRouter.delete('/:id', validate(taskIdSchema), ...authorize(archiveHandler));
