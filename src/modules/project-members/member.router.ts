import { Router } from 'express';

import { authorize, Permissions } from '../../common/authorization/authorization.middleware.js';
import { Permission } from '../../common/authorization/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { getTenantContext } from '../../common/tenant/tenant-context.js';
import {
  addProjectMemberSchema,
  listProjectMembersSchema,
  projectMemberDetailSchema,
} from './member.schemas.js';
import * as memberService from './member.service.js';

export const memberRouter = Router({ mergeParams: true });

const addHandler = Permissions(Permission.PROJECT_MEMBERS_MANAGE)(async (request, response) => {
  const parsed = addProjectMemberSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const member = await memberService.addMember(
    getTenantContext(request),
    request.authorization!,
    parsed.params.projectId,
    parsed.body,
  );
  response.status(201).json({ success: true, data: member });
});

const listHandler = Permissions(Permission.PROJECT_VIEW_ASSIGNED)(async (request, response) => {
  const parsed = listProjectMembersSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const result = await memberService.listMembers(
    getTenantContext(request),
    request.authorization!,
    parsed.params.projectId,
    parsed.query,
  );
  response.status(200).json({ success: true, ...result });
});

const getHandler = Permissions(Permission.PROJECT_VIEW_ASSIGNED)(async (request, response) => {
  const parsed = projectMemberDetailSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  const member = await memberService.getMember(
    getTenantContext(request),
    request.authorization!,
    parsed.params.projectId,
    parsed.params.userId,
  );
  response.status(200).json({ success: true, data: member });
});

const removeHandler = Permissions(Permission.PROJECT_MEMBERS_MANAGE)(async (request, response) => {
  const parsed = projectMemberDetailSchema.parse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  await memberService.removeMember(
    getTenantContext(request),
    request.authorization!,
    parsed.params.projectId,
    parsed.params.userId,
  );
  response.status(204).send();
});

memberRouter.post('/', validate(addProjectMemberSchema), ...authorize(addHandler));
memberRouter.get('/', validate(listProjectMembersSchema), ...authorize(listHandler));
memberRouter.get('/:userId', validate(projectMemberDetailSchema), ...authorize(getHandler));
memberRouter.delete('/:userId', validate(projectMemberDetailSchema), ...authorize(removeHandler));
