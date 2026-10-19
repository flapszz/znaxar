import { Asterisk } from "lucide-react";
import { C } from "../constants/theme";

const ITEMS = ["Оплата при получении", "Перезвоним за час", "Доставка СДЭК", "СГР на каждый товар", "Цены от склада"];

// Бегущая строка с преимуществами — только для направления «Индекс».
export function Ticker() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="mt-6 overflow-hidden" style={{ borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}` }} aria-hidden="true">
      <div className="ticker-track flex w-max items-center gap-6 py-3" style={{ fontSize: 12, textTransform: "uppercase" }}>
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center gap-6 shrink-0">
            {t}
            <Asterisk size={14} />
          </span>
        ))}
      </div>
    </div>
  );
}
