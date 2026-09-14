// Сид контента витрины. Безопасно перезапускать: ON CONFLICT перезапишет
// значения этих SKU обратно на демо-текст — так и задумано для стабильности
// демо-версии, но имейте в виду: если начнёте всерьёз редактировать эти же
// артикулы в админке, следующий деплой сотрёт правки обратно на этот сид.
import "dotenv/config";
import { pool } from "./db.js";

const SEED_CONTENT = [
  {
    sku: "BAD-0142",
    title: "Омега-3",
    category: "Омега и жиры",
    brand: "Эвалар",
    description:
      "Концентрат рыбьего жира в мягких капсулах. Суточная порция — две капсулы, курс рассчитан на месяц.",
    usage: "По 1 капсуле 2 раза в день во время еды.",
    sgr: "RU.77.99.11.003.E.001234.05.24",
    composition: [
      { n: "ЭПК", v: "330 мг" },
      { n: "ДГК", v: "220 мг" },
      { n: "Витамин E", v: "10 мг" },
    ],
    published: true,
  },
  {
    sku: "BAD-0207",
    title: "Витамин D3",
    category: "Витамины",
    brand: "",
    description: "Холекальциферол на основе МСТ-масла. Дозировка 2000 МЕ в одной капсуле.",
    usage: "По 1 капсуле в день во время еды.",
    sgr: "RU.77.99.11.003.E.004567.02.24",
    composition: [{ n: "Витамин D3", v: "2000 МЕ" }],
    published: true,
  },
  {
    sku: "BAD-0311",
    title: "Магний + B6",
    category: "Минералы",
    brand: "",
    description: "Цитрат магния в связке с пиридоксином. Таблетки без вкусовых добавок.",
    usage: "По 1 таблетке 2 раза в день во время еды.",
    sgr: "RU.77.99.11.003.E.007890.11.23",
    composition: [
      { n: "Магний", v: "200 мг" },
      { n: "Витамин B6", v: "2 мг" },
    ],
    published: true,
  },
  {
    sku: "BAD-0355",
    title: "Цинк пиколинат",
    category: "Витамины",
    brand: "Компас Здоровья",
    description: "Хелатная форма цинка с высокой усвояемостью. Без искусственных красителей и ароматизаторов.",
    usage: "По 1 капсуле в день во время еды.",
    sgr: "RU.77.99.11.003.E.003321.09.24",
    composition: [{ n: "Цинк", v: "25 мг" }],
    published: true,
  },
  {
    sku: "BAD-0418",
    title: "Коллаген морской",
    category: "Красота",
    brand: "",
    description: "Порошок для растворения в воде. Нейтральный вкус, мерная ложка в банке.",
    usage: "1 мерная ложка на 200 мл воды, 1 раз в день.",
    sgr: "RU.77.99.11.003.E.002233.07.25",
    composition: [
      { n: "Коллаген I типа", v: "10 г" },
      { n: "Витамин C", v: "80 мг" },
    ],
    published: true,
  },
  {
    sku: "BAD-0490",
    title: "Мелатонин",
    category: "Сон и стресс",
    brand: "Доппельгерц",
    description: "Регулятор режима сна на основе мелатонина. Не вызывает привыкания.",
    usage: "По 1 таблетке за 30–40 минут до сна.",
    sgr: "RU.77.99.11.003.E.005544.04.25",
    composition: [{ n: "Мелатонин", v: "3 мг" }],
    published: true,
  },
  {
    sku: "BAD-0512",
    title: "Витамин C 1000 мг",
    category: "Витамины",
    brand: "Solgar",
    description: "Аскорбиновая кислота в высокой дозировке для поддержки иммунитета в сезон простуд.",
    usage: "По 1 таблетке в день во время еды.",
    sgr: "RU.77.99.11.003.E.006677.06.25",
    composition: [{ n: "Витамин C", v: "1000 мг" }],
    published: true,
  },
  {
    sku: "BAD-0533",
    title: "Кальций + Витамин D3",
    category: "Минералы",
    brand: "Доппельгерц",
    description: "Карбонат кальция с витамином D3 для лучшего усвоения. Таблетки со вкусом лимона.",
    usage: "По 1 таблетке 2 раза в день во время еды.",
    sgr: "RU.77.99.11.003.E.007788.08.25",
    composition: [
      { n: "Кальций", v: "500 мг" },
      { n: "Витамин D3", v: "200 МЕ" },
    ],
    published: true,
  },
  {
    sku: "BAD-0561",
    title: "Рыбий жир Омега-3 90%",
    category: "Омега и жиры",
    brand: "Solgar",
    description: "Концентрат высокой очистки — 90% омега-3 кислот в одной капсуле. Без рыбного послевкусия.",
    usage: "По 1 капсуле в день во время еды.",
    sgr: "RU.77.99.11.003.E.008899.09.25",
    composition: [
      { n: "ЭПК", v: "500 мг" },
      { n: "ДГК", v: "250 мг" },
    ],
    published: true,
  },
  {
    sku: "BAD-0602",
    title: "Магний хелат",
    category: "Минералы",
    brand: "Компас Здоровья",
    description: "Хелатная форма магния — усваивается мягче обычных солей, не раздражает желудок.",
    usage: "По 1 капсуле 2 раза в день во время еды.",
    sgr: "RU.77.99.11.003.E.009900.10.25",
    composition: [{ n: "Магний", v: "200 мг" }],
    published: true,
  },
  {
    sku: "BAD-0645",
    title: "Коллаген + гиалуроновая кислота",
    category: "Красота",
    brand: "Эвалар",
    description: "Гидролизованный коллаген с гиалуроновой кислотой в капсулах — без порошка и размешивания.",
    usage: "По 2 капсулы в день во время еды.",
    sgr: "RU.77.99.11.003.E.001122.11.25",
    composition: [
      { n: "Коллаген", v: "300 мг" },
      { n: "Гиалуроновая кислота", v: "50 мг" },
    ],
    published: true,
  },
  {
    sku: "BAD-0671",
    title: "Валерианы экстракт",
    category: "Сон и стресс",
    brand: "Доппельгерц",
    description: "Растительное успокоительное на основе экстракта валерианы. Классическая рецептура.",
    usage: "По 2 таблетки 3 раза в день.",
    sgr: "RU.77.99.11.003.E.002211.12.25",
    composition: [{ n: "Экстракт валерианы", v: "200 мг" }],
    published: true,
  },
  {
    sku: "BAD-0699",
    title: "Пассифлора и мелисса",
    category: "Сон и стресс",
    brand: "Компас Здоровья",
    description: "Растительный комплекс для мягкого засыпания и снижения тревожности перед сном.",
    usage: "По 1 капсуле за час до сна.",
    sgr: "RU.77.99.11.003.E.003322.01.26",
    composition: [
      { n: "Экстракт пассифлоры", v: "150 мг" },
      { n: "Экстракт мелиссы", v: "100 мг" },
    ],
    published: true,
  },
];

async function resolveBrandId(name) {
  if (!name) return null;
  const { rows } = await pool.query(`SELECT id FROM brands WHERE name = $1`, [name]);
  if (rows[0]) return rows[0].id;
  const { rows: nextRows } = await pool.query(`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM brands`);
  const { rows: inserted } = await pool.query(
    `INSERT INTO brands (name, position) VALUES ($1, $2) RETURNING id`,
    [name, nextRows[0].next]
  );
  return inserted[0].id;
}

const run = async () => {
  for (const p of SEED_CONTENT) {
    let categoryId = null;
    if (p.category) {
      const { rows } = await pool.query(`SELECT id FROM categories WHERE name = $1`, [p.category]);
      categoryId = rows[0]?.id ?? null;
    }
    const brandId = await resolveBrandId(p.brand);
    await pool.query(
      `INSERT INTO products (sku, title, category_id, brand_id, description, usage_text, sgr, composition, published, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
       ON CONFLICT (sku) DO UPDATE SET
         title = EXCLUDED.title,
         category_id = EXCLUDED.category_id,
         brand_id = EXCLUDED.brand_id,
         description = EXCLUDED.description,
         usage_text = EXCLUDED.usage_text,
         sgr = EXCLUDED.sgr,
         composition = EXCLUDED.composition,
         published = EXCLUDED.published,
         updated_at = now()`,
      [p.sku, p.title, categoryId, brandId, p.description, p.usage, p.sgr, JSON.stringify(p.composition), p.published]
    );
  }
  console.log(`Готово: контент для ${SEED_CONTENT.length} товаров записан в БД.`);
  await pool.end();
};

run().catch((err) => {
  console.error("Сид товаров не выполнен:", err);
  process.exit(1);
});
