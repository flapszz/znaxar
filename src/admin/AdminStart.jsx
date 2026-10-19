import { useState } from "react";
import { C, INK, RADIUS } from "../constants/theme";

const KEY = "znaxar-admin-start-hidden";
const readHidden = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

// «Начало работы» для владельца: четыре шага до первого заказа. Каждый шаг сам отмечается
// выполненным по данным магазина; панель можно скрыть, а когда всё сделано — она исчезает.
export function AdminStart({ products, orders, goTo }) {
  const [hidden, setHidden] = useState(readHidden);

  const steps = [
    {
      done: products.length > 0,
      title: "Добавьте товары",
      text: "Загрузите таблицу с ценами или создайте первую позицию вручную.",
      action: ["Открыть товары", "products"],
    },
    {
      done: products.some((p) => p.published),
      title: "Покажите первый товар на сайте",
      text: "Заполните название, категорию и номер СГР, затем включите «Показывать на сайте».",
      action: ["Открыть товары", "products"],
    },
    {
      done: products.some((p) => p.imageUrl),
      title: "Добавьте фото упаковки",
      text: "По желанию: с фото карточка заметнее. Пока его нет, на карточке рисунок.",
      optional: true,
    },
    {
      done: orders.length > 0,
      title: "Дождитесь первой заявки",
      text: "Она появится здесь, во вкладке «Заявки». Число новых видно в названии вкладки браузера.",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (hidden || doneCount === steps.length) return null;

  const hide = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* без хранилища панель просто покажется снова */
    }
    setHidden(true);
  };

  return (
    <section className="mb-6 p-4 sm:p-5" aria-label="Начало работы" style={{ background: C.card, border: `1.5px solid ${INK[18]}`, borderRadius: RADIUS.card }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Начало работы · выполнено {doneCount} из {steps.length}</h2>
          <p className="mt-1" style={{ fontSize: 13, color: INK[72] }}>
            Четыре шага до первого заказа. Остальное можно настроить позже.
          </p>
        </div>
        <button onClick={hide} style={{ fontSize: 13, color: INK[72], textDecoration: "underline", whiteSpace: "nowrap" }}>
          Скрыть
        </button>
      </div>
      <ol className="mt-3 grid gap-2.5">
        {steps.map((s) => (
          <li key={s.title} className="flex items-start gap-3">
            <span aria-hidden="true" style={{ width: 20, fontWeight: 700, color: s.done ? C.ok : INK[45] }}>
              {s.done ? "✓" : "○"}
            </span>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 14, fontWeight: 600, color: s.done ? INK[60] : C.ink, textDecoration: s.done ? "line-through" : "none" }}>
                {s.title}
                {s.optional && !s.done && <span style={{ fontWeight: 400, color: INK[60] }}> (по желанию)</span>}
              </div>
              {!s.done && <div style={{ fontSize: 13, color: INK[72] }}>{s.text}</div>}
            </div>
            {!s.done && s.action && (
              <button
                onClick={() => goTo(s.action[1])}
                className="px-3 py-1.5 shrink-0"
                style={{ borderRadius: RADIUS.pill, border: `1.5px solid ${C.violet}`, color: C.violet, fontSize: 13, fontWeight: 600 }}
              >
                {s.action[0]}
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
