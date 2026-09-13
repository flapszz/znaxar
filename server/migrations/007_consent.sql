-- Логирование согласия на обработку ПДн (152-ФЗ) — без этого нечем доказать,
-- что согласие вообще было получено и под каким именно текстом.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS consent_version TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS consent_text_hash TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS consent_ip TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS consent_user_agent TEXT;
