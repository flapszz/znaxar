-- Осознанное отступление от исходного архитектурного правила (см. CLAUDE.md):
-- владелец сам решил вести цену и остаток через сайт (эксель-загрузка), а не
-- ждать интеграции с внешней учётной системой. Раньше это был захардкоженный
-- массив STOCK в server/data/stock.js — теперь обычная таблица.
CREATE TABLE IF NOT EXISTS stock (
  sku TEXT PRIMARY KEY,
  stock_name TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
