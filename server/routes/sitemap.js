import { Router } from "express";
import { pool } from "../db.js";

export const sitemapRouter = Router();

const STATIC_PATHS = ["/", "/about", "/articles", "/news", "/privacy", "/consent", "/terms"];

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

sitemapRouter.get("/sitemap.xml", async (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;

  const { rows: skuRows } = await pool.query(
    `SELECT p.sku FROM products p JOIN stock s ON s.sku = p.sku WHERE p.published = true`
  );
  const { rows: pubRows } = await pool.query(
    `SELECT type, slug FROM publications WHERE published = true`
  );

  const urls = [
    ...STATIC_PATHS,
    ...skuRows.map((r) => `/product/${encodeURIComponent(r.sku)}`),
    ...pubRows.map((r) => `/${r.type === "article" ? "articles" : "news"}/${encodeURIComponent(r.slug)}`),
  ];

  const body = urls.map((path) => `  <url><loc>${escapeXml(base + path)}</loc></url>`).join("\n");

  res.set("Content-Type", "application/xml");
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
});
