CREATE TABLE IF NOT EXISTS claims (
  claim_id VARCHAR(50) PRIMARY KEY,
  member_id VARCHAR(50) NOT NULL,
  provider_id VARCHAR(50) NOT NULL,
  service_date DATE NOT NULL,
  diagnosis_code VARCHAR(20) NOT NULL,
  claim_amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE claims ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS request_hash VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS claims_idempotency_key_idx ON claims (idempotency_key);
