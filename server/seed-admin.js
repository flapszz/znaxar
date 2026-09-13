import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_SEED_PASSWORD;

if (!username || !password) {
  console.error("Задайте ADMIN_USERNAME и ADMIN_SEED_PASSWORD в .env перед запуском.");
  process.exit(1);
}

const run = async () => {
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO admin_users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [username, hash]
  );
  console.log(`Готово: пароль для «${username}» установлен из ADMIN_SEED_PASSWORD.`);
  await pool.end();
};

run().catch((err) => {
  console.error("Не удалось создать/обновить админа:", err);
  process.exit(1);
});
