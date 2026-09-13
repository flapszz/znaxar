-- Категории теперь редактируются в админке, а не зашиты в коде.
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0
);

-- Сидим теми же 5 категориями, что были захардкожены — только если таблица пустая.
INSERT INTO categories (name, position)
SELECT * FROM (VALUES
  ('Витамины', 0),
  ('Минералы', 1),
  ('Омега и жиры', 2),
  ('Сон и стресс', 3),
  ('Красота', 4)
) AS seed(name, position)
WHERE NOT EXISTS (SELECT 1 FROM categories);

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- Переносим то, что уже было сохранено текстом, на настоящую связь по id.
-- Условие на существование колонки — иначе повторный запуск падает после того,
-- как её уже снесла последняя строка этого же файла в прошлый раз.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category') THEN
    UPDATE products p SET category_id = c.id
    FROM categories c
    WHERE p.category = c.name AND p.category_id IS NULL;
  END IF;
END $$;

ALTER TABLE products DROP COLUMN IF EXISTS category;
