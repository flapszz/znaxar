import { useEffect, useState } from "react";
import { C, INK, RADIUS } from "../constants/theme";
import { AdminBrands } from "./AdminBrands";
import { AdminCategories } from "./AdminCategories";
import { AdminCollections } from "./AdminCollections";
import { AdminOrders } from "./AdminOrders";
import { AdminProducts } from "./AdminProducts";
import { AdminPublications } from "./AdminPublications";
import { Toast } from "./Toast";

export function Admin({ products, bySku, refreshProducts }) {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState(null); // null = ещё грузится
  const [toast, setToast] = useState("");
  const notify = (message) => setToast(message);

  const refreshOrders = () =>
    fetch("/api/orders", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]));

  useEffect(() => {
    refreshOrders();
  }, []);

  const newCount = (orders || []).filter((o) => o.status === "новая").length;

  // Число новых заявок в названии вкладки — видно, даже если админка открыта в фоне.
  useEffect(() => {
    const before = document.title;
    document.title = newCount > 0 ? `(${newCount}) Заявки · Знахарь` : "Админка · Знахарь";
    return () => {
      document.title = before;
    };
  }, [newCount]);

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <div className="flex gap-1.5 mb-6 overflow-x-auto sm:flex-wrap sm:overflow-visible pb-1" style={{ scrollbarWidth: "none" }}>
        {[
          ["orders", newCount > 0 ? `Заявки · ${newCount} новых` : "Заявки"],
          ["products", `Товары (${products.length})`],
          ["categories", "Категории"],
          ["brands", "Бренды"],
          ["collections", "Подборки"],
          ["articles", "Статьи"],
          ["news", "Новости"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="px-3.5 py-2 transition-colors shrink-0"
            style={{
              borderRadius: RADIUS.pill,
              fontSize: 13,
              background: tab === k ? C.ink : k === "orders" && newCount > 0 ? C.acid : "transparent",
              color: tab === k ? C.surface : k === "orders" && newCount > 0 ? C.ink : INK[60],
              fontWeight: k === "orders" && newCount > 0 ? 600 : 400,
              border: `1.5px solid ${tab === k ? C.ink : k === "orders" && newCount > 0 ? C.acid : INK[18]}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "products" ? (
        <AdminProducts products={products} refreshProducts={refreshProducts} notify={notify} />
      ) : tab === "categories" ? (
        <AdminCategories />
      ) : tab === "brands" ? (
        <AdminBrands />
      ) : tab === "collections" ? (
        <AdminCollections products={products} />
      ) : tab === "articles" ? (
        <AdminPublications type="article" singular="Новая статья" />
      ) : tab === "news" ? (
        <AdminPublications type="news" singular="Новая новость" />
      ) : orders === null ? (
        <p style={{ fontSize: 13, color: INK[60] }}>Загружаем заявки…</p>
      ) : (
        <AdminOrders orders={orders} refreshOrders={refreshOrders} bySku={bySku} notify={notify} />
      )}
      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}
