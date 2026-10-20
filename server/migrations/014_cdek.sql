-- Подготовка к СДЭК: пункт выдачи, выбранный покупателем, данные накладной и вес товара.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city_code INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cdek_uuid TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cdek_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cdek_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cdek_error TEXT;
-- Вес одной единицы товара в граммах (для расчёта доставки и накладной). Пусто — берётся значение по умолчанию.
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_g INTEGER;
