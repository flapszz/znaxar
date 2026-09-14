-- Общая модель для «Статей» и «Новостей» — по сути одно и то же (заголовок,
-- текст, дата, публикация), различается только меткой type. Отдельных таблиц
-- заводить не стали, чтобы не дублировать код администрирования.
CREATE TABLE IF NOT EXISTS publications (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('article', 'news')),
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, slug)
);
