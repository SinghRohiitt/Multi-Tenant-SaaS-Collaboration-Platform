export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  role?: UserRole;
  roles?: UserRole[];
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = {
  tenantId: string;
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  displayName: string;
};
