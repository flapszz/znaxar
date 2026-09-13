import { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { Admin } from "./admin/Admin";
import { AdminGate } from "./admin/AdminGate";
import { ConsentContent } from "./components/ConsentContent";
import { CookieBanner } from "./components/CookieBanner";
import { OfferContent } from "./components/OfferContent";
import { PolicyContent } from "./components/PolicyContent";
import { C, HEAD, INK } from "./constants/theme";
import { LegalPage } from "./legal/LegalPage";
import { Shop } from "./shop/Shop";

const LEGAL_ROUTES = {
  "/privacy": { title: "Политика в отношении обработки персональных данных", Content: PolicyContent },
  "/consent": { title: "Согласие на обработку персональных данных", Content: ConsentContent },
  "/terms": { title: "Оплата, доставка и возврат", Content: OfferContent },
};

export default function App() {
  const legalRoute = LEGAL_ROUTES[window.location.pathname];
  const [cookieVisible, setCookieVisible] = useState(false);
  const [mode, setModeState] = useState(() => (window.location.hash === "#admin" ? "admin" : "shop"));
  const setMode = (next) => {
    setModeState(next);
    window.location.hash = next === "admin" ? "admin" : "";
  };

  // Хеш можно поменять и без перезагрузки страницы (например, если вкладка уже открыта
  // на витрине, а в адресную строку дописали #admin) — тогда useState выше не сработает.
  useEffect(() => {
    const onHashChange = () => setModeState(window.location.hash === "#admin" ? "admin" : "shop");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const [products, setProducts] = useState(null); // null = ещё грузится
  const [loadError, setLoadError] = useState("");
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("znaxar-cart")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("znaxar-cart", JSON.stringify(cart));
    } catch {
      // недоступно (приватный режим и т.п.) — просто не сохраняем между обновлениями
    }
  }, [cart]);

  const loadProducts = () =>
    fetch("/api/products")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setProducts(data);
        setLoadError("");
      })
      .catch(() => setLoadError("Не удалось загрузить товары. Проверьте, что запущен API (npm run server)."));

  useEffect(() => {
    loadProducts();
  }, []);

  const bySku = useMemo(
    () => Object.fromEntries((products || []).map((p) => [p.sku, p])),
    [products]
  );

  const addToCart = (sku) =>
    setCart((c) => {
      const hit = c.find((i) => i.sku === sku);
      return hit
        ? c.map((i) => (i.sku === sku ? { ...i, qty: i.qty + 1 } : i))
        : [...c, { sku, qty: 1 }];
    });

  const setQty = (sku, qty) =>
    setCart((c) => (qty <= 0 ? c.filter((i) => i.sku !== sku) : c.map((i) => (i.sku === sku ? { ...i, qty } : i))));

  const submitOrder = async (form) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: cart }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
    }
    const order = await res.json();
    setCart([]);
    return order.id;
  };

  if (legalRoute) {
    const { title, Content } = legalRoute;
    return (
      <LegalPage title={title}>
        <Content />
      </LegalPage>
    );
  }

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}>
      <CookieBanner onVisibleChange={setCookieVisible} />

      {mode === "admin" && (
        <header style={{ borderBottom: `2px solid ${C.ink}`, background: C.surface }}>
          <div className="max-w-5xl mx-auto flex items-center gap-4 px-5 py-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <Activity size={20} color={C.acid} strokeWidth={2.25} />
              <span style={{ ...HEAD, fontSize: 20, color: C.ink }}>Знахарь</span>
            </div>
            <button
              onClick={() => setMode("shop")}
              className="ml-auto px-3.5 py-1.5 rounded-full transition-colors"
              style={{ fontSize: 12, color: INK[60], border: `1.5px solid ${INK[18]}`, borderRadius: 999 }}
            >
              ← Витрина
            </button>
          </div>
        </header>
      )}

      {loadError ? (
        <div className="max-w-5xl mx-auto px-5 py-16" style={{ color: C.danger, fontSize: 13 }}>
          {loadError}
        </div>
      ) : products === null ? (
        <div className="max-w-5xl mx-auto px-5 py-16" style={{ color: INK[60], fontSize: 13 }}>
          Загружаем товары…
        </div>
      ) : mode === "shop" ? (
        <Shop
          products={products}
          bySku={bySku}
          cart={cart}
          addToCart={addToCart}
          setQty={setQty}
          submitOrder={submitOrder}
          cookieBannerVisible={cookieVisible}
        />
      ) : (
        <AdminGate>
          <Admin products={products} bySku={bySku} refreshProducts={loadProducts} />
        </AdminGate>
      )}
    </div>
  );
}
