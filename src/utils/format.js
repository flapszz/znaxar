export const money = (n) => (typeof n === "number" ? n.toLocaleString("ru-RU") + " ₽" : "—");
