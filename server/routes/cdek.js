import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { requireAdmin } from "./auth.js";
import { CdekError, cdek, cdekConfig } from "../cdek/client.js";

export const cdekRouter = Router();

// Всё публичное (поиск города, пункты, расчёт) не должно быть способом нагрузить наш аккаунт СДЭК.
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов. Подождите минуту." },
});

const DEFAULT_WEIGHT_G = Number(process.env.CDEK_DEFAULT_WEIGHT_G) || 200;
// Тариф по умолчанию: 136 — «Посылка склад-склад» (до пункта выдачи). Меняется переменной.
const TARIFF = Number(process.env.CDEK_TARIFF_CODE) || 136;

function fail(res, e) {
  if (e instanceof CdekError) return res.status(e.status).json({ error: e.message });
  console.error("Ошибка СДЭК:", e?.message);
  return res.status(500).json({ error: "Не удалось выполнить запрос к СДЭК." });
}

// Откуда отправляем. Заполняется переменными окружения, когда будет известен склад.
function sender() {
  return {
    cityCode: Number(process.env.CDEK_FROM_CITY_CODE) || null,
    shipmentPoint: process.env.CDEK_SHIPMENT_POINT || null, // код ПВЗ/склада СДЭК, откуда сдаём посылки
    name: process.env.CDEK_SENDER_NAME || "",
    phone: process.env.CDEK_SENDER_PHONE || "",
  };
}

// Состав заявки → посылка: вес считаем по данным магазина, а не по тому, что прислал браузер.
async function packageFor(items) {
  const { rows } = await pool.query(
    `SELECT p.sku, COALESCE(NULLIF(p.title,''), s.stock_name) AS title, p.weight_g, s.price
     FROM products p JOIN stock s ON s.sku = p.sku WHERE p.sku = ANY($1)`,
    [items.map((i) => i.sku)]
  );
  const bySku = Object.fromEntries(rows.map((r) => [r.sku, r]));
  const lines = items.map((i) => {
    const r = bySku[i.sku];
    return { sku: i.sku, title: r?.title || i.title || i.sku, qty: i.qty, price: i.price ?? r?.price ?? 0, weight: r?.weight_g || DEFAULT_WEIGHT_G };
  });
  const weight = Math.max(100, lines.reduce((w, l) => w + l.weight * l.qty, 0));
  return { lines, weight, length: 20, width: 15, height: 10 };
}

cdekRouter.get("/status", (req, res) => {
  const { enabled, mode } = cdekConfig();
  res.json({ enabled, mode });
});

// Поиск города по названию (для выбора города и пункта выдачи).
cdekRouter.get("/cities", publicLimiter, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json([]);
    const data = await cdek("GET", "/location/cities", { query: { country_codes: "RU", city: q, size: 8 } });
    res.json((data || []).map((c) => ({ code: c.code, city: c.city, region: c.region })));
  } catch (e) {
    fail(res, e);
  }
});

// Пункты выдачи в городе — для карты и списка.
cdekRouter.get("/points", publicLimiter, async (req, res) => {
  try {
    const cityCode = Number(req.query.city_code);
    if (!Number.isInteger(cityCode)) return res.status(400).json({ error: "Не указан город." });
    const data = await cdek("GET", "/deliverypoints", { query: { city_code: cityCode, type: "PVZ" } });
    res.json(
      (data || []).map((p) => ({
        code: p.code,
        name: p.name,
        address: p.location?.address_full || p.location?.address,
        lat: p.location?.latitude,
        lon: p.location?.longitude,
        workTime: p.work_time,
        isCashOnDelivery: Boolean(p.have_cashless !== undefined || p.have_cash),
      }))
    );
  } catch (e) {
    fail(res, e);
  }
});

// Стоимость и срок доставки для корзины.
cdekRouter.post("/calc", publicLimiter, async (req, res) => {
  try {
    const { cityCode, items } = req.body || {};
    const from = sender();
    if (!from.cityCode) throw new CdekError("Город отправления ещё не настроен.", 503);
    if (!Number.isInteger(cityCode) || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Нужны город и состав заказа." });
    }
    const pkg = await packageFor(items.map((i) => ({ sku: String(i.sku), qty: Number(i.qty) || 1 })));
    const data = await cdek("POST", "/calculator/tariff", {
      body: {
        tariff_code: TARIFF,
        from_location: { code: from.cityCode },
        to_location: { code: cityCode },
        packages: [{ weight: pkg.weight, length: pkg.length, width: pkg.width, height: pkg.height }],
      },
    });
    res.json({ price: Math.ceil(data.total_sum), periodMin: data.period_min, periodMax: data.period_max });
  } catch (e) {
    fail(res, e);
  }
});

// Накладная — ТОЛЬКО по кнопке владельца после подтверждения заявки (а не автоматически),
// иначе фейковые заявки плодили бы отправления.
cdekRouter.post("/orders/:id/create", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
    const o = rows[0];
    if (!o) return res.status(404).json({ error: "Заявка не найдена." });
    if (o.cdek_uuid) return res.status(409).json({ error: "Накладная по этой заявке уже создана." });
    if (!["подтверждена", "собрана"].includes(o.status)) {
      return res.status(409).json({ error: "Накладную можно создать после подтверждения заявки." });
    }
    if (!o.pickup_code) return res.status(409).json({ error: "У заявки не выбран пункт выдачи." });

    const from = sender();
    if (!from.shipmentPoint) throw new CdekError("Не настроен пункт, откуда отправляем (CDEK_SHIPMENT_POINT).", 503);
    const pkg = await packageFor(o.items);
    const payload = {
      type: 1, // интернет-магазин
      number: String(o.id),
      tariff_code: TARIFF,
      comment: `Заявка № ${o.id}`,
      shipment_point: from.shipmentPoint,
      delivery_point: o.pickup_code,
      sender: { name: from.name, phones: [{ number: from.phone }] },
      recipient: { name: o.name, phones: [{ number: o.phone.replace(/\D/g, "").replace(/^8/, "7").replace(/^/, "+") }] },
      packages: [
        {
          number: "1",
          weight: pkg.weight,
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
          items: pkg.lines.map((l) => ({
            name: l.title,
            ware_key: l.sku,
            payment: { value: l.price }, // оплата при получении: сумма к оплате за единицу
            cost: l.price,
            weight: l.weight,
            amount: l.qty,
            // КОДЫ МАРКИРОВКИ («Честный знак») добавляются сюда ТОЛЬКО на сервере, когда подключим учёт кодов.
          })),
        },
      ],
    };
    const data = await cdek("POST", "/orders", { body: payload });
    const uuid = data?.entity?.uuid || null;
    await pool.query("UPDATE orders SET cdek_uuid = $1, cdek_status = 'создана', cdek_error = NULL WHERE id = $2", [uuid, o.id]);
    res.status(201).json({ uuid });
  } catch (e) {
    await pool.query("UPDATE orders SET cdek_error = $1 WHERE id = $2", [String(e.message).slice(0, 300), req.params.id]).catch(() => {});
    fail(res, e);
  }
});

// Обновить номер и статус накладной вручную (кнопка в админке).
cdekRouter.post("/orders/:id/refresh", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT cdek_uuid FROM orders WHERE id = $1", [req.params.id]);
    if (!rows[0]?.cdek_uuid) return res.status(404).json({ error: "Накладная не создана." });
    const data = await cdek("GET", `/orders/${rows[0].cdek_uuid}`);
    // Берём самый свежий статус по времени (если время есть), иначе последний в списке.
    const list = data?.entity?.statuses || [];
    const latest = [...list].sort((a, b) => String(b.date_time || "").localeCompare(String(a.date_time || "")))[0] || list.at(-1);
    const status = (list.some((x) => x.date_time) ? latest : list.at(-1))?.name || null;
    const number = data?.entity?.cdek_number || null;
    await pool.query("UPDATE orders SET cdek_number = COALESCE($1, cdek_number), cdek_status = COALESCE($2, cdek_status) WHERE id = $3", [number, status, req.params.id]);
    res.json({ number, status });
  } catch (e) {
    fail(res, e);
  }
});

// Приём статусов от СДЭК. Адрес с секретом в строке: /api/cdek/webhook?token=<CDEK_WEBHOOK_SECRET>.
// Сам вебхук регистрируется у СДЭК один раз, когда сайт получит боевой адрес.
cdekRouter.post("/webhook", async (req, res) => {
  const secret = process.env.CDEK_WEBHOOK_SECRET;
  if (!secret || req.query.token !== secret) return res.status(403).end();
  try {
    const uuid = req.body?.uuid;
    const attrs = req.body?.attributes || {};
    if (uuid) {
      await pool.query(
        "UPDATE orders SET cdek_status = COALESCE($1, cdek_status), cdek_number = COALESCE($2, cdek_number) WHERE cdek_uuid = $3",
        [attrs.status_name || attrs.code || null, attrs.cdek_number || null, uuid]
      );
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Вебхук СДЭК:", e.message);
    res.status(500).end();
  }
});
