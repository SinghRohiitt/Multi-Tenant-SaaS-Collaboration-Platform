export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
