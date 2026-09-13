// Тексты согласий версионируются файлами legal/consent-YYYY-MM-DD.md — при изменении
// текста добавляется НОВЫЙ файл с новой датой, старый не редактируется (иначе теряется
// возможность доказать, под каким именно текстом стоял чекбокс).
import { createHash } from "crypto";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGAL_DIR = path.join(__dirname, "..", "legal");

function loadLatestConsent() {
  const files = readdirSync(LEGAL_DIR)
    .filter((f) => /^consent-\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort();
  const file = files[files.length - 1];
  if (!file) throw new Error("Не найден файл текста согласия в /legal.");
  const version = file.replace(/\.md$/, "");
  const text = readFileSync(path.join(LEGAL_DIR, file), "utf8").trim();
  const hash = createHash("sha256").update(text).digest("hex");
  return { version, text, hash };
}

// Читаем один раз при старте сервера — рестарт сервера подхватит новый файл, если он появился.
export const CONSENT = loadLatestConsent();
