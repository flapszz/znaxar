import { Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "./auth.js";

export const categoriesRouter = Router();

async function loadCategories() {
  const { rows } = await pool.query(`SELECT id, name, position FROM categories ORDER BY position, id`);
  return rows;
}

categoriesRouter.get("/", async (req, res) => {
  res.json(await loadCategories());
});

categoriesRouter.post("/", requireAdmin, async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Укажите название категории." });
  const { rows } = await pool.query(`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM categories`);
  try {
    await pool.query(`INSERT INTO categories (name, position) VALUES ($1, $2)`, [name, rows[0].next]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "Такая категория уже есть." });
    throw err;
  }
  res.status(201).json(await loadCategories());
});

categoriesRouter.put("/:id", requireAdmin, async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Укажите название категории." });
  try {
    await pool.query(`UPDATE categories SET name = $1 WHERE id = $2`, [name, req.params.id]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "Такая категория уже есть." });
    throw err;
  }
  res.json(await loadCategories());
});

categoriesRouter.delete("/:id", requireAdmin, async (req, res) => {
  // Товары с этой категорией не удаляются — просто останутся без категории (FK ON DELETE SET NULL).
  await pool.query(`DELETE FROM categories WHERE id = $1`, [req.params.id]);
  res.json(await loadCategories());
});

categoriesRouter.put("/reorder/all", requireAdmin, async (req, res) => {
  const order = req.body?.order || [];
  for (let i = 0; i < order.length; i++) {
    await pool.query(`UPDATE categories SET position = $1 WHERE id = $2`, [i, order[i]]);
  }
  res.json(await loadCategories());
});
