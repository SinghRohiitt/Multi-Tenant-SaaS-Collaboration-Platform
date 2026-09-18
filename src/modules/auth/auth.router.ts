import { Router } from 'express';

import { validate } from '../../common/middleware/validate.js';
import { authenticate, getCurrentUser } from './auth.middleware.js';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (request, response) => {
  const result = await authService.register(request.body);
  response.status(201).json({ success: true, data: result });
});

authRouter.post('/login', validate(loginSchema), async (request, response) => {
  const result = await authService.login(request.body);
  response.status(200).json({ success: true, data: result });
});

authRouter.post('/refresh', validate(refreshSchema), async (request, response) => {
  const result = await authService.refresh(request.body.refreshToken);
  response.status(200).json({ success: true, data: result });
});

authRouter.post('/logout', validate(refreshSchema), async (request, response) => {
  await authService.logout(request.body.refreshToken);
  response.status(204).send();
});

authRouter.get('/me', authenticate, (request, response) => {
  response.status(200).json({ success: true, data: getCurrentUser(request) });
});
