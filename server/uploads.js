import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });
