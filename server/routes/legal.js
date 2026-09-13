import { Router } from "express";
import { CONSENT } from "../legal.js";

export const legalRouter = Router();

// Отдаёт текущий текст согласия — им же подписывается чекбокс в заявке, и по нему
// сервер сам считает хэш при сохранении заявки (клиентскому хэшу доверять нельзя).
legalRouter.get("/consent", (req, res) => {
  res.json({ version: CONSENT.version, text: CONSENT.text });
});
