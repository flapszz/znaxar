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
  60: "rgba(0,39,82,.6)",
  45: "rgba(0,39,82,.45)",
  18: "rgba(0,39,82,.18)",
  12: "rgba(0,39,82,.12)",
};

export const RADIUS = { pill: 999, card: 24, block: 20, frame: 32, well: 16 };
export const SHADOW_FRAME = "0 30px 80px rgba(0,39,82,.14)";
export const CARD_BORDER = `1.5px solid ${INK[18]}`;
export const DIVIDER = `2px solid ${C.ink}`;
export const ROW_DIVIDER = `1px solid ${INK[12]}`;

export const HEAD = { fontWeight: 700, letterSpacing: "-0.02em" };
export const OVERLINE = {
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: 500,
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
  "Скидка": { bg: C.acid, fg: C.ink },
};
