import { Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "./auth.js";

export const publicationsRouter = Router();

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

// Автоматическая ссылка из заголовка — чтобы владелец не имел дела со словом
// «slug» и техническими полями (см. CLAUDE.md: никакого жаргона в интерфейсе).
function slugify(title) {
  const base = title
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "bez-nazvaniya";
}

async function uniqueSlug(type, title, excludeId) {
  const base = slugify(title);
  let slug = base;
  let i = 2;
  for (;;) {
    const { rows } = await pool.query(
      `SELECT id FROM publications WHERE type = $1 AND slug = $2 AND id IS DISTINCT FROM $3`,
      [type, slug, excludeId ?? null]
    );
    if (rows.length === 0) return slug;
    slug = `${base}-${i++}`;
  }
}

function formatItem(r) {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    slug: r.slug,
    body: r.body,
    published: r.published,
    createdAt: new Date(r.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" }),
  };
}

publicationsRouter.get("/:type", async (req, res) => {
  const { type } = req.params;
  if (type !== "article" && type !== "news") return res.status(404).json({ error: "Неизвестный раздел." });
  const { rows } = await pool.query(
    `SELECT * FROM publications WHERE type = $1 ORDER BY created_at DESC`,
    [type]
  );
  res.json(rows.map(formatItem));
});

publicationsRouter.post("/:type", requireAdmin, async (req, res) => {
  const { type } = req.params;
  if (type !== "article" && type !== "news") return res.status(404).json({ error: "Неизвестный раздел." });
  const title = (req.body?.title || "").trim();
  if (!title) return res.status(400).json({ error: "Укажите заголовок." });
  const slug = await uniqueSlug(type, title);
  const { rows } = await pool.query(
    `INSERT INTO publications (type, title, slug, body, published) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [type, title, slug, req.body?.body || "", !!req.body?.published]
  );
  res.status(201).json(formatItem(rows[0]));
});

publicationsRouter.put("/:type/:id", requireAdmin, async (req, res) => {
  const { type, id } = req.params;
  const title = (req.body?.title || "").trim();
  if (!title) return res.status(400).json({ error: "Укажите заголовок." });

  const { rows: existingRows } = await pool.query(`SELECT title FROM publications WHERE id = $1 AND type = $2`, [
    id,
    type,
  ]);
  if (!existingRows[0]) return res.status(404).json({ error: "Не найдено." });

  // Ссылку меняем, только если поменялся заголовок — иначе уже опубликованная
  // ссылка не должна скакать от одного мелкого изменения текста.
  const slug = title === existingRows[0].title ? undefined : await uniqueSlug(type, title, id);

  const { rows } = await pool.query(
    `UPDATE publications SET title = $1, body = $2, published = $3, updated_at = now()${slug ? ", slug = $5" : ""}
     WHERE id = $4 RETURNING *`,
    slug
      ? [title, req.body?.body || "", !!req.body?.published, id, slug]
      : [title, req.body?.body || "", !!req.body?.published, id]
  );
  res.json(formatItem(rows[0]));
});

publicationsRouter.delete("/:type/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM publications WHERE id = $1 AND type = $2`, [req.params.id, req.params.type]);
  res.status(204).end();
});
