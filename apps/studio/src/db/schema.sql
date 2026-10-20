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
-- C20 preorder storage. Safe to apply repeatedly before the Worker is deployed.
CREATE TABLE IF NOT EXISTS preorder_products (
  product_id TEXT PRIMARY KEY,
  is_open INTEGER NOT NULL DEFAULT 0 CHECK (is_open IN (0, 1)),
  official_price INTEGER CHECK (official_price IS NULL OR official_price > 0),
  pickup TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS preorders (
  id TEXT PRIMARY KEY,
  order_code TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 50),
  customer_name TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'email')),
  contact_value TEXT NOT NULL,
  pickup TEXT NOT NULL,
  customer_note TEXT,
  unit_price INTEGER CHECK (unit_price IS NULL OR unit_price > 0),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'delivered', 'cancelled')),
  is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0, 1)),
  archived_at TEXT,
  idempotency_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_preorders_created ON preorders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preorders_status_product ON preorders(status, product_id);
CREATE INDEX IF NOT EXISTS idx_preorders_test ON preorders(is_test, created_at DESC);

CREATE TABLE IF NOT EXISTS preorder_events (
  id TEXT PRIMARY KEY,
  preorder_id TEXT NOT NULL REFERENCES preorders(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_preorder_events_order ON preorder_events(preorder_id, created_at DESC);

CREATE TABLE IF NOT EXISTS preorder_rate_limits (
  bucket_hash TEXT NOT NULL,
  bucket_day TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_hash, bucket_day)
);

INSERT OR IGNORE INTO preorder_products(product_id, is_open, official_price, pickup, updated_at, updated_by)
VALUES
  ('chuon-chuon-tre-kem-de', 0, NULL, NULL, '2026-10-21T00:00:00.000Z', 'system-bootstrap@internal'),
  ('moc-khoa', 0, NULL, NULL, '2026-10-21T00:00:00.000Z', 'system-bootstrap@internal');
