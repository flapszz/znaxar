-- Подборки товаров (не то же самое, что категория): "Для мужчин", "Для женщин" и т.п.
-- Заводятся и упорядочиваются в админке, товар может быть в нескольких подборках сразу.
CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_products (
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_collection_products_collection ON collection_products (collection_id);
