import { useEffect, useRef, useState } from "react";
import { Activity, Clock, Heart, Search, Truck, Wallet } from "lucide-react";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Btn";
import { ContactLine } from "../components/ContactLine";
import { ProductPhoto } from "../components/ProductPhoto";
import { Plaque } from "../components/Plaque";
import { C, DIVIDER, HEAD, INK, OVERLINE, RADIUS, SHADOW_FRAME } from "../constants/theme";
import { SELLER } from "../data/seller";
import { STOCK_LABEL, money, stockState } from "../utils/format";
import { useFavorites } from "../utils/useFavorites";
import { setProductJsonLd, setSeo } from "../utils/seo";
import { Checkout } from "./Checkout";
import { ProductDetail } from "./ProductDetail";

const SORTS = ["популярные", "дешевле", "дороже"];

// Две готовые вариации ширины страницы — переключить одной строкой, если
// понадобится: FRAME_WIDTH = "full" тянет интерфейс на весь экран без полей
// по бокам (без «страницы на листе»), "boxed" — текущий вариант с рамкой,
// тенью и потолком в 1600px, как в макете Клод-дизайна.
const FRAME_WIDTH = "boxed"; // "boxed" | "full"
const FRAME_WIDTH_CLASS = FRAME_WIDTH === "full" ? "w-full" : "max-w-[1600px] mx-auto";
const FRAME_CLASS = `${FRAME_WIDTH_CLASS} ${FRAME_WIDTH === "full" ? "px-3 py-3" : "px-4 py-6"}`;

// У товара и заявки настоящие адреса (/product/SKU, /checkout) — чтобы можно
// было поделиться ссылкой на товар и чтобы его вообще было что индексировать.
function screenFromPath(pathname) {
  const productMatch = /^\/product\/([^/]+)$/.exec(pathname);
  if (productMatch) return { screen: "product", sku: decodeURIComponent(productMatch[1]) };
  if (pathname === "/checkout") return { screen: "checkout", sku: null };
  return { screen: "catalog", sku: null };
}

// Подзаголовок карточки — только то, чего нет в названии (например, «60 таб.»),
// иначе название на карточке повторяется дважды.
function packSize(p) {
  const name = p.stockName || "";
  if (p.title && name.toLowerCase().startsWith(p.title.toLowerCase())) {
    const rest = name.slice(p.title.length).replace(/^[\s,·-]+/, "").trim();
    return rest || "";
  }
  return name;
}

export function Shop({ products, bySku, cart, addToCart, setQty, submitOrder, cookieBannerVisible }) {
  const [cat, setCat] = useState("Все");
  const [brand, setBrand] = useState("Все");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("популярные");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();
  const [screen, setScreen] = useState(() => screenFromPath(window.location.pathname).screen); // catalog | product | checkout | done
  const [openSku, setOpenSku] = useState(() => screenFromPath(window.location.pathname).sku);
  const [doneId, setDoneId] = useState(null);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
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
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : []))
      .then(setBrands)
      .catch(() => setBrands([]));
  }, []);

  // Кнопки «назад/вперёд» браузера должны переключать экран, а не просто
  // менять адрес в строке без последствий.
  useEffect(() => {
    const onPopState = () => {
      const next = screenFromPath(window.location.pathname);
      setScreen(next.screen);
      setOpenSku(next.sku);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Заголовок вкладки, описание и микроразметка товара — гуглу этого хватает
  // (он рендерит JS), превью в мессенджерах без SSR так не работает.
  useEffect(() => {
    const p = screen === "product" ? bySku[openSku] : null;
    if (p) {
      setSeo({
        title: p.title,
        description: `${p.title}. ${p.stockName || ""} ${p.description}`.trim(),
        path: `/product/${encodeURIComponent(p.sku)}`,
      });
      setProductJsonLd(p);
    } else {
      setSeo({ path: "/" });
      setProductJsonLd(null);
    }
  }, [screen, openSku, bySku]);

  const activeCollection = cat.startsWith("col:")
    ? collections.find((col) => `col:${col.id}` === cat)
    : null;

  const base = activeCollection
    ? activeCollection.skus.map((sku) => bySku[sku]).filter((p) => p && p.published && p.hasStock)
    : products.filter((p) => p.published && p.hasStock).filter((p) => cat === "Все" || p.category === cat);

  const q = query.trim().toLowerCase();
  const visible = base
    .filter((p) => brand === "Все" || p.brand === brand)
    .filter((p) => !showFavorites || favorites.includes(p.sku))
    .filter((p) => (p.title + p.description).toLowerCase().includes(q))
    .filter((p) => !inStockOnly || p.stock > 0)
    .sort((a, b) => (sort === "дешевле" ? a.price - b.price : sort === "дороже" ? b.price - a.price : 0));

  const minPrice = Math.min(...products.filter((p) => p.published && p.stock > 0).map((p) => p.price));
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.qty * (bySku[i.sku]?.price || 0), 0);

  const openProduct = (sku, replace) => {
    setOpenSku(sku);
    setScreen("product");
    window.scrollTo({ top: 0 });
    const url = `/product/${encodeURIComponent(sku)}`;
    if (replace) window.history.replaceState({}, "", url);
    else window.history.pushState({}, "", url);
  };
  const goCheckout = () => {
    setScreen("checkout");
    window.scrollTo({ top: 0 });
    window.history.pushState({}, "", "/checkout");
  };
  const backToCatalog = () => {
    setScreen("catalog");
    window.scrollTo({ top: 0 });
    window.history.pushState({}, "", "/");
  };
  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={FRAME_CLASS}>
      <div
        className="flex flex-col"
        style={{ borderRadius: RADIUS.frame, overflow: "hidden", boxShadow: SHADOW_FRAME, background: C.surface }}
      >
        {screen === "catalog" && (
          <div className="sm:hidden p-4" style={{ background: C.violet, color: C.surface }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={20} color={C.acid} strokeWidth={2.25} />
              <span style={{ ...HEAD, fontSize: 18 }}>Знахарь</span>
              <ContactLine className="ml-auto" />
            </div>
            <label
              className="flex items-center gap-2 px-3.5 py-2 mb-3"
              style={{ borderRadius: RADIUS.pill, background: C.violetDk }}
            >
              <Search size={15} color="rgba(255,255,255,.7)" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Искать товары…"
                className="flex-1 bg-transparent outline-none ph-light"
                style={{ color: C.surface, fontSize: 13 }}
              />
            </label>
            <div className="flex items-center gap-2 overflow-x-auto flex-nowrap pb-1" style={{ scrollbarWidth: "none" }}>
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className="px-4 py-2.5 shrink-0 flex items-center gap-1.5"
                style={{
                  borderRadius: RADIUS.pill,
                  background: showFavorites ? C.acid : C.violetDk,
                  color: showFavorites ? C.ink : C.surface,
                  fontSize: 12,
                  fontWeight: showFavorites ? 600 : 400,
                }}
              >
                <Heart size={13} fill={showFavorites ? C.ink : "none"} /> Избранное
              </button>
              {["Все", ...categories.map((c) => c.name)].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className="px-4 py-2.5 shrink-0"
                  style={{
                    borderRadius: RADIUS.pill,
                    background: cat === c ? C.acid : C.violetDk,
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
              <Search size={15} color="rgba(251,248,243,.62)" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Искать товары…"
                className="flex-1 bg-transparent outline-none ph-light"
                style={{ color: C.surface, fontSize: 13 }}
              />
            </label>

            <button
              onClick={() => setShowFavorites((v) => !v)}
              className="flex items-center gap-2 px-3.5 py-2 text-left transition-colors"
              style={{
                borderRadius: RADIUS.pill,
                background: showFavorites ? C.acid : "rgba(255,255,255,.08)",
                color: showFavorites ? C.ink : "#FBF8F3",
                fontSize: 13,
                fontWeight: showFavorites ? 600 : 400,
              }}
            >
              <Heart size={15} fill={showFavorites ? C.ink : "none"} />
              Избранное {favorites.length > 0 ? `(${favorites.length})` : ""}
            </button>

            <div>
              <div style={{ ...OVERLINE, color: "rgba(251,248,243,.62)" }}>Категории</div>
              <div className="mt-2 flex flex-col gap-1">
                {["Все", ...categories.map((c) => c.name)].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className="flex items-center justify-between px-3 py-1.5 text-left transition-colors"
                    style={{
                      borderRadius: RADIUS.pill,
                      background: cat === c ? C.acid : "transparent",
                      color: cat === c ? C.ink : "#FBF8F3",
                      fontSize: 13,
                      fontWeight: cat === c ? 600 : 400,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {brands.length > 0 && (
              <div>
                <div style={{ ...OVERLINE, color: "rgba(251,248,243,.62)" }}>Бренд</div>
                <div className="mt-2 flex flex-col gap-1">
                  {["Все", ...brands.map((b) => b.name)].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBrand(b)}
                      className="flex items-center justify-between px-3 py-1.5 text-left transition-colors"
                      style={{
                        borderRadius: RADIUS.pill,
                        background: brand === b ? "rgba(251,248,243,.16)" : "transparent",
                        color: C.surface,
                        fontSize: 13,
                        fontWeight: brand === b ? 600 : 400,
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {collections.length > 0 && (
              <div>
                <div style={{ ...OVERLINE, color: "rgba(251,248,243,.62)" }}>Подборки</div>
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
              <ContactLine color={C.surface} className="mb-3" />
              <Plaque compact dark />
              <div className="mt-2 flex flex-col gap-1">
                <a href="/privacy" target="_blank" rel="noopener" className="underline" style={{ fontSize: 12, color: "rgba(251,248,243,.7)" }}>
                  Политика конфиденциальности
                </a>
                <a href="/terms" target="_blank" rel="noopener" className="underline" style={{ fontSize: 12, color: "rgba(251,248,243,.7)" }}>
                  Оплата, доставка и возврат
                </a>
              </div>
            </div>
          </aside>
        )}

        <div className={`p-5 sm:p-8 ${count > 0 ? "pb-28" : ""}`} style={{ flex: "9999 1 560px", minWidth: 0 }}>
          {screen !== "catalog" && (
            <div className="flex items-center justify-between gap-3 mb-6 pb-4" style={{ borderBottom: `1px solid ${INK[12]}` }}>
              <button onClick={backToCatalog} className="flex items-center gap-2" aria-label="Знахарь — на главную">
                <Activity size={20} color={C.violet} strokeWidth={2.25} />
                <span style={{ ...HEAD, fontSize: 19, color: C.ink }}>Знахарь</span>
              </button>
              {count > 0 && screen !== "checkout" && (
                <button
                  onClick={goCheckout}
                  className="hidden sm:flex px-4 py-2 items-center gap-2"
                  style={{ borderRadius: RADIUS.pill, background: C.ink, color: C.surface, fontSize: 13, fontWeight: 600 }}
                >
                  Корзина · {count} · {money(total)}
                </button>
              )}
            </div>
          )}

          {screen === "product" && openSku && (bySku[openSku] ? (
            <ProductDetail
              p={bySku[openSku]}
              related={products.filter((p) => p.sku !== openSku && p.published && p.hasStock).slice(0, 4)}
              onOpen={openProduct}
              onAdd={() => addToCart(openSku)}
              qtyInCart={cart.find((i) => i.sku === openSku)?.qty || 0}
              onSetQty={(q) => setQty(openSku, q)}
              onCheckout={goCheckout}
              onBack={backToCatalog}
              isFavorite={favorites.includes(openSku)}
              onToggleFavorite={() => toggleFavorite(openSku)}
            />
          ) : (
            <div>
              <h1 style={{ ...HEAD, fontSize: 22, color: C.ink }}>Такого товара не нашлось</h1>
              <p className="mt-2" style={{ fontSize: 14, color: INK[60] }}>
                Возможно, он снят с публикации или ссылка устарела.
              </p>
              <button onClick={() => backToCatalog()} className="mt-4 underline" style={{ fontSize: 13, color: INK[60] }}>
                ← Ко всем товарам
              </button>
            </div>
          ))}

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
              <section className="flex items-center justify-between gap-8">
                <div className="flex-1 min-w-0">
                  <h1 style={{ ...HEAD, fontSize: "clamp(30px,5vw,50px)", lineHeight: 1.08, color: C.ink }}>
                    БАДы со склада
                    <br />
                    по низким ценам
                  </h1>
                  <p className="mt-3 max-w-xl" style={{ fontSize: 15, lineHeight: 1.55, color: INK[72] }}>
                    {Number.isFinite(minPrice) && (
                      <>
                        Цены от <b style={{ color: C.ink }}>{money(minPrice)}</b>.{" "}
                      </>
                    )}
                    Оставьте заявку — перезвоним, подтвердим наличие и отправим в ваш пункт выдачи. Оплата при получении.
                  </p>

                  <form
                    className="hidden sm:flex items-center gap-2 mt-6 pl-4 pr-1.5 py-1.5 max-w-xl"
                    style={{ borderRadius: RADIUS.pill, background: C.card, border: `1.5px solid ${C.ink}` }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      scrollToGrid();
                    }}
                  >
                    <Search size={18} color={INK[72]} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Что ищете? Например, магний или сон"
                      aria-label="Поиск по каталогу"
                      className="flex-1 bg-transparent outline-none py-2"
                      style={{ fontSize: 15, color: C.ink }}
                    />
                    <Btn variant="acid" type="submit">
                      Найти
                    </Btn>
                  </form>

                  <div className="hidden sm:flex flex-wrap gap-2 mt-3">
                    {categories.slice(0, 4).map((c) => (
                      <button
                        key={c.id ?? c.name}
                        onClick={() => {
                          setCat(c.name);
                          scrollToGrid();
                        }}
                        className="px-3.5 py-1.5"
                        style={{ borderRadius: RADIUS.pill, border: `1.5px solid ${INK[18]}`, fontSize: 13, color: C.ink }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1.5" style={{ fontSize: 13, color: INK[72] }}>
                    <span className="flex items-center gap-1.5">
                      <Clock size={15} /> Перезвоним за час
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Wallet size={15} /> Оплата при получении
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Truck size={15} /> Доставка СДЭК
                    </span>
                  </div>
                </div>
                <img
                  src="/img/hero-herbs.webp"
                  alt=""
                  aria-hidden="true"
                  width="215"
                  height="320"
                  className="hidden md:block shrink-0"
                  style={{ width: 215, height: "auto" }}
                />
              </section>

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
                      className="px-3.5 py-2 transition-colors"
                      style={{
                        borderRadius: RADIUS.pill,
                        fontSize: 13,
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
                {brands.length > 0 && (
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    aria-label="Бренд"
                    className="sm:hidden px-3 py-2"
                    style={{ borderRadius: RADIUS.pill, border: `1.5px solid ${INK[18]}`, background: C.surface, fontSize: 13, color: C.ink }}
                  >
                    <option value="Все">Все бренды</option>
                    {brands.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
                <label className="flex items-center gap-2 ml-auto" style={{ fontSize: 13, color: C.ink }}>
                  <input type="checkbox" className="w-5 h-5" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                  только в наличии
                </label>
              </div>

              {visible.length === 0 ? (
                <div className="py-16 text-center" style={{ color: INK[60] }}>
                  Ничего не нашлось. Попробуйте другую категорию.
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:gap-5 product-grid">
                  {visible.map((p) => {
                    const state = stockState(p.stock);
                    const inCart = cart.find((i) => i.sku === p.sku);
                    return (
                      <article
                        key={p.sku}
                        className="card-elevated p-4 flex flex-col"
                        style={{ borderRadius: RADIUS.card, background: C.card, border: `1.5px solid ${INK[12]}` }}
                      >
                        <div className="relative">
                          <button onClick={() => openProduct(p.sku)} className="text-left w-full">
                            <ProductPhoto sku={p.sku} imageUrl={p.thumbUrl || p.imageUrl} alt={p.title} badge={p.badge} />
                            <h3 className="mt-3" style={{ ...HEAD, fontSize: 16, color: C.ink }}>
                              {p.title}
                            </h3>
                          </button>
                          <button
                            onClick={() => toggleFavorite(p.sku)}
                            className="absolute top-2 right-2 flex items-center justify-center"
                            style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,.9)" }}
                            aria-label={favorites.includes(p.sku) ? "Убрать из избранного" : "В избранное"}
                          >
                            <Heart
                              size={16}
                              color={favorites.includes(p.sku) ? C.danger : C.ink}
                              fill={favorites.includes(p.sku) ? C.danger : "none"}
                            />
                          </button>
                        </div>
                        <p className="mt-1 flex-1" style={{ fontSize: 13, color: INK[60] }}>
                          {packSize(p)}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                          <span style={{ ...HEAD, fontSize: 26, whiteSpace: "nowrap" }}>{money(p.price)}</span>
                          <Badge variant={state === "out" ? "danger" : state === "low" ? "acid" : "neutral"}>
                            {STOCK_LABEL[state]}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          {inCart ? (
                            <div
                              className="flex items-center justify-between"
                              style={{ borderRadius: RADIUS.pill, background: C.ink, padding: "6px 6px 6px 14px" }}
                            >
                              <span style={{ color: C.surface, fontSize: 13, fontWeight: 600 }}>
                                {inCart.qty} шт<span className="hidden sm:inline"> в корзине</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setQty(p.sku, inCart.qty - 1)}
                                  className="flex items-center justify-center"
                                  style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,.15)", color: C.surface }}
                                  aria-label="Уменьшить количество"
                                >
                                  −
                                </button>
                                <button
                                  onClick={() => setQty(p.sku, Math.min(inCart.qty + 1, p.stock))}
                                  disabled={inCart.qty >= p.stock}
                                  className="flex items-center justify-center"
                                  style={{ width: 32, height: 32, borderRadius: 999, background: C.acid, color: C.ink, opacity: inCart.qty >= p.stock ? 0.4 : 1 }}
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
                  <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.02em" }}>
                    БАД. Не является лекарственным средством.
                  </p>
                  <p className="mt-1" style={{ fontSize: 14, fontWeight: 300, color: "#FBF8F3" }}>
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
                  <a href="/about" className="underline" style={{ color: INK[72] }}>
                    О нас
                  </a>
                  <a href="/articles" className="underline" style={{ color: INK[72] }}>
                    Статьи
                  </a>
                  <a href="/news" className="underline" style={{ color: INK[72] }}>
                    Новости
                  </a>
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

                <p className="mt-4" style={{ fontSize: 12, color: INK[45] }}>
                  © {new Date().getFullYear()} Знахарь
                </p>
              </footer>
            </>
          )}
        </div>
        </div>
      </div>

      {(screen === "catalog" || screen === "product") && count > 0 && (
        <div
          className={`fixed left-4 right-4 ${FRAME_WIDTH_CLASS} px-5 py-3.5 flex items-center justify-between transition-all`}
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
