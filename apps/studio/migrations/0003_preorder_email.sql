-- Companion table keeps private email delivery state separate from order data.
CREATE TABLE IF NOT EXISTS preorder_email_state (
  preorder_id TEXT PRIMARY KEY REFERENCES preorders(id),
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'skipped')),
  email_attempts INTEGER NOT NULL DEFAULT 0 CHECK (email_attempts BETWEEN 0 AND 3),
  email_sent_at TEXT,
  team_notified_at TEXT,
  email_last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
