// Разовый перенос старого захардкоженного списка в таблицу stock.
// В отличие от seed-admin/seed-products, здесь НЕ перезаписываем существующие
// строки — иначе каждый деплой сбрасывал бы цены, которые владелец уже поменял
// через админку или эксель-загрузку.
import "dotenv/config";
import { pool } from "./db.js";
import { STOCK } from "./data/stock.js";

const run = async () => {
  for (const s of STOCK) {
    await pool.query(
      `INSERT INTO stock (sku, stock_name, price, stock)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (sku) DO NOTHING`,
      [s.sku, s.stockName, s.price, s.stock]
    );
  }
  console.log(`Готово: проверено ${STOCK.length} позиций (существующие строки не менялись).`);
  await pool.end();
};

run().catch((err) => {
  console.error("Сид склада не выполнен:", err);
  process.exit(1);
});
