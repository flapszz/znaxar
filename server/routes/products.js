import { Router } from "express";
import { unlink } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { pool } from "../db.js";
import { STOCK } from "../data/stock.js";
import { requireAdmin } from "./auth.js";
import { UPLOADS_DIR } from "../uploads.js";

export const productsRouter = Router();

const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const sku = (req.params.sku || "photo").replace(/[^A-Za-z0-9_-]/g, "");
      const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname);
      cb(null, `${sku}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, Boolean(ALLOWED_TYPES[file.mimetype])),
});

async function loadProducts() {
  const { rows } = await pool.query(
    `SELECT p.sku, p.title, c.name AS category, p.description, p.usage_text AS usage, p.sgr,
            p.composition, p.published, p.image_filename, p.badge
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id`
  );
  const bySku = Object.fromEntries(rows.map((r) => [r.sku, r]));
  const stockSkus = new Set(STOCK.map((s) => s.sku));
  const imageUrl = (r) => (r?.image_filename ? `/uploads/${r.image_filename}` : null);

  const fromStock = STOCK.map((s) => {
    const c = bySku[s.sku];
    return {
      sku: s.sku,
      stockName: s.stockName,
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

productsRouter.put("/:sku", requireAdmin, async (req, res) => {
  const { sku } = req.params;
  const { title, category, description, usage, sgr, composition, published, badge } = req.body || {};

  // На складе нет этого артикула — опубликовать его нельзя, что бы ни прислал фронтенд.
  const hasStock = STOCK.some((s) => s.sku === sku);
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
  upload.single("photo")(req, res, async (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Файл слишком большой (максимум 5 МБ)." : "Не удалось загрузить файл.";
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Разрешены только JPEG, PNG или WebP, до 5 МБ." });
    }

    const sku = req.params.sku;
    const { rows } = await pool.query("SELECT image_filename FROM products WHERE sku = $1", [sku]);
    const oldFilename = rows[0]?.image_filename;

    await pool.query(
      `INSERT INTO products (sku, image_filename, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (sku) DO UPDATE SET image_filename = EXCLUDED.image_filename, updated_at = now()`,
      [sku, req.file.filename]
    );

    if (oldFilename && oldFilename !== req.file.filename) {
      unlink(path.join(UPLOADS_DIR, oldFilename)).catch(() => {});
    }

    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  });
});
