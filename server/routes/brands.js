import { Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "./auth.js";

export const brandsRouter = Router();

async function loadBrands() {
  const { rows } = await pool.query(`SELECT id, name, position FROM brands ORDER BY position, id`);
  return rows;
}

brandsRouter.get("/", async (req, res) => {
  res.json(await loadBrands());
});

brandsRouter.post("/", requireAdmin, async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Укажите название бренда." });
  const { rows } = await pool.query(`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM brands`);
  try {
    await pool.query(`INSERT INTO brands (name, position) VALUES ($1, $2)`, [name, rows[0].next]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "Такой бренд уже есть." });
    throw err;
  }
  res.status(201).json(await loadBrands());
});

brandsRouter.put("/:id", requireAdmin, async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Укажите название бренда." });
  try {
    await pool.query(`UPDATE brands SET name = $1 WHERE id = $2`, [name, req.params.id]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "Такой бренд уже есть." });
    throw err;
  }
  res.json(await loadBrands());
});

brandsRouter.delete("/:id", requireAdmin, async (req, res) => {
  // Товары с этим брендом не удаляются — просто останутся без бренда (FK ON DELETE SET NULL).
  await pool.query(`DELETE FROM brands WHERE id = $1`, [req.params.id]);
  res.json(await loadBrands());
});

brandsRouter.put("/reorder/all", requireAdmin, async (req, res) => {
  const order = req.body?.order || [];
  for (let i = 0; i < order.length; i++) {
    await pool.query(`UPDATE brands SET position = $1 WHERE id = $2`, [i, order[i]]);
  }
  res.json(await loadBrands());
});
