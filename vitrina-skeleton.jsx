import { useState, useMemo } from "react";

/* ---------------------------------------------------------------
   Скелет витрины БАДов + админка.
   Все данные в памяти. Интеграций нет — точки подключения
   помечены комментариями INTEGRATION.
----------------------------------------------------------------*/

const C = {
  paper: "#EDF0EA",
  card: "#FFFFFF",
  ink: "#14261E",
  green: "#1E4D38",
  greenSoft: "#DCE7DF",
  ochre: "#B8862B",
  line: "#C9D2C8",
  muted: "#5D6B62",
  danger: "#8C3A2B",
};

const DISPLAY = {
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  letterSpacing: "-0.02em",
  fontWeight: 700,
};
const MONO = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

const CATEGORIES = ["Витамины", "Минералы", "Омега и жиры", "Сон и стресс", "Красота"];

/* --- «Склад»: эти поля редактировать на сайте нельзя ------------- */
const STOCK = [
  { sku: "BAD-0142", stockName: "Омега-3 1000 мг, 60 капс.", price: 1290, stock: 84 },
  { sku: "BAD-0207", stockName: "Витамин D3 2000 МЕ, 90 капс.", price: 890, stock: 12 },
  { sku: "BAD-0311", stockName: "Магний + B6, 60 таб.", price: 740, stock: 0 },
  { sku: "BAD-0355", stockName: "Цинк пиколинат 25 мг, 60 капс.", price: 620, stock: 41 },
  { sku: "BAD-0418", stockName: "Коллаген морской, 120 г", price: 1980, stock: 7 },
  { sku: "BAD-0490", stockName: "Мелатонин 3 мг, 30 таб.", price: 540, stock: 23 },
];

/* --- Контент витрины: живёт на сайте ----------------------------- */
const CONTENT = {
  "BAD-0142": {
    title: "Омега-3",
    category: "Омега и жиры",
    description:
      "Концентрат рыбьего жира в мягких капсулах. Суточная порция — две капсулы, курс рассчитан на месяц.",
    usage: "По 1 капсуле 2 раза в день во время еды.",
    sgr: "RU.77.99.11.003.E.001234.05.24",
    composition: [
      { n: "ЭПК", v: "330 мг" },
      { n: "ДГК", v: "220 мг" },
      { n: "Витамин E", v: "10 мг" },
    ],
    published: true,
  },
  "BAD-0207": {
    title: "Витамин D3",
    category: "Витамины",
    description: "Холекальциферол на основе МСТ-масла. Дозировка 2000 МЕ в одной капсуле.",
    usage: "По 1 капсуле в день во время еды.",
    sgr: "RU.77.99.11.003.E.004567.02.24",
    composition: [{ n: "Витамин D3", v: "2000 МЕ" }],
    published: true,
  },
  "BAD-0311": {
    title: "Магний + B6",
    category: "Минералы",
    description: "Цитрат магния в связке с пиридоксином. Таблетки без вкусовых добавок.",
    usage: "По 1 таблетке 2 раза в день во время еды.",
    sgr: "RU.77.99.11.003.E.007890.11.23",
    composition: [
      { n: "Магний", v: "200 мг" },
      { n: "Витамин B6", v: "2 мг" },
    ],
    published: true,
  },
  "BAD-0355": { published: false },
  "BAD-0418": {
    title: "Коллаген морской",
    category: "Красота",
    description: "Порошок для растворения в воде. Нейтральный вкус, мерная ложка в банке.",
    usage: "1 мерная ложка на 200 мл воды, 1 раз в день.",
    sgr: "RU.77.99.11.003.E.002233.07.25",
    composition: [
      { n: "Коллаген I типа", v: "10 г" },
      { n: "Витамин C", v: "80 мг" },
    ],
    published: true,
  },
  "BAD-0490": { published: false },
};

const EMPTY_CONTENT = {
  title: "",
  category: "",
  description: "",
  usage: "",
  sgr: "",
  composition: [],
  published: false,
};

const SEED_ORDERS = [
  {
    id: "3120",
    createdAt: "27.08, 14:02",
    name: "Ирина К.",
    phone: "+7 912 000-11-22",
    city: "Екатеринбург",
    pickup: "ПВЗ уточняется",
    comment: "",
    items: [{ sku: "BAD-0142", qty: 2 }],
    status: "новая",
  },
  {
    id: "3119",
    createdAt: "27.08, 09:41",
    name: "Павел М.",
    phone: "+7 903 555-77-01",
    city: "Казань",
    pickup: "ПВЗ уточняется",
    comment: "Позвонить после 18:00",
    items: [
      { sku: "BAD-0207", qty: 1 },
      { sku: "BAD-0418", qty: 1 },
    ],
    status: "подтверждена",
  },
];

const STATUSES = ["новая", "подтверждена", "собрана", "отправлена", "выдана", "отменена"];
const STATUS_TINT = {
  новая: C.ochre,
  подтверждена: C.green,
  собрана: C.green,
  отправлена: C.green,
  выдана: C.muted,
  отменена: C.danger,
};

const TINT = {
  "Витамины": "#E5EBD8",
  "Минералы": "#DDE6EC",
  "Омега и жиры": "#F0E6D2",
  "Сон и стресс": "#E2DEEC",
  "Красота": "#F0DFE2",
  "": "#E8EAE6",
};

const money = (n) => n.toLocaleString("ru-RU") + " ₽";

/* ================================================================ */

function Jar({ sku, category, size = "lg" }) {
  const big = size === "lg";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded ${big ? "h-40" : "h-20"}`}
      style={{ background: TINT[category] || TINT[""] }}
      aria-hidden="true"
    >
      <div
        className={`rounded-t-sm ${big ? "w-12 h-2" : "w-7 h-1.5"}`}
        style={{ background: C.green, opacity: 0.55 }}
      />
      <div
        className={`rounded-sm flex items-end justify-center ${big ? "w-20 h-24 p-2" : "w-12 h-12 p-1"}`}
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <span style={{ ...MONO, color: C.muted, fontSize: big ? 10 : 7 }}>{sku}</span>
      </div>
    </div>
  );
}

function Plaque({ compact }) {
  return (
    <p
      style={{ ...MONO, color: C.muted, fontSize: compact ? 10 : 11, lineHeight: 1.4 }}
      className="uppercase"
    >
      БАД. Не является лекарственным средством
    </p>
  );
}

function Badge({ children, tone = C.muted }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded"
      style={{ ...MONO, fontSize: 10, color: tone, border: `1px solid ${tone}`, opacity: 0.95 }}
    >
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = "solid", disabled, full, type = "button" }) {
  const base = "px-4 py-2 rounded transition-colors";
  const styles =
    variant === "solid"
      ? { background: disabled ? C.line : C.green, color: disabled ? C.muted : "#fff" }
      : { background: "transparent", color: C.green, border: `1px solid ${C.line}` };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${full ? "w-full" : ""} ${disabled ? "cursor-not-allowed" : ""}`}
      style={{ ...styles, ...DISPLAY, fontSize: 13, textTransform: "uppercase" }}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block mb-4">
      <span className="block mb-1" style={{ ...MONO, fontSize: 11, color: C.muted }}>
        {label.toUpperCase()}
      </span>
      {children}
      {hint && (
        <span className="block mt-1" style={{ fontSize: 12, color: C.muted }}>
          {hint}
        </span>
      )}
    </label>
  );
}

const inputStyle = {
  background: C.card,
  border: `1px solid ${C.line}`,
  color: C.ink,
};

/* ================================================================ */

export default function App() {
  const [mode, setMode] = useState("shop");
  const [content, setContent] = useState(CONTENT);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [cart, setCart] = useState([]);

  const products = useMemo(
    () => STOCK.map((s) => ({ ...s, ...EMPTY_CONTENT, ...(content[s.sku] || {}) })),
    [content]
  );
  const bySku = useMemo(
    () => Object.fromEntries(products.map((p) => [p.sku, p])),
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

  const submitOrder = (form) => {
    const id = String(3121 + orders.length);
    setOrders((o) => [
      {
        id,
        createdAt: "сейчас",
        ...form,
        pickup: "ПВЗ уточняется",
        items: cart,
        status: "новая",
      },
      ...o,
    ]);
    setCart([]);
    return id;
  };

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}>
      <header
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${C.line}`, background: C.card }}
      >
        <div className="flex items-baseline gap-3">
          <span style={{ ...DISPLAY, fontSize: 18, textTransform: "uppercase" }}>Склад&nbsp;Здоровья</span>
          <span style={{ ...MONO, fontSize: 10, color: C.muted }}>ПРОТОТИП</span>
        </div>
        <nav className="flex gap-1" style={{ ...MONO, fontSize: 11 }}>
          {[
            ["shop", "Витрина"],
            ["admin", "Админка"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className="px-3 py-1.5 rounded uppercase"
              style={{
                background: mode === k ? C.green : "transparent",
                color: mode === k ? "#fff" : C.muted,
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {mode === "shop" ? (
        <Shop
          products={products}
          bySku={bySku}
          cart={cart}
          addToCart={addToCart}
          setQty={setQty}
          submitOrder={submitOrder}
        />
      ) : (
        <Admin
          products={products}
          bySku={bySku}
          content={content}
          setContent={setContent}
          orders={orders}
          setOrders={setOrders}
        />
      )}
    </div>
  );
}

/* ============================ ВИТРИНА ============================ */

function Shop({ products, bySku, cart, addToCart, setQty, submitOrder }) {
  const [cat, setCat] = useState("Все");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(null);

  const visible = products
    .filter((p) => p.published)
    .filter((p) => cat === "Все" || p.category === cat)
    .filter((p) => (p.title + p.description).toLowerCase().includes(q.toLowerCase()));

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.qty * (bySku[i.sku]?.price || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 style={{ ...DISPLAY, fontSize: 34, textTransform: "uppercase", lineHeight: 1.05 }}>
          Добавки со склада,
          <br />
          без наценки маркетплейса
        </h1>
        <p className="mt-3 max-w-md" style={{ color: C.muted, fontSize: 15 }}>
          Оставьте заявку — перезвоним, подтвердим наличие и отправим в ваш пункт выдачи.
          Оплата при получении.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {["Все", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="px-3 py-1.5 rounded"
            style={{
              ...MONO,
              fontSize: 11,
              background: cat === c ? C.greenSoft : "transparent",
              color: cat === c ? C.green : C.muted,
              border: `1px solid ${cat === c ? C.green : C.line}`,
            }}
          >
            {c}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск"
          className="ml-auto px-3 py-1.5 rounded"
          style={{ ...inputStyle, fontSize: 13, width: 160 }}
        />
      </div>

      {visible.length === 0 ? (
        <div className="py-16 text-center" style={{ color: C.muted }}>
          Ничего не нашлось. Попробуйте другую категорию.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <article
              key={p.sku}
              className="rounded p-4 flex flex-col"
              style={{ background: C.card, border: `1px solid ${C.line}` }}
            >
              <button onClick={() => setOpen(p.sku)} className="text-left">
                <Jar sku={p.sku} category={p.category} />
                <h3 className="mt-3" style={{ ...DISPLAY, fontSize: 17 }}>
                  {p.title}
                </h3>
              </button>
              <p className="mt-1 flex-1" style={{ fontSize: 13, color: C.muted }}>
                {p.stockName}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span style={{ ...DISPLAY, fontSize: 18 }}>{money(p.price)}</span>
                {p.stock === 0 ? (
                  <Badge tone={C.danger}>нет в наличии</Badge>
                ) : (
                  <Badge>{p.stock} шт</Badge>
                )}
              </div>
              <div className="mt-3">
                <Btn full disabled={p.stock === 0} onClick={() => addToCart(p.sku)}>
                  {p.stock === 0 ? "Закончился" : "В заявку"}
                </Btn>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-10 pt-6" style={{ borderTop: `1px solid ${C.line}` }}>
        <Plaque />
        <p className="mt-2" style={{ fontSize: 12, color: C.muted }}>
          Перед применением проконсультируйтесь со специалистом. Имеются противопоказания.
        </p>
      </div>

      {count > 0 && !checkout && !done && (
        <div
          className="fixed bottom-0 left-0 right-0 px-5 py-3 flex items-center justify-between"
          style={{ background: C.card, borderTop: `1px solid ${C.line}` }}
        >
          <span style={{ ...MONO, fontSize: 12 }}>
            {count} поз. · {money(total)}
          </span>
          <Btn onClick={() => setCheckout(true)}>Оформить заявку</Btn>
        </div>
      )}

      {open && (
        <Modal onClose={() => setOpen(null)}>
          <ProductDetail
            p={bySku[open]}
            onAdd={() => {
              addToCart(open);
              setOpen(null);
            }}
          />
        </Modal>
      )}

      {checkout && (
        <Modal onClose={() => setCheckout(false)}>
          <Checkout
            cart={cart}
            bySku={bySku}
            setQty={setQty}
            total={total}
            onSubmit={(form) => {
              const id = submitOrder(form);
              setCheckout(false);
              setDone(id);
            }}
          />
        </Modal>
      )}

      {done && (
        <Modal onClose={() => setDone(null)}>
          <div className="text-center py-6">
            <h2 style={{ ...DISPLAY, fontSize: 24, textTransform: "uppercase" }}>Заявка принята</h2>
            <p className="mt-2" style={{ ...MONO, fontSize: 12, color: C.muted }}>
              НОМЕР {done}
            </p>
            <p className="mt-3" style={{ color: C.muted, fontSize: 14 }}>
              Перезвоним в рабочее время, подтвердим наличие и выберем пункт выдачи.
            </p>
            <div className="mt-5">
              <Btn onClick={() => setDone(null)}>Хорошо</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProductDetail({ p, onAdd }) {
  return (
    <div>
      <div className="flex gap-5 flex-col sm:flex-row">
        <div className="sm:w-48 shrink-0">
          <Jar sku={p.sku} category={p.category} />
        </div>
        <div className="flex-1">
          <Badge>{p.category || "без категории"}</Badge>
          <h2 className="mt-2" style={{ ...DISPLAY, fontSize: 26 }}>
            {p.title}
          </h2>
          <p style={{ fontSize: 13, color: C.muted }}>{p.stockName}</p>
          <p className="mt-3" style={{ fontSize: 15, lineHeight: 1.5 }}>
            {p.description}
          </p>

          {p.composition.length > 0 && (
            <table className="mt-4 w-full" style={{ ...MONO, fontSize: 12 }}>
              <caption
                className="text-left pb-1"
                style={{ color: C.muted, fontSize: 10, letterSpacing: "0.08em" }}
              >
                СОСТАВ НА ПОРЦИЮ
              </caption>
              <tbody>
                {p.composition.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td className="py-1">{r.n}</td>
                    <td className="py-1 text-right">{r.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {p.usage && (
            <p className="mt-4" style={{ fontSize: 14 }}>
              <span style={{ ...MONO, fontSize: 10, color: C.muted }}>ПРИЁМ · </span>
              {p.usage}
            </p>
          )}

          <p className="mt-3" style={{ ...MONO, fontSize: 10, color: C.muted }}>
            СГР {p.sgr || "—"}
          </p>

          <div className="mt-5 flex items-center gap-4">
            <span style={{ ...DISPLAY, fontSize: 22 }}>{money(p.price)}</span>
            <Btn onClick={onAdd} disabled={p.stock === 0}>
              {p.stock === 0 ? "Закончился" : "В заявку"}
            </Btn>
          </div>
          <div className="mt-4">
            <Plaque compact />
          </div>
        </div>
      </div>
    </div>
  );
}

function Checkout({ cart, bySku, setQty, total, onSubmit }) {
  const [form, setForm] = useState({ name: "", phone: "", city: "", comment: "" });
  const ok = form.name.trim() && form.phone.trim() && form.city.trim();
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <h2 style={{ ...DISPLAY, fontSize: 22, textTransform: "uppercase" }}>Заявка</h2>

      <div className="my-4">
        {cart.map((i) => {
          const p = bySku[i.sku];
          return (
            <div
              key={i.sku}
              className="flex items-center gap-3 py-2"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div className="w-14 shrink-0">
                <Jar sku={p.sku} category={p.category} size="sm" />
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 14 }}>{p.title}</div>
                <div style={{ ...MONO, fontSize: 11, color: C.muted }}>{money(p.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(i.sku, i.qty - 1)} className="px-2" style={{ color: C.muted }}>
                  −
                </button>
                <span style={{ ...MONO, fontSize: 13 }}>{i.qty}</span>
                <button
                  onClick={() => setQty(i.sku, Math.min(i.qty + 1, p.stock))}
                  className="px-2"
                  style={{ color: C.muted }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
        <div className="flex justify-between pt-3" style={{ ...DISPLAY, fontSize: 16 }}>
          <span>Итого</span>
          <span>{money(total)}</span>
        </div>
      </div>

      <Field label="Имя">
        <input value={form.name} onChange={upd("name")} className="w-full px-3 py-2 rounded" style={inputStyle} />
      </Field>
      <Field label="Телефон">
        <input value={form.phone} onChange={upd("phone")} className="w-full px-3 py-2 rounded" style={inputStyle} />
      </Field>
      <Field label="Город" hint="Пункт выдачи выберем на звонке. Позже здесь встанет карта СДЭК.">
        <input value={form.city} onChange={upd("city")} className="w-full px-3 py-2 rounded" style={inputStyle} />
      </Field>
      <Field label="Комментарий">
        <textarea
          value={form.comment}
          onChange={upd("comment")}
          rows={2}
          className="w-full px-3 py-2 rounded"
          style={inputStyle}
        />
      </Field>

      <p className="mb-4" style={{ fontSize: 12, color: C.muted }}>
        Отправляя заявку, вы соглашаетесь с обработкой персональных данных. Здесь будет
        отдельная ссылка на политику и чекбокс согласия.
      </p>

      <Btn full disabled={!ok} onClick={() => ok && onSubmit(form)}>
        Отправить заявку
      </Btn>
    </div>
  );
}

/* ============================ АДМИНКА ============================ */

function Admin({ products, bySku, content, setContent, orders, setOrders }) {
  const [tab, setTab] = useState("products");
  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <div className="flex gap-1 mb-6" style={{ ...MONO, fontSize: 11 }}>
        {[
          ["products", `Товары (${products.length})`],
          ["orders", `Заявки (${orders.filter((o) => o.status === "новая").length} новых)`],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="px-3 py-1.5 rounded uppercase"
            style={{
              background: tab === k ? C.greenSoft : "transparent",
              color: tab === k ? C.green : C.muted,
              border: `1px solid ${tab === k ? C.green : C.line}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "products" ? (
        <AdminProducts products={products} content={content} setContent={setContent} />
      ) : (
        <AdminOrders orders={orders} setOrders={setOrders} bySku={bySku} />
      )}
    </div>
  );
}

function AdminProducts({ products, content, setContent }) {
  const [editing, setEditing] = useState(null);

  const save = (sku, next) => {
    setContent({ ...content, [sku]: next });
    setEditing(null);
  };

  if (editing) {
    const p = products.find((x) => x.sku === editing);
    return <ProductEditor p={p} onCancel={() => setEditing(null)} onSave={(next) => save(editing, next)} />;
  }

  return (
    <div>
      <p className="mb-4" style={{ fontSize: 13, color: C.muted }}>
        Список приходит со склада. Здесь заполняется только то, что видит покупатель.
      </p>
      <div className="rounded overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        {products.map((p, i) => (
          <div
            key={p.sku}
            className="flex items-center gap-4 px-4 py-3"
            style={{
              background: C.card,
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
            }}
          >
            <div className="w-12 shrink-0">
              <Jar sku={p.sku} category={p.category} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 14 }}>{p.title || p.stockName}</div>
              <div style={{ ...MONO, fontSize: 11, color: C.muted }}>
                {p.sku} · {money(p.price)} · остаток {p.stock}
              </div>
            </div>
            {p.published ? (
              <Badge tone={C.green}>на сайте</Badge>
            ) : p.title ? (
              <Badge tone={C.ochre}>скрыт</Badge>
            ) : (
              <Badge tone={C.danger}>нет описания</Badge>
            )}
            <Btn variant="ghost" onClick={() => setEditing(p.sku)}>
              Открыть
            </Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductEditor({ p, onCancel, onSave }) {
  const [f, setF] = useState({
    title: p.title,
    category: p.category,
    description: p.description,
    usage: p.usage,
    sgr: p.sgr,
    composition: p.composition.length ? p.composition : [{ n: "", v: "" }],
    published: p.published,
  });
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const updRow = (i, k) => (e) => {
    const composition = f.composition.map((r, j) => (j === i ? { ...r, [k]: e.target.value } : r));
    setF({ ...f, composition });
  };

  const clean = { ...f, composition: f.composition.filter((r) => r.n.trim()) };
  const canPublish = f.title.trim() && f.category && f.sgr.trim();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Btn variant="ghost" onClick={onCancel}>
            ← Назад
          </Btn>
          <span style={{ ...MONO, fontSize: 12, color: C.muted }}>{p.sku}</span>
        </div>

        <div className="rounded p-4 mb-5" style={{ background: C.greenSoft }}>
          <div style={{ ...MONO, fontSize: 10, color: C.green }}>ИЗ СКЛАДА · ТОЛЬКО ЧТЕНИЕ</div>
          <div className="mt-1" style={{ fontSize: 14 }}>
            {p.stockName}
          </div>
          <div style={{ ...MONO, fontSize: 12, color: C.muted }}>
            {money(p.price)} · остаток {p.stock} шт
          </div>
          {/* INTEGRATION: сюда встанут данные из учётной системы по артикулу */}
        </div>

        <Field label="Название на сайте">
          <input value={f.title} onChange={upd("title")} className="w-full px-3 py-2 rounded" style={inputStyle} />
        </Field>

        <Field label="Категория">
          <select value={f.category} onChange={upd("category")} className="w-full px-3 py-2 rounded" style={inputStyle}>
            <option value="">— выберите —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Описание"
          hint="Без обещаний лечения и профилактики болезней — реклама БАДов это запрещает."
        >
          <textarea
            value={f.description}
            onChange={upd("description")}
            rows={4}
            className="w-full px-3 py-2 rounded"
            style={inputStyle}
          />
        </Field>

        <Field label="Способ приёма">
          <input value={f.usage} onChange={upd("usage")} className="w-full px-3 py-2 rounded" style={inputStyle} />
        </Field>

        <Field label="Номер СГР" hint="Без него товар нельзя показывать на сайте.">
          <input
            value={f.sgr}
            onChange={upd("sgr")}
            className="w-full px-3 py-2 rounded"
            style={{ ...inputStyle, ...MONO, fontSize: 13 }}
          />
        </Field>

        <div className="mb-4">
          <span className="block mb-2" style={{ ...MONO, fontSize: 11, color: C.muted }}>
            СОСТАВ НА ПОРЦИЮ
          </span>
          {f.composition.map((r, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={r.n}
                onChange={updRow(i, "n")}
                placeholder="Компонент"
                className="flex-1 px-3 py-2 rounded"
                style={inputStyle}
              />
              <input
                value={r.v}
                onChange={updRow(i, "v")}
                placeholder="Кол-во"
                className="w-28 px-3 py-2 rounded"
                style={{ ...inputStyle, ...MONO, fontSize: 13 }}
              />
              <button
                onClick={() => setF({ ...f, composition: f.composition.filter((_, j) => j !== i) })}
                className="px-2"
                style={{ color: C.muted }}
                aria-label="Убрать строку"
              >
                ×
              </button>
            </div>
          ))}
          <Btn variant="ghost" onClick={() => setF({ ...f, composition: [...f.composition, { n: "", v: "" }] })}>
            + строка
          </Btn>
        </div>

        <label className="flex items-center gap-2 mb-5" style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={f.published}
            disabled={!canPublish}
            onChange={(e) => setF({ ...f, published: e.target.checked })}
          />
          Показывать на сайте
          {!canPublish && (
            <span style={{ fontSize: 12, color: C.muted }}>— заполните название, категорию и СГР</span>
          )}
        </label>

        <div className="flex gap-2">
          <Btn onClick={() => onSave(clean)}>Сохранить</Btn>
          <Btn variant="ghost" onClick={onCancel}>
            Отмена
          </Btn>
        </div>
      </div>

      <div>
        <div style={{ ...MONO, fontSize: 10, color: C.muted, marginBottom: 8 }}>
          КАК УВИДИТ ПОКУПАТЕЛЬ
        </div>
        <div className="rounded p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <ProductDetail p={{ ...p, ...clean }} onAdd={() => {}} />
        </div>
      </div>
    </div>
  );
}

function AdminOrders({ orders, setOrders, bySku }) {
  const move = (id, status) => setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));

  return (
    <div className="grid gap-3">
      {orders.map((o) => {
        const total = o.items.reduce((s, i) => s + i.qty * (bySku[i.sku]?.price || 0), 0);
        return (
          <div key={o.id} className="rounded p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span style={{ ...DISPLAY, fontSize: 16 }}>№ {o.id}</span>
                  <Badge tone={STATUS_TINT[o.status]}>{o.status}</Badge>
                  <span style={{ ...MONO, fontSize: 11, color: C.muted }}>{o.createdAt}</span>
                </div>
                <div className="mt-1" style={{ fontSize: 14 }}>
                  {o.name} · {o.phone}
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>
                  {o.city} · {o.pickup}
                </div>
                {o.comment && (
                  <div className="mt-1" style={{ fontSize: 13, color: C.muted }}>
                    «{o.comment}»
                  </div>
                )}
              </div>
              <div className="text-right">
                <div style={{ ...DISPLAY, fontSize: 18 }}>{money(total)}</div>
                <div style={{ ...MONO, fontSize: 11, color: C.muted }}>оплата при получении</div>
              </div>
            </div>

            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
              {o.items.map((i) => (
                <div key={i.sku} className="flex justify-between" style={{ ...MONO, fontSize: 12 }}>
                  <span>
                    {i.sku} · {bySku[i.sku]?.title || "—"}
                  </span>
                  <span>× {i.qty}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span style={{ ...MONO, fontSize: 10, color: C.muted }}>СТАТУС</span>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => move(o.id, s)}
                  className="px-2 py-1 rounded"
                  style={{
                    ...MONO,
                    fontSize: 11,
                    background: o.status === s ? STATUS_TINT[s] : "transparent",
                    color: o.status === s ? "#fff" : C.muted,
                    border: `1px solid ${o.status === s ? STATUS_TINT[s] : C.line}`,
                  }}
                >
                  {s}
                </button>
              ))}
              {/* INTEGRATION: кнопка создания накладной в СДЭК */}
              <span className="ml-auto" style={{ ...MONO, fontSize: 11, color: C.line }}>
                Оформить в СДЭК — позже
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================== */

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(20,38,30,0.45)" }}
      onClick={onClose}
    >
      <div
        className="rounded p-6 w-full max-w-2xl my-8"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-2">
          <button onClick={onClose} style={{ color: C.muted, fontSize: 20 }} aria-label="Закрыть">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
