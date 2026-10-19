import "dotenv/config";
import { createHash } from "node:crypto";
import compression from "compression";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";
import { collectionsRouter } from "./routes/collections.js";
import { categoriesRouter } from "./routes/categories.js";
import { brandsRouter } from "./routes/brands.js";
import { publicationsRouter } from "./routes/publications.js";
import { legalRouter } from "./routes/legal.js";
import { sitemapRouter } from "./routes/sitemap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

// Секрет сессий: лучше задать свой (переменная SESSION_SECRET). Если её нет, берём стабильный секрет,
// выведенный из пароля базы данных, — сессии и вход в админку работают и не слетают при перезапуске.
let sessionSecret = String(process.env.SESSION_SECRET || "").trim();
if (!sessionSecret && process.env.DATABASE_URL) {
  sessionSecret = createHash("sha256").update(`znaxar-session:${process.env.DATABASE_URL}`).digest("hex");
  console.warn("SESSION_SECRET не задан — использую секрет, выведенный из DATABASE_URL. Лучше задать SESSION_SECRET в Render → Environment.");
}
if (!sessionSecret) {
  console.error("ОШИБКА НАСТРОЙКИ: не заданы ни SESSION_SECRET, ни DATABASE_URL.");
  process.exit(1);
}

const app = express();
// Сжатие ответов (JS ~320 КБ превращается в ~95 КБ) — заметно быстрее на мобильном интернете.
app.use(compression());
const PgSession = connectPgSimple(session);

// За прокси хостинга (Render и т.п.) — иначе secure-куки и req.ip работают неверно.
if (isProduction) app.set("trust proxy", 1);

app.use(express.json());
app.use(
  session({
    store: new PgSession({ pool }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8, // 8 часов
    },
  })
);

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/brands", brandsRouter);
app.use("/api/publications", publicationsRouter);
app.use("/api/legal", legalRouter);
app.use(sitemapRouter);

// В проде один и тот же процесс отдаёт и API, и собранный фронтенд (Vite build) —
// отдельного статического хостинга не заводим, чтобы уложиться в один бесплатный сервис.
if (isProduction) {
  const DIST_DIR = path.join(__dirname, "..", "dist");
  // Файлы в /assets имеют хэш в названии и при изменении получают новое имя — их можно кешировать на год.
  app.use("/assets", express.static(path.join(DIST_DIR, "assets"), { maxAge: "1y", immutable: true }));
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

const port = process.env.PORT || 4000;
// Автоудаление закрытых заявок (выдана/отменена) через N месяцев — 152-ФЗ требует
// не хранить персональные данные дольше, чем нужно. Выключено, пока не задана
// переменная ORDER_RETENTION_MONTHS; срок должен совпадать с Политикой на сайте.
const retentionMonths = Number(process.env.ORDER_RETENTION_MONTHS);
if (Number.isFinite(retentionMonths) && retentionMonths > 0) {
  const purge = () =>
    pool
      .query(`DELETE FROM orders WHERE closed_at IS NOT NULL AND closed_at < now() - ($1 || ' months')::interval`, [
        String(retentionMonths),
      ])
      .then(({ rowCount }) => rowCount && console.log(`Удалено закрытых заявок старше ${retentionMonths} мес.: ${rowCount}`))
      .catch((e) => console.error("Не удалось очистить старые заявки:", e.message));
  purge();
  setInterval(purge, 24 * 60 * 60 * 1000);
}

app.listen(port, () => {
  console.log(`API-сервер слушает http://localhost:${port}`);
});
