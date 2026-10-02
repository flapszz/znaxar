import { Router } from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import sharp from "sharp";
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
    `SELECT p.sku, p.title, c.name AS category, b.name AS brand, p.description, p.usage_text AS usage, p.sgr,
            p.composition, p.published, (p.image_data IS NOT NULL) AS has_image, p.updated_at, p.badge
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id`
  );
  const bySku = Object.fromEntries(rows.map((r) => [r.sku, r]));
  const stockSkus = new Set(stockRows.map((s) => s.sku));
  // Метка версии в URL — чтобы браузер не показывал старое фото из кэша после замены.
  const imageUrl = (r) => (r?.has_image ? `/api/products/${r.sku}/photo?v=${new Date(r.updated_at).getTime()}` : null);
  const thumbUrl = (r) => (r?.has_image ? `${imageUrl(r)}&size=thumb` : null);

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
      brand: c?.brand || "",
      description: c?.description || "",
      usage: c?.usage || "",
      sgr: c?.sgr || "",
      composition: c?.composition || [],
      published: c?.published || false,
      imageUrl: imageUrl(c),
      thumbUrl: thumbUrl(c),
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
      brand: r.brand,
      description: r.description,
      usage: r.usage,
      sgr: r.sgr,
      composition: r.composition,
      published: r.published,
      imageUrl: imageUrl(r),
      thumbUrl: thumbUrl(r),
      badge: r.badge || null,
    }));

  return [...fromStock, ...fromContentOnly];
}

productsRouter.get("/", async (req, res) => {
  res.json(await loadProducts());
});

productsRouter.get("/:sku/photo", async (req, res) => {
  const { rows } = await pool.query("SELECT image_data, image_thumb, image_mimetype FROM products WHERE sku = $1", [
    req.params.sku,
  ]);
  const row = rows[0];
  const useThumb = req.query.size === "thumb" && row?.image_thumb;
  const data = useThumb ? row.image_thumb : row?.image_data;
  if (!data) {
    return res.status(404).end();
  }
  res.set("Content-Type", useThumb ? "image/webp" : row.image_mimetype);
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(data);
});

productsRouter.put("/:sku", requireAdmin, async (req, res) => {
  const { sku } = req.params;
  const { title, category, brand, description, usage, sgr, composition, published, badge, price, stock, stockName } =
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

  let brandId = null;
  if (brand) {
    const { rows } = await pool.query("SELECT id FROM brands WHERE name = $1", [brand]);
    brandId = rows[0]?.id ?? null;
  }

  await pool.query(
    `INSERT INTO products (sku, title, category_id, brand_id, description, usage_text, sgr, composition, published, badge, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
     ON CONFLICT (sku) DO UPDATE SET
       title = EXCLUDED.title,
       category_id = EXCLUDED.category_id,
       brand_id = EXCLUDED.brand_id,
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
      brandId,
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

// Полное удаление позиции (описание, фото, цена и остаток). Старые заявки не
// страдают — название и цена фиксируются в самой заявке.
productsRouter.delete("/:sku", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM collection_products WHERE sku = $1", [req.params.sku]).catch(() => {});
  await pool.query("DELETE FROM products WHERE sku = $1", [req.params.sku]);
  await pool.query("DELETE FROM stock WHERE sku = $1", [req.params.sku]);
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
    // Фото с телефона бывают по 4–5 МБ и 4000 px — сжимаем до 1200 px для страницы
    // товара и делаем маленькую копию (480 px) для каталога. Поворот по EXIF учитываем.
    let large, thumb;
    try {
      const base = sharp(req.file.buffer).rotate();
      large = await base.clone().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      thumb = await base.clone().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    } catch {
      return res.status(400).json({ error: "Не удалось прочитать картинку — попробуйте другой файл." });
    }
    await pool.query(
      `INSERT INTO products (sku, image_data, image_thumb, image_mimetype, updated_at) VALUES ($1, $2, $3, 'image/webp', now())
       ON CONFLICT (sku) DO UPDATE SET image_data = EXCLUDED.image_data, image_thumb = EXCLUDED.image_thumb,
         image_mimetype = EXCLUDED.image_mimetype, updated_at = now()`,
      [sku, large, thumb]
    );

    res.json({ imageUrl: `/api/products/${sku}/photo?v=${Date.now()}` });
  });
});

// Скачать текущие цены и остатки таблицей — владелец правит цифры в Excel и
// загружает файл обратно. Так артикулы не набираются вручную и опечаток не будет.
productsRouter.get("/export-prices", requireAdmin, async (req, res) => {
  const products = await loadProducts();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Цены и остатки");
  sheet.columns = [
    { header: "Артикул", key: "sku", width: 14 },
    { header: "Цена, ₽", key: "price", width: 12 },
    { header: "Остаток, шт", key: "stock", width: 14 },
    { header: "Название (для справки, не загружается)", key: "title", width: 44 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const p of products.filter((x) => x.hasStock)) {
    sheet.addRow({ sku: p.sku, price: p.price, stock: p.stock, title: p.title || p.stockName });
  }
  res.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.set("Content-Disposition", "attachment; filename*=UTF-8''" + encodeURIComponent("цены-и-остатки.xlsx"));
  await workbook.xlsx.write(res);
  res.end();
});

// Массовая загрузка из Excel: артикул, цена и (необязательно) остаток. Строку-заголовок
// и всё, что не похоже на число, пропускаем. Новые товары тут не создаются — артикул,
// которого нет на сайте, попадает в список «не найдено», а не заводит товар-призрак
// из-за опечатки. Осознанное отступление от исходной архитектуры (см. CLAUDE.md).
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

    const toNumber = (cell) => {
      const text = String(cell.value ?? "").replace(",", ".").replace(/[^\d.]/g, "");
      const n = text === "" ? NaN : Number(text);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
    };

    const rows = [];
    sheet.eachRow((row) => {
      const sku = String(row.getCell(1).value ?? "").trim().toUpperCase();
      const price = toNumber(row.getCell(2));
      const stock = toNumber(row.getCell(3));
      if (!sku || price === null) return;
      rows.push({ sku, price, stock });
    });

    if (rows.length === 0) {
      return res.status(400).json({
        error: "Не нашли ни одной строки. Первый столбец — артикул, второй — цена, третий (необязательно) — остаток.",
      });
    }

    let updated = 0;
    const notFound = [];
    for (const { sku, price, stock } of rows) {
      const { rowCount } = await pool.query(
        "UPDATE stock SET price = $1, stock = COALESCE($2, stock), updated_at = now() WHERE sku = $3",
        [price, stock, sku]
      );
      if (rowCount) updated++;
      else notFound.push(sku);
    }

    res.json({ updated, notFound, total: rows.length, products: await loadProducts() });
  });
});
