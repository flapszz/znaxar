import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Btn";
import { ProductPhoto } from "../components/ProductPhoto";
import { Pagination } from "../components/Pagination";
import { C, INK, RADIUS, inputStyle } from "../constants/theme";
import { EMPTY_CONTENT } from "../data/content";
import { money } from "../utils/format";
import { ProductEditor } from "./ProductEditor";

const PAGE_SIZE = 12;

const statusOf = (p) => (p.published ? "на сайте" : !p.hasStock ? "нет цены и остатка" : p.title ? "скрыт" : "нет описания");
const STATUS_FILTERS = ["все", "на сайте", "скрыт", "нет описания", "нет цены и остатка"];

export function AdminProducts({ products, refreshProducts }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("все");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => statusFilter === "все" || statusOf(p) === statusFilter)
      .filter((p) => !q || `${p.sku} ${p.title} ${p.stockName || ""}`.toLowerCase().includes(q));
  }, [products, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const remove = async (sku) => {
    setSaveError("");
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(sku)}`, { method: "DELETE", credentials: "same-origin" });
      if (!res.ok) throw new Error();
      await refreshProducts();
      setEditing(null);
    } catch {
      setSaveError("Не удалось удалить товар. Попробуйте ещё раз.");
    }
  };

  const save = async (sku, next) => {
    setSaveError("");
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(sku)}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
      await refreshProducts();
      setEditing(null);
      setCreating(false);
    } catch {
      setSaveError("Не удалось сохранить товар. Попробуйте ещё раз.");
    }
  };

  const uploadImage = async (sku, file) => {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch(`/api/products/${encodeURIComponent(sku)}/image`, {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Не удалось загрузить фото.");
    await refreshProducts();
    return data.imageUrl;
  };

  const importPrices = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    setImportError("");
    setImportMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/products/import-prices", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить файл.");
      await refreshProducts();
      const missing = data.notFound?.length
        ? ` Не нашли на сайте и пропустили: ${data.notFound.slice(0, 8).join(", ")}${data.notFound.length > 8 ? " и ещё " + (data.notFound.length - 8) : ""} — проверьте артикулы.`
        : "";
      setImportMessage(`Готово: обновлено ${data.updated} из ${data.total} строк.${missing}`);
    } catch (err) {
      setImportError(err.message || "Не удалось загрузить файл.");
    } finally {
      setImporting(false);
    }
  };

  if (editing) {
    const p = products.find((x) => x.sku === editing);
    return (
      <ProductEditor p={p} onCancel={() => setEditing(null)} onSave={save} onUploadImage={uploadImage} onDelete={remove} error={saveError} />
    );
  }

  if (creating) {
    return (
      <ProductEditor
        mode="create"
        p={{ sku: "", stockName: null, price: null, stock: null, hasStock: false, ...EMPTY_CONTENT }}
        existingSkus={products.map((x) => x.sku)}
        onCancel={() => setCreating(false)}
        onSave={save}
        onUploadImage={uploadImage}
        error={saveError}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <p style={{ fontSize: 13, color: INK[60] }}>
          Цены и остатки можно обновить сразу у всех: скачайте таблицу, поправьте цифры в Excel и загрузите обратно.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/products/export-prices"
            className="inline-flex items-center px-4 py-2.5"
            style={{ borderRadius: RADIUS.pill, border: `1.5px solid ${INK[18]}`, color: C.ink, fontSize: 13 }}
          >
            Скачать таблицу
          </a>
          <label style={{ fontSize: 13 }}>
            <span
              className="inline-flex items-center px-4 py-2.5"
              style={{ borderRadius: RADIUS.pill, border: `1.5px solid ${INK[18]}`, color: C.ink, cursor: "pointer" }}
            >
              {importing ? "Загружаем…" : "Загрузить таблицу"}
            </span>
            <input type="file" accept=".xlsx" onChange={importPrices} disabled={importing} style={{ display: "none" }} />
          </label>
          <Btn onClick={() => setCreating(true)}>+ Новая позиция</Btn>
        </div>
      </div>

      {importMessage && (
        <p className="mb-3" style={{ fontSize: 12, color: C.violet }}>
          {importMessage}
        </p>
      )}
      {importError && (
        <p className="mb-3" style={{ fontSize: 12, color: C.danger }}>
          {importError}
        </p>
      )}

      <div className="flex items-center gap-2 overflow-x-auto flex-nowrap pb-2 mb-1">
        {STATUS_FILTERS.map((f) => {
          const count = f === "все" ? products.length : products.filter((p) => statusOf(p) === f).length;
          return (
            <button
              key={f}
              onClick={() => {
                setStatusFilter(f);
                setPage(1);
              }}
              className="px-3 py-1.5 shrink-0"
              style={{
                borderRadius: RADIUS.pill,
                fontSize: 12,
                background: statusFilter === f ? C.ink : "transparent",
                color: statusFilter === f ? C.surface : INK[60],
                border: `1.5px solid ${statusFilter === f ? C.ink : INK[18]}`,
              }}
            >
              {f} · {count}
            </button>
          );
        })}
      </div>

      <input
        value={search}
        onChange={(e) => updateSearch(e.target.value)}
        placeholder="Поиск по артикулу или названию"
        className="w-full px-4 py-2.5 mb-4"
        style={{ ...inputStyle, fontSize: 13 }}
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center" style={{ color: INK[60], fontSize: 13 }}>
          Ничего не найдено.
        </p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${INK[12]}` }}>
          {paged.map((p, i) => (
            <div
              key={p.sku}
              className="flex items-center gap-4 px-4 py-3"
              style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${INK[12]}` }}
            >
              <div className="w-12 shrink-0">
                <ProductPhoto sku={p.sku} imageUrl={p.thumbUrl || p.imageUrl} alt={p.title} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 14 }}>{p.title || p.stockName || p.sku}</div>
                <div style={{ fontSize: 11, color: INK[60] }}>
                  {p.hasStock ? `${p.sku} · ${money(p.price)} · остаток ${p.stock}` : `${p.sku} · не указаны цена и остаток`}
                </div>
              </div>
              {p.published ? (
                <Badge variant="acid">на сайте</Badge>
              ) : !p.hasStock ? (
                <Badge variant="danger">нет цены и остатка</Badge>
              ) : p.title ? (
                <Badge variant="neutral">скрыт</Badge>
              ) : (
                <Badge variant="danger">нет описания</Badge>
              )}
              <Btn variant="outline" onClick={() => setEditing(p.sku)}>
                Открыть
              </Btn>
            </div>
          ))}
        </div>
      )}

      <Pagination page={pageSafe} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
