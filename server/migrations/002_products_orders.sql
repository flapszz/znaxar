-- Контент витрины (раньше жил в src/data/content.js и терялся при перезагрузке).
CREATE TABLE IF NOT EXISTS products (
  sku TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  usage_text TEXT NOT NULL DEFAULT '',
  sgr TEXT NOT NULL DEFAULT '',
  composition JSONB NOT NULL DEFAULT '[]',
  published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Заявки покупателей (раньше — SEED_ORDERS в памяти браузера).
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  pickup TEXT NOT NULL DEFAULT 'ПВЗ уточняется',
  comment TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'новая'
);

-- Продолжаем нумерацию с той же точки, на которой остановилась демо-версия.
-- Только пока таблица пустая — чтобы повторный запуск миграции не столкнул номера с реальными заявками.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM orders) = 0 THEN
    ALTER SEQUENCE orders_id_seq RESTART WITH 3121;
  END IF;
END $$;
