import { useEffect, useState } from "react";
import { C, INK, RADIUS } from "../constants/theme";
import { AdminBrands } from "./AdminBrands";
import { AdminCategories } from "./AdminCategories";
import { AdminCollections } from "./AdminCollections";
import { AdminOrders } from "./AdminOrders";
import { AdminProducts } from "./AdminProducts";

export function Admin({ products, bySku, refreshProducts }) {
  const [tab, setTab] = useState("products");
  const [orders, setOrders] = useState(null); // null = ещё грузится

  const refreshOrders = () =>
    fetch("/api/orders", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]));

  useEffect(() => {
    refreshOrders();
  }, []);

  const newCount = (orders || []).filter((o) => o.status === "новая").length;

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <div className="flex flex-wrap gap-1.5 mb-6">
        {[
          ["products", `Товары (${products.length})`],
          ["categories", "Категории"],
          ["brands", "Бренды"],
          ["collections", "Подборки"],
          ["orders", `Заявки (${newCount} новых)`],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="px-3.5 py-1.5 transition-colors"
            style={{
              borderRadius: RADIUS.pill,
              fontSize: 12,
              background: tab === k ? C.ink : "transparent",
              color: tab === k ? C.surface : INK[60],
              border: `1.5px solid ${tab === k ? C.ink : INK[18]}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "products" ? (
        <AdminProducts products={products} refreshProducts={refreshProducts} />
      ) : tab === "categories" ? (
        <AdminCategories />
      ) : tab === "brands" ? (
        <AdminBrands />
      ) : tab === "collections" ? (
        <AdminCollections products={products} />
      ) : orders === null ? (
        <p style={{ fontSize: 13, color: INK[60] }}>Загружаем заявки…</p>
      ) : (
        <AdminOrders orders={orders} refreshOrders={refreshOrders} bySku={bySku} />
      )}
    </div>
  );
}
