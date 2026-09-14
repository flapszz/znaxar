import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";

export const authRouter = Router();

// Не более 10 попыток входа за 15 минут с одного IP — иначе пароль
// админки можно перебирать сколько угодно раз без ограничений.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много попыток входа. Попробуйте через 15 минут." },
});

authRouter.post("/login", loginLimiter, async (req, res) => {
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
