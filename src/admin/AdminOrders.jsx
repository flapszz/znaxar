import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { C, HEAD, INK, RADIUS, STATUS_VARIANT, inputStyle } from "../constants/theme";
import { STATUSES } from "../data/orders";
import { money } from "../utils/format";

const PAGE_SIZE = 10;

// Главное действие по заявке — следующий шаг; любой другой статус (в том числе отмена) — в выпадающем списке.
const NEXT_STEP = {
  новая: ["подтверждена", "Подтвердить заявку"],
  подтверждена: ["собрана", "Отметить собранной"],
  собрана: ["отправлена", "Отметить отправленной"],
  отправлена: ["выдана", "Отметить выданной"],
};
const phoneHref = (phone) => `tel:+${phone.replace(/\D/g, "").replace(/^8/, "7")}`;

export function AdminOrders({ orders, refreshOrders, bySku, notify }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("все");
  const [page, setPage] = useState(1);

  const move = async (id, status) => {
    if (status === "отменена" && !window.confirm(`Отменить заявку № ${id}? Если остаток уже был списан, он вернётся на склад.`)) return;
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (res?.ok) {
      notify?.(
        status === "отменена"
          ? `Заявка № ${id} отменена. Остаток на сайте пересчитан.`
          : status === "новая"
            ? `Заявка № ${id} снова новая. Остаток на сайте пересчитан.`
            : status === "выдана"
              ? `Заявка № ${id} выдана. Закрыта.`
              : `Заявка № ${id}: ${status}. Остаток на сайте списан.`
      );
    } else {
      notify?.("Не удалось сменить статус. Попробуйте ещё раз.");
    }
    refreshOrders();
  };

  const removeOrder = async (id) => {
    if (!window.confirm(`Удалить заявку № ${id}? Это действие необратимо.`)) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE", credentials: "same-origin" }).catch(() => {});
    refreshOrders();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => statusFilter === "все" || o.status === statusFilter)
      .filter((o) => !q || `${o.id} ${o.name} ${o.phone}`.toLowerCase().includes(q));
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const updateStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const newCount = orders.filter((o) => o.status === "новая").length;

  return (
    <div>
      <p className="mb-4" style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
        {orders.length === 0
          ? "Заявок пока нет."
          : newCount > 0
            ? `Новых заявок: ${newCount}. Позвоните им в первую очередь — телефон в карточке нажимается.`
            : "Новых заявок нет — все обработаны."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto flex-nowrap pb-1">
          {["все", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => updateStatusFilter(s)}
              className="px-3 py-1.5 transition-colors shrink-0"
              style={{
                borderRadius: RADIUS.pill,
                fontSize: 12,
                background: statusFilter === s ? C.ink : "transparent",
                color: statusFilter === s ? C.surface : INK[60],
                border: `1.5px solid ${statusFilter === s ? C.ink : INK[18]}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder="Поиск по номеру, имени, телефону"
          className="sm:ml-auto w-full sm:w-64 px-4 py-2.5"
          style={{ ...inputStyle, fontSize: 13 }}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center" style={{ color: INK[60], fontSize: 13 }}>
          {orders.length === 0
            ? "Когда покупатель оформит заявку, она появится здесь, а число новых — в названии вкладки браузера."
            : "Ничего не найдено. Попробуйте другой статус или слово."}
        </p>
      ) : (
        <div className="grid gap-3">
          {paged.map((o) => {
            // Цена берётся из самой заявки (на момент заказа); для старых заявок без неё — текущая.
            const priceOf = (i) => i.price ?? bySku[i.sku]?.price ?? 0;
            const total = o.items.reduce((s, i) => s + i.qty * priceOf(i), 0);
            return (
              <div
                key={o.id}
                className="p-4"
                style={{ background: C.card, borderRadius: RADIUS.card, border: `1.5px solid ${INK[12]}` }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ ...HEAD, fontSize: 16 }}>№ {o.id}</span>
                      <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                      <span style={{ fontSize: 11, color: INK[60] }}>{o.createdAt}</span>
                    </div>
                    <div className="mt-1" style={{ fontSize: 14 }}>
                      {o.name} ·{" "}
                      <a href={phoneHref(o.phone)} style={{ color: C.violet, fontWeight: 600 }}>
                        {o.phone}
                      </a>
                    </div>
                    <div style={{ fontSize: 13, color: INK[60] }}>
                      {o.city} · {o.pickup}
                    </div>
                    {o.comment && (
                      <div className="mt-1" style={{ fontSize: 13, color: INK[60] }}>
                        «{o.comment}»
                      </div>
                    )}
                    {o.stockDeducted && (
                      <div className="mt-1.5" style={{ fontSize: 12, color: C.violet, fontWeight: 600 }}>
                        Остаток на сайте списан
                      </div>
                    )}
                    <div className="mt-1.5" style={{ fontSize: 12, color: INK[45] }}>
                      Согласие на ПДн: {o.consentGiven ? `есть, ${o.consentAt} (${o.consentVersion})` : "нет"}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div style={{ ...HEAD, fontSize: 18, whiteSpace: "nowrap" }}>{money(total)}</div>
                    <div style={{ fontSize: 12, color: INK[60] }}>оплата при получении</div>
                  </div>
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${INK[12]}` }}>
                  {o.items.map((i) => (
                    <div key={i.sku} className="flex justify-between" style={{ fontSize: 12 }}>
                      <span>
                        {i.sku} · {i.title || bySku[i.sku]?.title || "товар удалён"}
                      </span>
                      <span>
                        {i.qty} × {money(priceOf(i))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a
                    href={phoneHref(o.phone)}
                    className="inline-flex items-center justify-center px-4 py-2.5"
                    style={{ borderRadius: RADIUS.pill, border: `1.5px solid ${C.violet}`, color: C.violet, fontSize: 14, fontWeight: 600 }}
                  >
                    Позвонить
                  </a>
                  {NEXT_STEP[o.status] && (
                    <button
                      onClick={() => move(o.id, NEXT_STEP[o.status][0])}
                      className="px-4 py-2.5"
                      style={{ borderRadius: RADIUS.pill, background: C.violet, color: C.surface, fontSize: 14, fontWeight: 600 }}
                    >
                      {NEXT_STEP[o.status][1]}
                    </button>
                  )}
                  <label className="flex items-center gap-2" style={{ fontSize: 13, color: INK[72] }}>
                    <span className="sr-only sm:not-sr-only">Статус:</span>
                    <select
                      value={o.status}
                      onChange={(e) => move(o.id, e.target.value)}
                      aria-label="Изменить статус заявки"
                      className="px-3 py-2"
                      style={{ borderRadius: RADIUS.pill, border: `1.5px solid ${INK[18]}`, background: C.surface, fontSize: 14, color: C.ink }}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  {/* INTEGRATION: кнопка создания накладной в СДЭК */}
                  <span style={{ fontSize: 12, color: INK[60] }}>Оформить в СДЭК — позже</span>
                  <button onClick={() => removeOrder(o.id)} style={{ fontSize: 13, color: C.danger }}>
                    Удалить заявку
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={pageSafe} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
