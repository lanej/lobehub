import { authEnv } from '@/envs/auth';

import { type BuiltinProviderDefinition } from '../types';

const provider: BuiltinProviderDefinition<
  {
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SCOPE?: string;
    AUTH_GOOGLE_SECRET: string;
  },
  'google'
> = {
  build: (env) => {
    // Parse additional scopes from AUTH_GOOGLE_SCOPE (comma-separated)
    const additionalScopes = env.AUTH_GOOGLE_SCOPE
      ? env.AUTH_GOOGLE_SCOPE.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    return {
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      // Add custom scopes if provided (e.g., BigQuery access for MCP servers)
      ...(additionalScopes.length > 0 && { scope: additionalScopes }),
    };
  },
  checkEnvs: () => {
    return !!(authEnv.AUTH_GOOGLE_ID && authEnv.AUTH_GOOGLE_SECRET)
      ? {
          AUTH_GOOGLE_ID: authEnv.AUTH_GOOGLE_ID,
          AUTH_GOOGLE_SCOPE: authEnv.AUTH_GOOGLE_SCOPE,
          AUTH_GOOGLE_SECRET: authEnv.AUTH_GOOGLE_SECRET,
        }
      : false;
  },
  id: 'google',
  type: 'builtin',
};

export default provider;
