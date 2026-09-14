import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { requireAdmin } from "./auth.js";
import { CONSENT } from "../legal.js";

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

  if (!name?.trim() || !phone?.trim() || !city?.trim() || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Заполните все обязательные поля заявки." });
  }
  if (consentGiven !== true) {
    return res.status(400).json({ error: "Нужно согласие на обработку персональных данных." });
  }

  const { rows } = await pool.query(
    `INSERT INTO orders (
       name, phone, city, comment, items, pickup, status,
       consent_given, consent_at, consent_version, consent_text_hash, consent_ip, consent_user_agent
     )
     VALUES ($1,$2,$3,$4,$5,'ПВЗ уточняется','новая', true, now(), $6,$7,$8,$9)
     RETURNING *`,
    [
      name.trim(),
      phone.trim(),
      city.trim(),
      (comment || "").trim(),
      JSON.stringify(items),
      CONSENT.version,
      CONSENT.hash,
      req.ip,
      req.get("user-agent") || "",
    ]
  );

  res.status(201).json(formatOrder(rows[0]));
});

ordersRouter.patch("/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  const { rows } = await pool.query(`UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`, [
    status,
    req.params.id,
  ]);
  if (!rows[0]) {
    return res.status(404).json({ error: "Заявка не найдена." });
  }
  res.json(formatOrder(rows[0]));
});

// Удаление по запросу субъекта ПДн (отзыв согласия) — доступно только владельцу.
ordersRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { rowCount } = await pool.query(`DELETE FROM orders WHERE id = $1`, [req.params.id]);
  if (!rowCount) {
    return res.status(404).json({ error: "Заявка не найдена." });
  }
  res.status(204).end();
});
