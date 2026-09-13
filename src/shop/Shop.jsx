import { useEffect, useRef, useState } from "react";
import { Activity, Clock, Search, Truck, Wallet } from "lucide-react";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Btn";
import { ProductPhoto } from "../components/ProductPhoto";
import { Plaque } from "../components/Plaque";
import { TrustBadges } from "../components/TrustBadges";
import { C, DIVIDER, HEAD, INK, OVERLINE, RADIUS, SHADOW_FRAME } from "../constants/theme";
import { SELLER } from "../data/seller";
import { STOCK_LABEL, money, stockState } from "../utils/format";
import { Checkout } from "./Checkout";
import { ProductDetail } from "./ProductDetail";

const SORTS = ["популярные", "дешевле", "дороже"];

export function Shop({ products, bySku, cart, addToCart, setQty, submitOrder, cookieBannerVisible }) {
  const [cat, setCat] = useState("Все");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("популярные");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [screen, setScreen] = useState("catalog"); // catalog | product | checkout | done
  const [openSku, setOpenSku] = useState(null);
  const [doneId, setDoneId] = useState(null);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const gridRef = useRef(null);

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCollections)
      .catch(() => setCollections([]));
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const activeCollection = cat.startsWith("col:")
    ? collections.find((col) => `col:${col.id}` === cat)
    : null;

  const base = activeCollection
    ? activeCollection.skus.map((sku) => bySku[sku]).filter((p) => p && p.published && p.hasStock)
    : products.filter((p) => p.published && p.hasStock).filter((p) => cat === "Все" || p.category === cat);

  const q = query.trim().toLowerCase();
  const visible = base
    .filter((p) => (p.title + p.description).toLowerCase().includes(q))
    .filter((p) => !inStockOnly || p.stock > 0)
    .sort((a, b) => (sort === "дешевле" ? a.price - b.price : sort === "дороже" ? b.price - a.price : 0));

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.qty * (bySku[i.sku]?.price || 0), 0);

  const openProduct = (sku) => {
    setOpenSku(sku);
    setScreen("product");
    window.scrollTo({ top: 0 });
  };
  const goCheckout = () => {
    setScreen("checkout");
    window.scrollTo({ top: 0 });
  };
  const backToCatalog = () => {
    setScreen("catalog");
    window.scrollTo({ top: 0 });
  };
  const scrollToGrid = () => {
    setCat("Все");
    gridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div
        className="flex flex-col"
        style={{ borderRadius: RADIUS.frame, overflow: "hidden", boxShadow: SHADOW_FRAME, background: C.surface }}
      >
        {screen === "catalog" && (
          <div className="sm:hidden p-4" style={{ background: C.violet, color: C.surface }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={20} color={C.acid} strokeWidth={2.25} />
              <span style={{ ...HEAD, fontSize: 18 }}>Знахарь</span>
            </div>
            <label
              className="flex items-center gap-2 px-3.5 py-2 mb-3"
              style={{ borderRadius: RADIUS.pill, background: "rgba(255,255,255,.15)" }}
            >
              <Search size={15} color="rgba(255,255,255,.7)" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Искать товары…"
                className="flex-1 bg-transparent outline-none"
                style={{ color: C.surface, fontSize: 13 }}
              />
            </label>
            <div className="flex items-center gap-2 overflow-x-auto flex-nowrap pb-1" style={{ scrollbarWidth: "none" }}>
              {["Все", ...categories.map((c) => c.name)].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className="px-3.5 py-1.5 shrink-0"
                  style={{
                    borderRadius: RADIUS.pill,
                    background: cat === c ? C.acid : "rgba(255,255,255,.15)",
                    color: cat === c ? C.ink : C.surface,
                    fontSize: 12,
                    fontWeight: cat === c ? 600 : 400,
                  }}
                >
                  {c}
                </button>
              ))}
              {collections.map((col) => {
                const key = `col:${col.id}`;
                const on = cat === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCat(key)}
                    className="px-3.5 py-1.5 shrink-0"
                    style={{
                      borderRadius: RADIUS.pill,
                      background: on ? C.peach : "transparent",
                      color: C.surface,
                      border: `1.5px solid ${C.peach}`,
                      fontSize: 12,
                      fontWeight: on ? 600 : 400,
                    }}
                  >
                    {col.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap flex-1">
        {screen === "catalog" && (
          <aside
            className="hidden sm:flex flex-col gap-6 p-5"
            style={{ flex: "1 1 240px", maxWidth: 260, background: C.ink, color: C.surface }}
          >
            <div className="flex items-center gap-2">
              <Activity size={20} color={C.acid} strokeWidth={2.25} />
              <span style={{ ...HEAD, fontSize: 19 }}>Знахарь</span>
            </div>

            <label
              className="flex items-center gap-2 px-3.5 py-2"
              style={{ borderRadius: RADIUS.pill, background: "rgba(255,255,255,.08)" }}
            >
              <Search size={15} color="rgba(251,248,243,.5)" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Искать товары…"
                className="flex-1 bg-transparent outline-none"
                style={{ color: C.surface, fontSize: 13 }}
              />
            </label>

            <div>
              <div style={{ ...OVERLINE, color: "rgba(251,248,243,.45)" }}>Категории</div>
              <div className="mt-2 flex flex-col gap-1">
                {["Все", ...categories.map((c) => c.name)].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className="flex items-center justify-between px-3 py-1.5 text-left transition-colors"
                    style={{
                      borderRadius: RADIUS.pill,
                      background: cat === c ? C.acid : "transparent",
                      color: cat === c ? C.ink : "rgba(251,248,243,.85)",
                      fontSize: 13,
                      fontWeight: cat === c ? 600 : 400,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {collections.length > 0 && (
              <div>
                <div style={{ ...OVERLINE, color: "rgba(251,248,243,.45)" }}>Подборки</div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {collections.map((col) => {
                    const key = `col:${col.id}`;
                    const on = cat === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setCat(key)}
                        className="px-3 py-1.5 text-left transition-colors"
                        style={{
                          borderRadius: RADIUS.pill,
                          background: on ? C.peach : "transparent",
                          color: on ? C.ink : C.peach,
                          border: `1.5px solid ${C.peach}`,
                          fontSize: 13,
                          fontWeight: on ? 600 : 400,
                        }}
                      >
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-auto pt-4" style={{ borderTop: "1px solid rgba(251,248,243,.15)" }}>
              <Plaque compact dark />
              <div className="mt-2 flex flex-col gap-1">
                <a href="/privacy" target="_blank" rel="noopener" className="underline" style={{ fontSize: 11, color: "rgba(251,248,243,.5)" }}>
                  Политика конфиденциальности
                </a>
                <a href="/terms" target="_blank" rel="noopener" className="underline" style={{ fontSize: 11, color: "rgba(251,248,243,.5)" }}>
                  Оплата, доставка и возврат
                </a>
              </div>
            </div>
          </aside>
        )}

        <div className="p-5 sm:p-8" style={{ flex: "9999 1 560px", minWidth: 0 }}>
          {screen === "product" && openSku && bySku[openSku] && (
            <ProductDetail
              p={bySku[openSku]}
              related={products.filter((p) => p.sku !== openSku && p.published && p.hasStock).slice(0, 4)}
              onOpen={openProduct}
              onAdd={() => {
                addToCart(openSku);
                backToCatalog();
              }}
              onBack={backToCatalog}
            />
          )}

          {screen === "checkout" && (
            <Checkout
              cart={cart}
              bySku={bySku}
              setQty={setQty}
              total={total}
              onBack={backToCatalog}
              onSubmit={async (form) => {
                const id = await submitOrder(form);
                setDoneId(id);
                setScreen("done");
                window.scrollTo({ top: 0 });
              }}
            />
          )}

          {screen === "done" && (
            <div className="flex flex-wrap gap-8 items-center">
              <div style={{ flex: "1 1 320px" }}>
                <div style={{ ...OVERLINE, color: C.violet }}>Готово</div>
                <h1 className="mt-2" style={{ ...HEAD, fontSize: "clamp(28px,5vw,42px)", color: C.ink }}>
                  Заявка № {doneId} принята
                </h1>
                <p className="mt-3 max-w-sm" style={{ fontSize: 15, color: INK[60] }}>
                  Перезвоним в рабочее время, подтвердим наличие и выберем пункт выдачи.
                </p>
                <div className="mt-5">
                  <Btn variant="acid" onClick={backToCatalog}>
                    Вернуться в каталог
                  </Btn>
                </div>
              </div>
              <div className="p-5" style={{ flex: "1 1 260px", background: C.ink, color: C.surface, borderRadius: RADIUS.card }}>
                {["Перезвоним в рабочее время", "Подтвердим наличие и пункт выдачи", "Соберём и передадим в СДЭК", "Пришлём трек-номер"].map(
                  (step, i) => (
                    <div key={step} className="flex items-start gap-3 py-2">
                      <span
                        className="flex items-center justify-center shrink-0"
                        style={{ width: 22, height: 22, borderRadius: 999, background: C.acid, color: C.ink, fontSize: 12, fontWeight: 700 }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 13 }}>{step}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {screen === "catalog" && (
            <>
              <div
                className="p-6 sm:p-8 flex flex-wrap items-center gap-6"
                style={{ borderRadius: RADIUS.card, background: C.violet, color: C.surface }}
              >
                <div style={{ flex: "1 1 320px" }}>
                  <span
                    className="inline-block px-3 py-1 mb-3"
                    style={{ borderRadius: RADIUS.pill, background: "rgba(255,255,255,.15)", fontSize: 11, fontWeight: 600 }}
                  >
                    {products.filter((p) => p.published && p.hasStock).length} позиций на складе
                  </span>
                  <h1 style={{ ...HEAD, fontSize: "clamp(26px,4.5vw,36px)", lineHeight: 1.15 }}>
                    Добавки со склада,
                    <br />
                    без наценки маркетплейса
                  </h1>
                  <p className="mt-3 max-w-md" style={{ fontSize: 14, fontWeight: 300, color: "rgba(251,248,243,.85)" }}>
                    Оставьте заявку — перезвоним, подтвердим наличие и отправим в ваш пункт выдачи. Оплата при получении.
                  </p>
                  <div className="mt-5 flex gap-3 flex-wrap">
                    <Btn variant="acid" onClick={scrollToGrid}>
                      Смотреть каталог
                    </Btn>
                  </div>
                </div>
              </div>

              <div
                className="mt-4 p-4 flex flex-wrap gap-x-6 gap-y-2"
                style={{ borderRadius: RADIUS.block, background: C.peach, color: C.ink }}
              >
                <span className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
                  <Clock size={16} strokeWidth={2} /> Перезвоним за час
                </span>
                <span className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
                  <Wallet size={16} strokeWidth={2} /> Оплата при получении
                </span>
                <span className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
                  <Truck size={16} strokeWidth={2} /> Доставка СДЭК
                </span>
              </div>

              <div ref={gridRef} className="mt-8 flex items-baseline justify-between flex-wrap gap-2">
                <h2 style={{ ...HEAD, fontSize: 20, color: C.ink }}>
                  {cat === "Все" ? "Весь склад" : activeCollection ? activeCollection.name : cat}
                </h2>
                <span style={{ fontSize: 12, color: INK[60] }}>{visible.length} позиций</span>
              </div>
              <div className="mt-3 pt-3 flex flex-wrap items-center gap-4" style={{ borderTop: DIVIDER }}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SORTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className="px-3 py-1.5 transition-colors"
                      style={{
                        borderRadius: RADIUS.pill,
                        fontSize: 12,
                        fontWeight: sort === s ? 600 : 400,
                        background: sort === s ? C.ink : "transparent",
                        color: sort === s ? C.surface : INK[60],
                        border: `1.5px solid ${sort === s ? C.ink : INK[18]}`,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 ml-auto" style={{ fontSize: 13, color: C.ink }}>
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                  только в наличии
                </label>
              </div>

              {visible.length === 0 ? (
                <div className="py-16 text-center" style={{ color: INK[60] }}>
                  Ничего не нашлось. Попробуйте другую категорию.
                </div>
              ) : (
                <div className="mt-5 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  {visible.map((p) => {
                    const state = stockState(p.stock);
                    const inCart = cart.find((i) => i.sku === p.sku);
                    return (
                      <article
                        key={p.sku}
                        className="card-elevated p-4 flex flex-col"
                        style={{ borderRadius: RADIUS.card, background: C.card, border: `1.5px solid ${INK[12]}` }}
                      >
                        <button onClick={() => openProduct(p.sku)} className="text-left">
                          <ProductPhoto sku={p.sku} imageUrl={p.imageUrl} alt={p.title} badge={p.badge} />
                          <h3 className="mt-3" style={{ ...HEAD, fontSize: 16, color: C.ink }}>
                            {p.title}
                          </h3>
                        </button>
                        <p className="mt-1 flex-1" style={{ fontSize: 12.5, color: INK[60] }}>
                          {p.stockName}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                          <span style={{ ...HEAD, fontSize: 26, whiteSpace: "nowrap" }}>{money(p.price)}</span>
                          <Badge variant={state === "out" ? "danger" : state === "low" ? "acid" : "neutral"}>
                            {STOCK_LABEL[state]}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <TrustBadges hasSgr={Boolean(p.sgr)} compact />
                        </div>
                        <div className="mt-3">
                          {inCart ? (
                            <div
                              className="flex items-center justify-between"
                              style={{ borderRadius: RADIUS.pill, background: C.ink, padding: "9px 8px 9px 16px" }}
                            >
                              <span style={{ color: C.surface, fontSize: 13, fontWeight: 600 }}>
                                {inCart.qty} шт в корзине
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setQty(p.sku, inCart.qty - 1)}
                                  className="flex items-center justify-center"
                                  style={{ width: 28, height: 28, borderRadius: 999, background: "rgba(255,255,255,.15)", color: C.surface }}
                                  aria-label="Уменьшить количество"
                                >
                                  −
                                </button>
                                <button
                                  onClick={() => setQty(p.sku, Math.min(inCart.qty + 1, p.stock))}
                                  disabled={inCart.qty >= p.stock}
                                  className="flex items-center justify-center"
                                  style={{ width: 28, height: 28, borderRadius: 999, background: C.acid, color: C.ink, opacity: inCart.qty >= p.stock ? 0.4 : 1 }}
                                  aria-label="Увеличить количество"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Btn variant="acid" full disabled={p.stock === 0} onClick={() => addToCart(p.sku)}>
                              {p.stock === 0 ? "Закончился" : "В корзину"}
                            </Btn>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <footer className="mt-10 pt-6" style={{ borderTop: `1px solid ${INK[12]}` }}>
                {/* Дисклеймер БАД — по ч.1 ст.25 ФЗ «О рекламе» должен занимать заметную долю площади,
                    крупным читаемым шрифтом, не декоративным серым текстом. */}
                <div
                  className="p-5"
                  style={{ borderRadius: RADIUS.block, background: C.ink, color: C.surface }}
                >
                  <p style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    БАД. Не является лекарственным средством.
                  </p>
                  <p className="mt-1" style={{ fontSize: 14, fontWeight: 300, color: "rgba(251,248,243,.85)" }}>
                    Имеются противопоказания. Перед применением необходимо проконсультироваться со специалистом.
                  </p>
                </div>

                <div id="requisites" className="mt-5" style={{ fontSize: 12.5, color: INK[72], lineHeight: 1.7 }}>
                  <div>Продавец: Индивидуальный предприниматель {SELLER.fullName || "— укажите ФИО —"}</div>
                  <div>
                    ОГРНИП {SELLER.ogrnip || "— укажите —"} · ИНН {SELLER.inn || "— укажите —"}
                  </div>
                  <div>
                    Зарегистрирован {SELLER.registrar || "— укажите регистрирующий орган —"}
                    {SELLER.registeredAt ? ` ${SELLER.registeredAt}` : ""}
                  </div>
                  <div>Адрес для обращений, претензий и возврата товара: {SELLER.returnAddress || "— укажите адрес —"}</div>
                  <div>
                    Тел.: {SELLER.phone || "— укажите —"} · E-mail: {SELLER.email || "— укажите —"}
                  </div>
                  <div>Режим работы: {SELLER.hours || "— укажите —"}</div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: 12.5 }}>
                  <a href="/privacy" target="_blank" rel="noopener" className="underline" style={{ color: INK[72] }}>
                    Политика конфиденциальности
                  </a>
                  <a href="/consent" target="_blank" rel="noopener" className="underline" style={{ color: INK[72] }}>
                    Согласие на обработку данных
                  </a>
                  <a href="/terms" target="_blank" rel="noopener" className="underline" style={{ color: INK[72] }}>
                    Оплата, доставка и возврат
                  </a>
                  <a href="#requisites" className="underline" style={{ color: INK[72] }}>
                    Контакты
                  </a>
                </div>

                <p className="mt-4" style={{ fontSize: 11, color: INK[45] }}>
                  © {new Date().getFullYear()} Знахарь
                </p>
              </footer>
            </>
          )}
        </div>
        </div>
      </div>

      {screen === "catalog" && count > 0 && (
        <div
          className="fixed left-4 right-4 max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between transition-all"
          style={{
            bottom: cookieBannerVisible ? 76 : 16,
            background: C.ink,
            color: C.surface,
            borderRadius: RADIUS.pill,
            boxShadow: SHADOW_FRAME,
          }}
        >
          <span style={{ fontSize: 13 }}>
            {count} поз. · {money(total)}
          </span>
          <Btn variant="acid" onClick={goCheckout}>
            Оформить заявку
          </Btn>
        </div>
      )}
    </div>
  );
}
