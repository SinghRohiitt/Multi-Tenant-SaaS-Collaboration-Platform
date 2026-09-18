import 'dotenv/config';

import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Allows client generation before a developer has created .env. Migrations still
  // require a real DATABASE_URL supplied through the environment or .env.
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://app_user:change_me@localhost:5432/collaboration_platform?schema=public',
  },
});
