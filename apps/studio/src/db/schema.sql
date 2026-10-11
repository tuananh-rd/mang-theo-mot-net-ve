-- Bảng Người dùng và Phân quyền RBAC
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'reviewer')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Bảng Bản nháp làm việc cho 8 phân hệ
CREATE TABLE IF NOT EXISTS drafts (
  module_key TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  revision_hash TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Bảng Lịch sử Phiên bản (Revisions) chống ghi đè và hỗ trợ khôi phục
CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  module_key TEXT NOT NULL,
  version INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  revision_hash TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_revisions_module ON revisions(module_key, version DESC);

-- Bảng Yêu cầu và Trạng thái Xuất bản (Publications)
CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,
  snapshot_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft', 'pending_review', 'approved', 'published', 'rolled_back')),
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  second_reviewer TEXT,
  published_at TEXT,
  git_ref TEXT,
  deploy_status TEXT NOT NULL DEFAULT 'unknown',
  error_message TEXT,
  idempotency_key TEXT UNIQUE,
  deployment_verified_at TEXT,
  created_at TEXT NOT NULL
);

-- Bảng Nhật ký Kiểm toán (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  module_key TEXT NOT NULL,
  details_json TEXT NOT NULL,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- Bảng Quản lý Tệp Đa phương tiện và Ảnh (Media Assets)
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
  alt TEXT NOT NULL,
  caption TEXT,
  credit_name TEXT,
  credit_url TEXT,
  source TEXT,
  is_illustration INTEGER NOT NULL DEFAULT 1,
  focal_x INTEGER DEFAULT 50,
  focal_y INTEGER DEFAULT 50,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
