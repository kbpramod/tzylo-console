export interface Repository {
  id: string;
  name: string;
  status: 'Ready' | 'Indexing' | 'Syncing' | 'Failed';
  lastSync: string;
  knowledgeNodes: number;
  docPages: number;
  githubUrl: string;
  connectedAt: string;
}

export interface DocSection {
  id: string;
  title: string;
  content: string;
}

export interface QueryResult {
  id: string;
  question: string;
  answer: string;
  sources: { title: string; category: string; path: string }[];
  timestamp: string;
}

export const INITIAL_REPOSITORIES: Repository[] = [
  {
    id: 'auth-service',
    name: 'auth-service',
    status: 'Ready',
    lastSync: '2 min ago',
    knowledgeNodes: 2341,
    docPages: 42,
    githubUrl: 'https://github.com/tzylo/auth-service',
    connectedAt: '2026-07-15',
  },
  {
    id: 'backend-api',
    name: 'backend-api',
    status: 'Indexing',
    lastSync: 'Running...',
    knowledgeNodes: 1890,
    docPages: 28,
    githubUrl: 'https://github.com/tzylo/backend-api',
    connectedAt: '2026-08-01',
  },
];

export const MOCK_DOCS: Record<string, DocSection[]> = {
  'auth-service': [
    {
      id: 'authentication',
      title: 'Authentication',
      content: `### JWT & Session Management

The \`auth-service\` handles user identity verification and token generation using RSA-256 signed JSON Web Tokens (JWT).

#### Core Architecture
- **Token Issuer**: \`AuthService.generateTokens(user)\` generates an Access Token (15m expiration) and a Refresh Token (7d expiration).
- **Public Key Rotation**: Public verification keys are served on \`/.well-known/jwks.json\`.
- **Session Revocation**: Refresh tokens are tracked in Redis for immediate invalidation upon logout or password reset.

\`\`\`typescript
// Token Generation Flow
const payload = { sub: user.id, role: user.role };
const accessToken = jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '15m' });
\`\`\`
`,
    },
    {
      id: 'architecture',
      title: 'Architecture',
      content: `### System Architecture

The service follows clean architecture principles with distinct boundary layers:

1. **Controllers**: HTTP endpoints built with Express & TypeScript.
2. **Services**: Business logic execution and domain rules.
3. **Repositories**: Database abstraction over PostgreSQL using Prisma ORM.
4. **Event Bus**: Asynchronous notifications published to Redis Pub/Sub.

\`\`\`
[ API Gateway ] -> [ Auth Controller ] -> [ Auth Service ] -> [ Redis / Postgres ]
\`\`\`
`,
    },
    {
      id: 'database',
      title: 'Database',
      content: `### Database Schema & Persistence

Data is persisted in PostgreSQL managed via Prisma migrations.

#### Key Entities
- **User**: \`id\`, \`email\`, \`password_hash\`, \`created_at\`
- **UserSession**: \`id\`, \`user_id\`, \`refresh_token_hash\`, \`expires_at\`, \`ip_address\`
- **AuditLog**: \`id\`, \`user_id\`, \`action\`, \`metadata\`
`,
    },
    {
      id: 'api',
      title: 'API',
      content: `### REST API Specification

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| \`/v1/auth/login\` | \`POST\` | Authenticates credentials and returns JWT payload. |
| \`/v1/auth/refresh\` | \`POST\` | Issues new access token given valid refresh cookie. |
| \`/v1/auth/logout\` | \`POST\` | Revokes refresh token in Redis. |
| \`/v1/auth/verify\` | \`GET\` | Validates header bearer token signature. |
`,
    },
    {
      id: 'configuration',
      title: 'Configuration',
      content: `### Environment Variables

\`\`\`bash
PORT=4000
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/auth_db
REDIS_URL=redis://localhost:6379
JWT_PRIVATE_KEY_PATH=/etc/secrets/rsa_private.pem
JWT_PUBLIC_KEY_PATH=/etc/secrets/rsa_public.pem
\`\`\`
`,
    },
    {
      id: 'general-notes',
      title: 'General Notes',
      content: `### Security & Operational Notes

- **Password Hashing**: Argon2id with 64MB memory cost.
- **Rate Limiting**: IP-based rate limiting on \`/v1/auth/login\` (10 attempts per minute).
- **Monitoring**: Prometheus metrics exported on \`/metrics\`.
`,
    },
  ],
};

export const INITIAL_QUERIES: QueryResult[] = [
  {
    id: 'q1',
    question: 'How is JWT authentication implemented?',
    answer: 'JWT authentication in `auth-service` uses RSA-256 asymmetric signing. Short-lived access tokens (15m) are signed with a private key, while public keys are exposed via standard JWKS endpoints (`/.well-known/jwks.json`). Refresh tokens (7d) are stored in Redis to enable instant session revocation.',
    sources: [
      { title: 'Authentication', category: 'Architecture', path: 'src/services/auth.ts' },
      { title: 'JWT Configuration', category: 'Configuration', path: 'config/jwt.json' },
    ],
    timestamp: 'Just now',
  },
];
