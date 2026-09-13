import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Введите логин и пароль." });
  }

  const { rows } = await pool.query(
    "SELECT id, username, password_hash FROM admin_users WHERE username = $1",
    [username]
  );
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    return res.status(401).json({ error: "Неверный логин или пароль." });
  }

  req.session.adminId = user.id;
  res.json({ username: user.username });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

authRouter.get("/me", (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true });
});

// Для будущих защищённых admin-роутов (товары, заявки, интеграции).
export function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Не авторизован." });
  }
  next();
}
