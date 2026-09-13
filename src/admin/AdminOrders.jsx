import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { C, HEAD, INK, RADIUS, STATUS_VARIANT, inputStyle } from "../constants/theme";
import { STATUSES } from "../data/orders";
import { money } from "../utils/format";

const PAGE_SIZE = 6;

export function AdminOrders({ orders, refreshOrders, bySku }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("все");
  const [page, setPage] = useState(1);

  const move = async (id, status) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
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

  return (
    <div>
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
          Ничего не найдено.
        </p>
      ) : (
        <div className="grid gap-3">
          {paged.map((o) => {
            const total = o.items.reduce((s, i) => s + i.qty * (bySku[i.sku]?.price || 0), 0);
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
                      {o.name} · {o.phone}
                    </div>
                    <div style={{ fontSize: 13, color: INK[60] }}>
                      {o.city} · {o.pickup}
                    </div>
                    {o.comment && (
                      <div className="mt-1" style={{ fontSize: 13, color: INK[60] }}>
                        «{o.comment}»
                      </div>
                    )}
                    <div className="mt-1.5" style={{ fontSize: 11, color: INK[45] }}>
                      Согласие на ПДн: {o.consentGiven ? `есть, ${o.consentAt} (${o.consentVersion})` : "нет"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ ...HEAD, fontSize: 18, whiteSpace: "nowrap" }}>{money(total)}</div>
                    <div style={{ fontSize: 11, color: INK[60] }}>оплата при получении</div>
                  </div>
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${INK[12]}` }}>
                  {o.items.map((i) => (
                    <div key={i.sku} className="flex justify-between" style={{ fontSize: 12 }}>
                      <span>
                        {i.sku} · {bySku[i.sku]?.title || "—"}
                      </span>
                      <span>× {i.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span style={{ fontSize: 10, color: INK[60], textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Статус
                  </span>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => move(o.id, s)}
                      className="px-2.5 py-1 transition-colors"
                      style={{
                        borderRadius: RADIUS.pill,
                        fontSize: 11,
                        background: o.status === s ? C.violet : "transparent",
                        color: o.status === s ? C.surface : INK[60],
                        border: `1.5px solid ${o.status === s ? C.violet : INK[18]}`,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                  {/* INTEGRATION: кнопка создания накладной в СДЭК */}
                  <span className="ml-auto" style={{ fontSize: 11, color: INK[45] }}>
                    Оформить в СДЭК — позже
                  </span>
                  <button onClick={() => removeOrder(o.id)} style={{ fontSize: 11, color: C.danger }}>
                    Удалить данные
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
