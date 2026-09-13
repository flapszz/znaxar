-- Фото товара переезжает с диска в БД. На бесплатном (и вообще на любом
-- "эфемерном") хостинге локальный диск сервиса не переживает рестарт/передеплой —
-- загруженные фото исчезали. В Postgres они живут столько же, сколько сами данные.
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_data BYTEA;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_mimetype TEXT;
ALTER TABLE products DROP COLUMN IF EXISTS image_filename;
