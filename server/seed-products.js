// Разовый сид начального контента витрины — тех же 6 позиций, что были
// в демо-прототипе (src/data/content.js), только теперь по-настоящему в БД.
// Безопасно перезапускать: ON CONFLICT просто перезапишет значения.
import "dotenv/config";
import { pool } from "./db.js";

const SEED_CONTENT = [
  {
    sku: "BAD-0142",
    title: "Омега-3",
    category: "Омега и жиры",
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
    description: "Цитрат магния в связке с пиридоксином. Таблетки без вкусовых добавок.",
    usage: "По 1 таблетке 2 раза в день во время еды.",
    sgr: "RU.77.99.11.003.E.007890.11.23",
    composition: [
      { n: "Магний", v: "200 мг" },
      { n: "Витамин B6", v: "2 мг" },
    ],
    published: true,
  },
  { sku: "BAD-0355", title: "", category: "", description: "", usage: "", sgr: "", composition: [], published: false },
  {
    sku: "BAD-0418",
    title: "Коллаген морской",
    category: "Красота",
    description: "Порошок для растворения в воде. Нейтральный вкус, мерная ложка в банке.",
    usage: "1 мерная ложка на 200 мл воды, 1 раз в день.",
    sgr: "RU.77.99.11.003.E.002233.07.25",
    composition: [
      { n: "Коллаген I типа", v: "10 г" },
      { n: "Витамин C", v: "80 мг" },
    ],
    published: true,
  },
  { sku: "BAD-0490", title: "", category: "", description: "", usage: "", sgr: "", composition: [], published: false },
];

const run = async () => {
  for (const p of SEED_CONTENT) {
    let categoryId = null;
    if (p.category) {
      const { rows } = await pool.query(`SELECT id FROM categories WHERE name = $1`, [p.category]);
      categoryId = rows[0]?.id ?? null;
    }
    await pool.query(
      `INSERT INTO products (sku, title, category_id, description, usage_text, sgr, composition, published, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
       ON CONFLICT (sku) DO UPDATE SET
         title = EXCLUDED.title,
         category_id = EXCLUDED.category_id,
         description = EXCLUDED.description,
         usage_text = EXCLUDED.usage_text,
         sgr = EXCLUDED.sgr,
         composition = EXCLUDED.composition,
         published = EXCLUDED.published,
         updated_at = now()`,
      [p.sku, p.title, categoryId, p.description, p.usage, p.sgr, JSON.stringify(p.composition), p.published]
    );
  }
  console.log(`Готово: контент для ${SEED_CONTENT.length} товаров записан в БД.`);
  await pool.end();
};

run().catch((err) => {
  console.error("Сид товаров не выполнен:", err);
  process.exit(1);
});
