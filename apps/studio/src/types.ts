/**
 * Kiểu dữ liệu trung tâm cho Content Studio trực tuyến (Task C17)
 */

export type UserRole = 'admin' | 'editor' | 'reviewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  isDev: boolean;
  token?: string;
  expiresAt: number;
}

export interface AccessJwtHeader {
  alg: string;
  kid?: string;
  typ?: string;
}

export interface AccessJwtPayload {
  iss: string;
  aud: string | string[];
  sub: string;
  email?: string;
  identity_nonce?: string;
  exp: number;
  nbf?: number;
  iat?: number;
  type?: string;
  custom?: Record<string, unknown>;
}

export type ModuleKey =
  | 'dashboard'
  | 'project'
  | 'journal'
  | 'media'
  | 'products'
  | 'finance'
  | 'team'
  | 'publish';

export interface DraftRecord<T = unknown> {
  moduleKey: ModuleKey;
  data: T;
  revisionHash: string;
  updatedBy: string;
  updatedAt: string;
}

export interface RevisionRecord<T = unknown> {
  id: string;
  moduleKey: ModuleKey;
  version: number;
  data: T;
  revisionHash: string;
  createdBy: string;
  createdAt: string;
  comment?: string;
}

export type PublicationStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'rolled_back';

export interface PublicationRecord {
  id: string;
  snapshot: PublicationSnapshot;
  status: PublicationStatus;
  requestedBy: string;
  approvedBy: string | null;
  secondReviewer: string | null;
  publishedAt: string | null;
  gitRef: string | null;
  deployStatus: 'unknown' | 'pending' | 'building' | 'success' | 'failed' | 'mismatch' | 'stale';
  errorMessage?: string | null;
  idempotencyKey?: string | null;
  deploymentVerifiedAt?: string | null;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  userEmail: string;
  action: string;
  moduleKey: ModuleKey | 'system' | 'auth';
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface MediaAssetRecord {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  r2Key: string;
  status: 'pending' | 'approved' | 'rejected';
  alt: string;
  caption?: string;
  creditName?: string;
  creditUrl?: string;
  source?: string;
  isIllustration: boolean;
  focalX: number;
  focalY: number;
  createdBy: string;
  createdAt: string;
}

/** Snapshot xuất bản độc lập được làm sạch */
export interface PublicationSnapshot {
  version: string;
  generatedAt: string;
  sha256: string;
  modules: {
    project: unknown;
    journal: unknown;
    products: unknown;
    finance: unknown;
    team: unknown;
  };
}

/** Tương thích Cloudflare D1 Database */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Response<T>[]>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Response<T>>;
  run<T = unknown>(): Promise<D1Response<T>>;
}

export interface D1Response<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: {
    changes?: number;
    last_row_id?: number;
    duration?: number;
  };
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/** Tương thích Cloudflare R2 Storage */
export interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string | Uint8Array, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string | string[]): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2Objects>;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpMetadata?: {
    contentType?: string;
  };
  customMetadata?: Record<string, string>;
  uploaded: Date;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
}

export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
  };
  customMetadata?: Record<string, string>;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  STUDIO_ENVIRONMENT?: 'development' | 'production';
  PRODUCTION_SITE_ORIGIN?: string;
  RATE_LIMIT_SALT?: string;
  PREORDER_TEST_MODE?: string;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BASE_BRANCH?: string;
  GITHUB_SIMULATE?: string;
  DEPLOYMENT_WEBHOOK_SECRET?: string;
}
