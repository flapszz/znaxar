export const money = (n) => (typeof n === "number" ? n.toLocaleString("ru-RU") + " ₽" : "—");

// Три состояния вместо точного остатка — покупателю точная цифра не нужна,
// а нам не хочется её показывать (конкуренты, ложное ощущение дефицита и т.п.).
const LOW_STOCK_THRESHOLD = 10;
export function stockState(stock) {
  if (!stock) return "out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low";
  return "in";
}
export const STOCK_LABEL = { in: "В наличии", low: "Заканчивается", out: "Нет в наличии" };
