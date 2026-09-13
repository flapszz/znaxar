import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Btn";
import { ProductPhoto } from "../components/ProductPhoto";
import { Pagination } from "../components/Pagination";
import { C, INK, inputStyle } from "../constants/theme";
import { EMPTY_CONTENT } from "../data/content";
import { money } from "../utils/format";
import { ProductEditor } from "./ProductEditor";

const PAGE_SIZE = 8;

export function AdminProducts({ products, refreshProducts }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.sku} ${p.title} ${p.stockName || ""}`.toLowerCase().includes(q));
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
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
      setImportMessage(`Готово: обновлено ${data.updated}, добавлено новых ${data.created} (из ${data.total} строк).`);
    } catch (err) {
      setImportError(err.message || "Не удалось загрузить файл.");
    } finally {
      setImporting(false);
    }
  };

  if (editing) {
    const p = products.find((x) => x.sku === editing);
    return (
      <ProductEditor p={p} onCancel={() => setEditing(null)} onSave={save} onUploadImage={uploadImage} error={saveError} />
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
          Цену и остаток можно обновить сразу у всех — файлом Excel (первый столбец — артикул, второй — цена).
        </p>
        <div className="flex items-center gap-2">
          <label style={{ fontSize: 13 }}>
            <span
              className="inline-flex items-center px-4 py-2.5"
              style={{ borderRadius: 999, border: `1.5px solid ${INK[18]}`, color: C.ink, cursor: "pointer" }}
            >
              {importing ? "Загружаем…" : "Загрузить цены (.xlsx)"}
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
                <ProductPhoto sku={p.sku} imageUrl={p.imageUrl} alt={p.title} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 14 }}>{p.title || p.stockName || p.sku}</div>
                <div style={{ fontSize: 11, color: INK[60] }}>
                  {p.hasStock ? `${p.sku} · ${money(p.price)} · остаток ${p.stock}` : `${p.sku} · нет данных склада`}
                </div>
              </div>
              {p.published ? (
                <Badge variant="acid">на сайте</Badge>
              ) : !p.hasStock ? (
                <Badge variant="danger">нет данных склада</Badge>
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
