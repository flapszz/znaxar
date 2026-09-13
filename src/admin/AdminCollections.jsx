import { useEffect, useState } from "react";
import { Btn } from "../components/Btn";
import { C, HEAD, INK, inputStyle } from "../constants/theme";

export function AdminCollections({ products }) {
  const [collections, setCollections] = useState(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const refresh = () =>
    fetch("/api/collections")
      .then((r) => r.json())
      .then((data) => {
        setCollections(data);
        setError("");
      })
      .catch(() => setError("Не удалось загрузить подборки."));

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setCollections(await res.json());
      setNewName("");
    } else {
      setError("Не удалось создать подборку.");
    }
  };

  const rename = async (id, name) => {
    const res = await fetch(`/api/collections/${id}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) setCollections(await res.json());
  };

  const remove = async (id) => {
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE", credentials: "same-origin" });
    if (res.ok) setCollections(await res.json());
  };

  const move = async (index, dir) => {
    const order = collections.map((c) => c.id);
    const j = index + dir;
    if (j < 0 || j >= order.length) return;
    [order[index], order[j]] = [order[j], order[index]];
    const res = await fetch("/api/collections/reorder/all", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (res.ok) setCollections(await res.json());
  };

  if (collections === null) {
    return <p style={{ fontSize: 13, color: INK[60] }}>Загружаем подборки…</p>;
  }

  if (editingId) {
    const collection = collections.find((c) => c.id === editingId);
    return (
      <CollectionProducts
        collection={collection}
        products={products}
        onBack={() => setEditingId(null)}
        onSaved={setCollections}
      />
    );
  }

  return (
    <div>
      <p className="mb-4" style={{ fontSize: 13, color: INK[60] }}>
        Подборки для витрины — например, «Для мужчин», «Для женщин». В отличие от категории, товар может
        входить сразу в несколько подборок.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Название новой подборки"
          className="flex-1 px-3.5 py-2 rounded-full"
          style={{ ...inputStyle, fontSize: 13 }}
        />
        <Btn onClick={create}>+ Добавить</Btn>
      </div>

      {error && (
        <p className="mb-3" style={{ fontSize: 12, color: C.danger }}>
          {error}
        </p>
      )}

      {collections.length === 0 ? (
        <p className="py-8 text-center" style={{ fontSize: 13, color: INK[60] }}>
          Подборок пока нет.
        </p>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1.5px solid ${INK[12]}` }}
        >
          {collections.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${INK[12]}` }}
            >
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  style={{ color: INK[60], opacity: i === 0 ? 0.3 : 1, lineHeight: 1 }}
                  aria-label="Выше"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === collections.length - 1}
                  style={{ color: INK[60], opacity: i === collections.length - 1 ? 0.3 : 1, lineHeight: 1 }}
                  aria-label="Ниже"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <input
                  defaultValue={c.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== c.name) rename(c.id, v);
                    else e.target.value = c.name;
                  }}
                  className="w-full px-2 py-1 rounded-lg"
                  style={{ ...inputStyle, border: "1px solid transparent", fontSize: 14 }}
                />
                <div style={{ fontSize: 11, color: INK[60], paddingLeft: 8 }}>
                  {c.skus.length} {c.skus.length === 1 ? "товар" : "товаров"}
                </div>
              </div>
              <Btn variant="ghost" onClick={() => setEditingId(c.id)}>
                Товары
              </Btn>
              <button
                onClick={() => remove(c.id)}
                style={{ fontSize: 11, color: C.danger }}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionProducts({ collection, products, onBack, onSaved }) {
  const [skus, setSkus] = useState(collection.skus);
  const [saving, setSaving] = useState(false);

  const included = skus.map((sku) => products.find((p) => p.sku === sku)).filter(Boolean);
  const available = products.filter((p) => !skus.includes(p.sku));

  const add = (sku) => setSkus([...skus, sku]);
  const removeSku = (sku) => setSkus(skus.filter((s) => s !== sku));
  const move = (index, dir) => {
    const next = [...skus];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setSkus(next);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/collections/${collection.id}/products`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved(await res.json());
      onBack();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Btn variant="ghost" onClick={onBack}>
          ← Назад
        </Btn>
        <span style={{ ...HEAD, fontSize: 18, color: C.ink }}>{collection.name}</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2" style={{ fontSize: 11, color: INK[60] }}>
            В ПОДБОРКЕ · ПОРЯДОК ПОКАЗА
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${INK[12]}` }}>
            {included.length === 0 && (
              <p className="p-4" style={{ fontSize: 13, color: INK[60] }}>
                Пока пусто — добавьте товары справа.
              </p>
            )}
            {included.map((p, i) => (
              <div
                key={p.sku}
                className="flex items-center gap-2 px-3 py-2"
                style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${INK[12]}` }}
              >
                <div className="flex flex-col shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0} style={{ color: INK[60], opacity: i === 0 ? 0.3 : 1, lineHeight: 1 }}>
                    ▲
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === included.length - 1}
                    style={{ color: INK[60], opacity: i === included.length - 1 ? 0.3 : 1, lineHeight: 1 }}
                  >
                    ▼
                  </button>
                </div>
                <span className="flex-1 min-w-0 truncate" style={{ fontSize: 13 }}>
                  {p.title || p.stockName || p.sku}
                </span>
                <button onClick={() => removeSku(p.sku)} style={{ color: C.danger, fontSize: 16 }} aria-label="Убрать">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2" style={{ fontSize: 11, color: INK[60] }}>
            ДОБАВИТЬ ТОВАР
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${INK[12]}` }}>
            {available.length === 0 && (
              <p className="p-4" style={{ fontSize: 13, color: INK[60] }}>
                Все товары уже в подборке.
              </p>
            )}
            {available.map((p, i) => (
              <div
                key={p.sku}
                className="flex items-center gap-2 px-3 py-2"
                style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${INK[12]}` }}
              >
                <span className="flex-1 min-w-0 truncate" style={{ fontSize: 13 }}>
                  {p.title || p.stockName || p.sku}
                </span>
                <button onClick={() => add(p.sku)} style={{ color: C.violet, fontSize: 16 }} aria-label="Добавить">
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Btn onClick={save} disabled={saving}>
          {saving ? "Сохраняем…" : "Сохранить порядок"}
        </Btn>
      </div>
    </div>
  );
}
