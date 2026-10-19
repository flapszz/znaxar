import { DEFAULT_THEME, THEMES } from "./themes";

export const C = {
  ink: "#002752",
  paper: "#E9E4DC",
  surface: "#FBF8F3",
  card: "#FFFFFF",
  violet: "#685BC5",
  violetDk: "#4C40A0",
  acid: "#BFE800",
  peach: "#FF8D6D",
  danger: "#B23A22",
  tints: ["#E7E3F7", "#FFF3D6", "#E2ECE9", "#F1EBDA", "#E4EDDD", "#E3F0E4"],
};

// Прозрачности от ink — использовать вместо серых.
export const INK = {
  72: "rgba(0,39,82,.72)", // текст с гарантированным контрастом ≥4.5:1 на surface/paper — юридические тексты
  60: "rgba(0,39,82,.68)", // вторичный текст, ≥4.5:1 на любом фоне сайта
  45: "rgba(0,39,82,.66)", // мелкие подписи, тоже ≥4.5:1
  18: "rgba(0,39,82,.18)",
  12: "rgba(0,39,82,.12)",
};

export const RADIUS = { pill: 8, card: 14, block: 12, frame: 20, well: 10 };

// Основной стиль — DEFAULT_THEME из themes.js. ?theme=<ключ> в адресе показывает другой
// (до закрытия вкладки), ?theme=default возвращает основной.
function pickThemeKey() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    if (fromUrl === "default") sessionStorage.removeItem("znaxar-theme");
    else if (fromUrl && THEMES[fromUrl]) sessionStorage.setItem("znaxar-theme", fromUrl);
    const saved = sessionStorage.getItem("znaxar-theme");
    if (saved && THEMES[saved]) return saved;
  } catch {
    /* хранилище может быть недоступно — тогда основной стиль */
  }
  return DEFAULT_THEME;
}

export const THEME_KEY = pickThemeKey();
const ACTIVE_THEME = THEMES[THEME_KEY];
Object.assign(C, ACTIVE_THEME.C);
Object.assign(RADIUS, ACTIVE_THEME.radius);
{
  const n = parseInt(C.ink.slice(1), 16);
  const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  const alpha = { 72: 0.72, 60: 0.68, 45: 0.66, 18: 0.18, 12: 0.12 };
  for (const k of Object.keys(INK)) INK[k] = `rgba(${rgb},${alpha[k]})`;
  const root = document.documentElement;
  root.style.setProperty("--ink", C.ink);
  root.style.setProperty("--paper", C.paper);
  root.style.setProperty("--acid", C.acid);
  root.style.setProperty("--violet", C.violet);
  root.style.setProperty("--violet-dk", C.violetDk);
  root.style.setProperty("--font-body", ACTIVE_THEME.body);
  root.dataset.theme = THEME_KEY;
  // Шрифты неосновного направления подгружаем на лету (основные уже в index.html).
  if (THEME_KEY !== DEFAULT_THEME) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${ACTIVE_THEME.fonts}&display=swap`;
    document.head.appendChild(link);
  }
}

export const SHADOW_FRAME = `0 30px 80px ${INK[12]}`;
export const CARD_BORDER = `1.5px solid ${INK[18]}`;
export const DIVIDER = `2px solid ${C.ink}`;
export const ROW_DIVIDER = `1px solid ${INK[12]}`;

export const HEAD = ACTIVE_THEME.head;
export const OVERLINE = {
  fontSize: 12,
  letterSpacing: "0.04em",
  fontWeight: 600,
  color: INK[45],
};

export const inputStyle = {
  background: C.surface,
  border: `1.5px solid ${INK[18]}`,
  color: C.ink,
  borderRadius: RADIUS.pill,
};

// Стабильная подложка под фото товара — по хешу артикула, чтобы у карточки
// не «прыгал» цвет между перерисовками.
export function tintForSku(sku = "") {
  let h = 0;
  for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) >>> 0;
  return C.tints[h % C.tints.length];
}

export const STATUS_VARIANT = {
  новая: "acid",
  подтверждена: "violet",
  собрана: "violet",
  отправлена: "violet",
  выдана: "neutral",
  отменена: "danger",
};

export const PRODUCT_BADGE_STYLE = {
  "Хит продаж": { bg: C.peach, fg: C.surface },
  "Новинка": { bg: C.violet, fg: C.surface },
  "Акция": { bg: C.acid, fg: C.ink },
};
