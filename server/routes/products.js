import { Router } from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import { pool } from "../db.js";
import { requireAdmin } from "./auth.js";

export const productsRouter = Router();

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ALLOWED_TYPES.has(file.mimetype)),
});

const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

async function loadProducts() {
  const { rows: stockRows } = await pool.query(`SELECT sku, stock_name, price, stock FROM stock`);
  const { rows } = await pool.query(
    `SELECT p.sku, p.title, c.name AS category, p.description, p.usage_text AS usage, p.sgr,
            p.composition, p.published, (p.image_data IS NOT NULL) AS has_image, p.updated_at, p.badge
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id`
  );
  const bySku = Object.fromEntries(rows.map((r) => [r.sku, r]));
  const stockSkus = new Set(stockRows.map((s) => s.sku));
  // Метка версии в URL — чтобы браузер не показывал старое фото из кэша после замены.
  const imageUrl = (r) => (r?.has_image ? `/api/products/${r.sku}/photo?v=${new Date(r.updated_at).getTime()}` : null);

  const fromStock = stockRows.map((s) => {
    const c = bySku[s.sku];
    return {
      sku: s.sku,
      stockName: s.stock_name,
      price: s.price,
      stock: s.stock,
      hasStock: true,
      title: c?.title || "",
      category: c?.category || "",
      description: c?.description || "",
      usage: c?.usage || "",
      sgr: c?.sgr || "",
      composition: c?.composition || [],
      published: c?.published || false,
      imageUrl: imageUrl(c),
      badge: c?.badge || null,
    };
  });

  const fromContentOnly = rows
    .filter((r) => !stockSkus.has(r.sku))
    .map((r) => ({
      sku: r.sku,
      stockName: null,
      price: null,
      stock: null,
      hasStock: false,
      title: r.title,
      category: r.category,
      description: r.description,
      usage: r.usage,
      sgr: r.sgr,
      composition: r.composition,
      published: r.published,
      imageUrl: imageUrl(r),
      badge: r.badge || null,
    }));

  return [...fromStock, ...fromContentOnly];
}

productsRouter.get("/", async (req, res) => {
  res.json(await loadProducts());
});

productsRouter.get("/:sku/photo", async (req, res) => {
  const { rows } = await pool.query("SELECT image_data, image_mimetype FROM products WHERE sku = $1", [
    req.params.sku,
  ]);
  const row = rows[0];
  if (!row?.image_data) {
    return res.status(404).end();
  }
  res.set("Content-Type", row.image_mimetype);
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(row.image_data);
});

productsRouter.put("/:sku", requireAdmin, async (req, res) => {
  const { sku } = req.params;
  const { title, category, description, usage, sgr, composition, published, badge, price, stock, stockName } =
    req.body || {};

  if (price != null && stock != null) {
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (!Number.isFinite(priceNum) || priceNum < 0 || !Number.isFinite(stockNum) || stockNum < 0) {
      return res.status(400).json({ error: "Цена и остаток должны быть неотрицательными числами." });
    }
    await pool.query(
      `INSERT INTO stock (sku, stock_name, price, stock, updated_at) VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (sku) DO UPDATE SET
         stock_name = EXCLUDED.stock_name, price = EXCLUDED.price, stock = EXCLUDED.stock, updated_at = now()`,
      [sku, (stockName || "").trim(), Math.round(priceNum), Math.round(stockNum)]
    );
  }

  const { rows: stockRows } = await pool.query("SELECT 1 FROM stock WHERE sku = $1", [sku]);
  const hasStock = stockRows.length > 0;
  const safePublished = hasStock && !!published;

  let categoryId = null;
  if (category) {
    const { rows } = await pool.query("SELECT id FROM categories WHERE name = $1", [category]);
    categoryId = rows[0]?.id ?? null;
  }

  await pool.query(
    `INSERT INTO products (sku, title, category_id, description, usage_text, sgr, composition, published, badge, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
     ON CONFLICT (sku) DO UPDATE SET
       title = EXCLUDED.title,
       category_id = EXCLUDED.category_id,
       description = EXCLUDED.description,
       usage_text = EXCLUDED.usage_text,
       sgr = EXCLUDED.sgr,
       composition = EXCLUDED.composition,
       published = EXCLUDED.published,
       badge = EXCLUDED.badge,
       updated_at = now()`,
    [
      sku,
      title || "",
      categoryId,
      description || "",
      usage || "",
      sgr || "",
      JSON.stringify(composition || []),
      safePublished,
      badge || null,
    ]
  );

  res.json(await loadProducts());
});

productsRouter.post("/:sku/image", requireAdmin, (req, res) => {
  uploadPhoto.single("photo")(req, res, async (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Файл слишком большой (максимум 5 МБ)." : "Не удалось загрузить файл.";
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Разрешены только JPEG, PNG или WebP, до 5 МБ." });
    }

    const sku = req.params.sku;
    await pool.query(
      `INSERT INTO products (sku, image_data, image_mimetype, updated_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (sku) DO UPDATE SET image_data = EXCLUDED.image_data, image_mimetype = EXCLUDED.image_mimetype, updated_at = now()`,
      [sku, req.file.buffer, req.file.mimetype]
    );

    res.json({ imageUrl: `/api/products/${sku}/photo?v=${Date.now()}` });
  });
});

// Массовая загрузка цен из Excel — два столбца: артикул, цена. Строку-заголовок
// и всё, что не похоже на число, просто пропускаем. Осознанное отступление от
// исходной архитектуры (см. CLAUDE.md) — цена/остаток теперь ведутся на сайте.
productsRouter.post("/import-prices", requireAdmin, (req, res) => {
  uploadSpreadsheet.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: "Не удалось загрузить файл (максимум 2 МБ)." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Файл не выбран." });
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(req.file.buffer);
    } catch {
      return res.status(400).json({ error: "Не удалось прочитать файл — нужен настоящий файл Excel (.xlsx)." });
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return res.status(400).json({ error: "В файле нет ни одного листа." });
    }

    const rows = [];
    sheet.eachRow((row) => {
      const sku = String(row.getCell(1).value ?? "").trim().toUpperCase();
      const priceText = String(row.getCell(2).value ?? "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "");
      const price = priceText === "" ? NaN : Number(priceText);
      if (!sku || !Number.isFinite(price) || price < 0) return;
      rows.push({ sku, price: Math.round(price) });
    });

    if (rows.length === 0) {
      return res.status(400).json({
        error: "Не нашли ни одной строки вида «артикул, цена». Первый столбец — артикул, второй — цена.",
      });
    }

    let updated = 0;
    let created = 0;
    for (const { sku, price } of rows) {
      const { rows: existing } = await pool.query("SELECT 1 FROM stock WHERE sku = $1", [sku]);
      if (existing.length) {
        await pool.query("UPDATE stock SET price = $1, updated_at = now() WHERE sku = $2", [price, sku]);
        updated++;
      } else {
        await pool.query(
          "INSERT INTO stock (sku, stock_name, price, stock) VALUES ($1, '', $2, 0)",
          [sku, price]
        );
        created++;
      }
    }

    res.json({ updated, created, total: rows.length, products: await loadProducts() });
  });
});
