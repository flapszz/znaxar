-- stock_deducted: остаток по заявке уже списан (чтобы не списать дважды и
-- корректно вернуть при отмене). closed_at: когда заявка закрыта — от этой
-- даты считается срок хранения персональных данных.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
