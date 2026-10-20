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
