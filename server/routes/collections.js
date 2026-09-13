import { Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "./auth.js";

export const collectionsRouter = Router();

async function loadCollections() {
  const { rows: collections } = await pool.query(
    `SELECT id, name, position FROM collections ORDER BY position, id`
  );
  const { rows: links } = await pool.query(
    `SELECT collection_id, sku FROM collection_products ORDER BY collection_id, position`
  );
  const skusByCollection = {};
  for (const link of links) {
    (skusByCollection[link.collection_id] ||= []).push(link.sku);
  }
  return collections.map((c) => ({ ...c, skus: skusByCollection[c.id] || [] }));
}

collectionsRouter.get("/", async (req, res) => {
  res.json(await loadCollections());
});

collectionsRouter.post("/", requireAdmin, async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Укажите название подборки." });
  const { rows } = await pool.query(`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM collections`);
  await pool.query(`INSERT INTO collections (name, position) VALUES ($1, $2)`, [name, rows[0].next]);
  res.status(201).json(await loadCollections());
});

collectionsRouter.put("/:id", requireAdmin, async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Укажите название подборки." });
  await pool.query(`UPDATE collections SET name = $1 WHERE id = $2`, [name, req.params.id]);
  res.json(await loadCollections());
});

collectionsRouter.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM collections WHERE id = $1`, [req.params.id]);
  res.json(await loadCollections());
});

// Порядок самих подборок — body: { order: [id, id, ...] }
collectionsRouter.put("/reorder/all", requireAdmin, async (req, res) => {
  const order = req.body?.order || [];
  for (let i = 0; i < order.length; i++) {
    await pool.query(`UPDATE collections SET position = $1 WHERE id = $2`, [i, order[i]]);
  }
  res.json(await loadCollections());
});

// Состав и порядок товаров внутри подборки — body: { skus: [sku, sku, ...] } (уже в нужном порядке)
collectionsRouter.put("/:id/products", requireAdmin, async (req, res) => {
  const skus = req.body?.skus || [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM collection_products WHERE collection_id = $1`, [req.params.id]);
    for (let i = 0; i < skus.length; i++) {
      await client.query(
        `INSERT INTO collection_products (collection_id, sku, position) VALUES ($1, $2, $3)`,
        [req.params.id, skus[i], i]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  res.json(await loadCollections());
});
