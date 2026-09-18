process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'postgresql://app_user:change_me@localhost:5432/collaboration_platform?schema=public';
process.env.JWT_ACCESS_SECRET = 'test_only_access_secret_that_is_long_enough_to_be_valid_12345';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = '7';
