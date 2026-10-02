-- Уменьшенная копия фото для каталога (≈480 px) — грузится в разы быстрее оригинала.
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_thumb BYTEA;
