import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { requireAdmin } from "./auth.js";
import { CONSENT } from "../legal.js";

const STATUSES = ["новая", "подтверждена", "собрана", "отправлена", "выдана", "отменена"];
// После этих статусов товар считается ушедшим со склада — остаток списывается.
const DEDUCTING = new Set(["подтверждена", "собрана", "отправлена", "выдана"]);
const CLOSING = new Set(["выдана", "отменена"]);
const MAX_ITEMS = 30;

export const ordersRouter = Router();

// Не более 15 заявок в час с одного IP — иначе базу можно завалить
// фейковыми заявками без единого подбора пароля.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true, // не штрафуем за ошибку валидации — только за реально созданные заявки
  message: { error: "Слишком много заявок подряд. Попробуйте позже или позвоните нам напрямую." },
});

// Отдельно — не больше 1 заявки в минуту с одного IP. Часовой лимит выше не
// спасает от пачки в одну секунду (просто быстрее исчерпает свои 15), а этот
// ограничивает саму частоту — чтобы менеджеру не прилетело 10 заявок разом.
const burstLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true, // ошибка валидации не считается — иначе покупатель с опечаткой не сможет сразу поправить и отправить снова
  message: { error: "Заявка уже отправляется — подождите минуту перед повторной отправкой." },
});

function formatOrder(r) {
  const createdAt = new Date(r.created_at).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const consentAt = r.consent_at
    ? new Date(r.consent_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;
  return {
    id: String(r.id),
    createdAt,
    name: r.name,
    phone: r.phone,
    city: r.city,
    pickup: r.pickup,
    comment: r.comment,
    items: r.items,
    status: r.status,
    stockDeducted: r.stock_deducted,
    consentGiven: r.consent_given,
    consentAt,
    consentVersion: r.consent_version,
  };
}

ordersRouter.get("/", requireAdmin, async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
  res.json(rows.map(formatOrder));
});

ordersRouter.post("/", burstLimiter, submitLimiter, async (req, res) => {
  const { name, phone, city, comment, items, consentGiven, website } = req.body || {};

  // Honeypot: обычный посетитель это поле не видит и не заполняет — заполненное
  // значит, что заявку прислал бот. Отвечаем как обычно, просто ничего не сохраняем.
  if (website) {
    return res.status(201).json({ id: "0" });
  }

  const cleanName = String(name ?? "").trim();
  const cleanCity = String(city ?? "").trim();
  const cleanComment = String(comment ?? "").trim();
  const phoneDigits = String(phone ?? "").replace(/\D/g, "");

  if (!cleanName || !cleanCity || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Заполните все обязательные поля заявки." });
  }
  if (phoneDigits.length !== 11 || !/^[78]/.test(phoneDigits)) {
    return res.status(400).json({ error: "Введите номер телефона полностью." });
  }
  if (cleanName.length > 100 || cleanCity.length > 100 || cleanComment.length > 1000) {
    return res.status(400).json({ error: "Слишком длинный текст в одном из полей." });
  }
  if (consentGiven !== true) {
    return res.status(400).json({ error: "Нужно согласие на обработку персональных данных." });
  }
  if (items.length > MAX_ITEMS) {
    return res.status(400).json({ error: "Слишком много позиций в одной заявке." });
  }

  // Состав заявки собираем на сервере из того, что реально есть на сайте:
  // клиенту верим только в артикул и количество, цену и название берём у себя
  // и фиксируем в заявке — чтобы потом смена цены не меняла старые заявки.
  const wanted = new Map();
  for (const it of items) {
    const sku = String(it?.sku ?? "");
    const qty = Number(it?.qty);
    if (!sku || !Number.isInteger(qty) || qty < 1 || qty > 999) {
      return res.status(400).json({ error: "Некорректный состав заявки." });
    }
    wanted.set(sku, (wanted.get(sku) || 0) + qty);
  }
  const { rows: found } = await pool.query(
    `SELECT s.sku, s.price, s.stock, COALESCE(NULLIF(p.title, ''), s.stock_name) AS title
     FROM stock s JOIN products p ON p.sku = s.sku
     WHERE s.sku = ANY($1) AND p.published = true`,
    [[...wanted.keys()]]
  );
  const bySku = Object.fromEntries(found.map((r) => [r.sku, r]));
  const orderItems = [];
  for (const [sku, qty] of wanted) {
    const row = bySku[sku];
    if (!row) {
      return res.status(400).json({ error: "Одного из товаров уже нет на сайте. Обновите страницу и соберите заявку заново." });
    }
    if (qty > row.stock) {
      return res.status(400).json({
        error: row.stock > 0 ? `«${row.title}»: осталось только ${row.stock} шт.` : `«${row.title}» закончился.`,
      });
    }
    orderItems.push({ sku, qty, price: row.price, title: row.title });
  }

  const { rows } = await pool.query(
    `INSERT INTO orders (
       name, phone, city, comment, items, pickup, status,
       consent_given, consent_at, consent_version, consent_text_hash, consent_ip, consent_user_agent
     )
     VALUES ($1,$2,$3,$4,$5,'ПВЗ уточняется','новая', true, now(), $6,$7,$8,$9)
     RETURNING *`,
    [
      cleanName,
      String(phone).trim().slice(0, 30),
      cleanCity,
      cleanComment,
      JSON.stringify(orderItems),
      CONSENT.version,
      CONSENT.hash,
      req.ip,
      (req.get("user-agent") || "").slice(0, 300),
    ]
  );

  res.status(201).json(formatOrder(rows[0]));
});

// Смена статуса. Остаток на сайте списывается, когда заявка подтверждена, и
// возвращается, если её вернули в «новую» или отменили — но только один раз,
// за этим следит флаг stock_deducted.
ordersRouter.patch("/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "Неизвестный статус." });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: cur } = await client.query(`SELECT * FROM orders WHERE id = $1 FOR UPDATE`, [req.params.id]);
    const order = cur[0];
    if (!order) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Заявка не найдена." });
    }

    let deducted = order.stock_deducted;
    if (DEDUCTING.has(status) && !deducted) {
      for (const it of order.items) {
        await client.query(`UPDATE stock SET stock = GREATEST(stock - $1, 0), updated_at = now() WHERE sku = $2`, [
          it.qty,
          it.sku,
        ]);
      }
      deducted = true;
    } else if (!DEDUCTING.has(status) && deducted) {
      for (const it of order.items) {
        await client.query(`UPDATE stock SET stock = stock + $1, updated_at = now() WHERE sku = $2`, [it.qty, it.sku]);
      }
      deducted = false;
    }

    const { rows } = await client.query(
      `UPDATE orders SET status = $1, stock_deducted = $2,
         closed_at = CASE WHEN $3 THEN COALESCE(closed_at, now()) ELSE NULL END
       WHERE id = $4 RETURNING *`,
      [status, deducted, CLOSING.has(status), req.params.id]
    );
    await client.query("COMMIT");
    res.json(formatOrder(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
});

// Удаление по запросу субъекта ПДн (отзыв согласия) — доступно только владельцу.
ordersRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { rowCount } = await pool.query(`DELETE FROM orders WHERE id = $1`, [req.params.id]);
  if (!rowCount) {
    return res.status(404).json({ error: "Заявка не найдена." });
  }
  res.status(204).end();
});
