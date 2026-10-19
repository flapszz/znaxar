// Направления оформления сайта.
//
// КАК СМЕНИТЬ СТИЛЬ ВСЕГО САЙТА: поменять DEFAULT_THEME ниже на ключ из списка
// (index, coral, classic, herbal, clean, honey, lab, price) — больше ничего править не нужно.
// ПОПРОБОВАТЬ БЕЗ ПРАВОК: добавить к адресу ?theme=<ключ>, выбор помнится до закрытия вкладки,
// ?theme=default возвращает основной стиль.
//
// У каждого направления: цвета (C), скругления (radius), шрифт заголовков (head),
// шрифт текста (body) и строка Google Fonts (fonts) — шрифты неосновных направлений
// подгружаются только когда направление выбрано.
export const DEFAULT_THEME = "index";

export const THEMES = {
  coral: {
    name: "Тёплый маркет",
    C: { ink: "#2B1B3D", paper: "#F1E4DA", surface: "#FFF8F1", violet: "#E5533D", violetDk: "#BD3A27", acid: "#FFC857", peach: "#FF9B7A", danger: "#B3261E",
      tints: ["#FFE5D6", "#FFF0C9", "#EBE3F5", "#FFE0E0", "#E4F0E8", "#FBE8CF"] },
    radius: { pill: 999, card: 22, block: 18, frame: 30, well: 16 },
    head: { fontFamily: '"Nunito", "Golos Text", system-ui, sans-serif', fontWeight: 900, letterSpacing: "-0.02em" },
    body: '"Golos Text", system-ui, sans-serif',
    fonts: "family=Nunito:wght@800;900&family=Golos+Text:wght@400;500;600",
  },
  classic: {
    name: "Прежний (фиолетовый)",
    C: { ink: "#002752", paper: "#E9E4DC", surface: "#FBF8F3", violet: "#685BC5", violetDk: "#4C40A0", acid: "#BFE800", peach: "#FF8D6D", danger: "#B23A22",
      tints: ["#E7E3F7", "#FFF3D6", "#E2ECE9", "#F1EBDA", "#E4EDDD", "#E3F0E4"] },
    radius: { pill: 8, card: 14, block: 12, frame: 20, well: 10 },
    head: { fontFamily: '"Lora", Georgia, serif', fontWeight: 700, letterSpacing: "-0.01em" },
    body: '"Onest", system-ui, sans-serif',
    fonts: "family=Onest:wght@400;500;600;700&family=Lora:wght@600;700",
  },
  herbal: {
    name: "Травник",
    C: { ink: "#1F3A2D", paper: "#E8E2D2", surface: "#FAF6EC", violet: "#2F6B4F", violetDk: "#1E4B37", acid: "#E0B040", peach: "#C9744A", danger: "#A93226",
      tints: ["#E6EBD8", "#F3E8C8", "#DDE8DF", "#EFE6D2", "#E3EAD6", "#F0DFD2"] },
    radius: { pill: 10, card: 14, block: 12, frame: 18, well: 10 },
    head: { fontFamily: '"Literata", Georgia, serif', fontWeight: 700, letterSpacing: "-0.01em" },
    body: '"Onest", system-ui, sans-serif',
    fonts: "family=Literata:wght@600;700&family=Onest:wght@400;500;600;700",
  },
  clean: {
    name: "Чистая аптека",
    C: { ink: "#0B1F3A", paper: "#E9EEF4", surface: "#F7F9FC", violet: "#1F5BE0", violetDk: "#1743AD", acid: "#24D6A8", peach: "#FF7A59", danger: "#C0392B",
      tints: ["#E4ECFA", "#E3F5F0", "#EAF0F7", "#F2EEE4", "#E8EAFB", "#E1F2F7"] },
    radius: { pill: 999, card: 20, block: 16, frame: 28, well: 14 },
    head: { fontFamily: '"Manrope", system-ui, sans-serif', fontWeight: 800, letterSpacing: "-0.025em" },
    body: '"Manrope", system-ui, sans-serif',
    fonts: "family=Manrope:wght@400;500;600;800",
  },
  honey: {
    name: "Мёд и лён",
    C: { ink: "#3B2A1E", paper: "#EADFCB", surface: "#FBF5E9", violet: "#5E7F3A", violetDk: "#486229", acid: "#EDA920", peach: "#C8693A", danger: "#A63A2B",
      tints: ["#F3E3BC", "#E7ECD2", "#F1DCC4", "#EFE6CF", "#E8E0C8", "#F4D9C8"] },
    radius: { pill: 14, card: 18, block: 14, frame: 22, well: 12 },
    head: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, letterSpacing: "-0.01em" },
    body: '"Onest", system-ui, sans-serif',
    fonts: "family=Playfair+Display:wght@700&family=Onest:wght@400;500;600;700",
  },
  lab: {
    name: "Лаборатория",
    C: { ink: "#12332B", paper: "#E3EBE8", surface: "#F6F9F8", violet: "#0E7C6B", violetDk: "#0A5C50", acid: "#F25C54", peach: "#F2A65A", danger: "#B3261E",
      tints: ["#DDEEE9", "#E8EFF2", "#E4EFE3", "#EEF0E3", "#E1ECEC", "#F1E8E4"] },
    radius: { pill: 8, card: 10, block: 8, frame: 14, well: 6 },
    head: { fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 700, letterSpacing: "-0.02em" },
    body: '"IBM Plex Sans", system-ui, sans-serif',
    fonts: "family=IBM+Plex+Sans:wght@400;500;600;700",
  },
  index: {
    name: "Индекс",
    C: { ink: "#0A0A0A", paper: "#F0F0F0", surface: "#FFFFFF", violet: "#0B3D91", violetDk: "#082C6B", acid: "#CFE0FF", peach: "#C8321E", danger: "#B3261E",
      tints: ["#F2F2F2", "#EDEFF3", "#F5F3EE", "#EEF1EE", "#F1EEF3", "#EFEFEF"] },
    radius: { pill: 0, card: 0, block: 0, frame: 0, well: 0 },
    head: { fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontWeight: 700, letterSpacing: "-0.01em", textTransform: "uppercase" },
    body: '"JetBrains Mono", ui-monospace, monospace',
    fonts: "family=JetBrains+Mono:wght@400;600;700",
  },
  price: {
    name: "Ценник",
    C: { ink: "#141414", paper: "#EFEDE6", surface: "#FFFFFF", violet: "#D82E29", violetDk: "#A9201C", acid: "#FFD83A", peach: "#FF8A00", danger: "#B3261E",
      tints: ["#FFF4C2", "#FFE3DC", "#E8F3E1", "#F3EFE3", "#E3ECF7", "#F7E6EE"] },
    radius: { pill: 6, card: 6, block: 6, frame: 10, well: 4 },
    head: { fontFamily: '"Unbounded", "Onest", sans-serif', fontWeight: 700, letterSpacing: "-0.02em" },
    body: '"Onest", system-ui, sans-serif',
    fonts: "family=Unbounded:wght@600;700&family=Onest:wght@400;500;600;700",
  },
};
