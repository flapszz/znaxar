import { useEffect, useState } from "react";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { ProductPhoto } from "../components/ProductPhoto";
import { PRODUCT_BADGES } from "../constants/catalog";
import { C, INK, inputStyle } from "../constants/theme";
import { ProductDetail } from "../shop/ProductDetail";

export function ProductEditor({ p, mode = "edit", existingSkus = [], onCancel, onSave, onUploadImage, error }) {
  const isNew = mode === "create";

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => setCategories([]));
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : []))
      .then(setBrands)
      .catch(() => setBrands([]));
  }, []);

  const [sku, setSku] = useState(p.sku || "");
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState(p.imageUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [f, setF] = useState({
    title: p.title,
    category: p.category,
    brand: p.brand || "",
    description: p.description,
    usage: p.usage,
    sgr: p.sgr,
    composition: p.composition.length ? p.composition : [{ n: "", v: "" }],
    published: p.published,
    badge: p.badge || "",
    price: p.price != null ? String(p.price) : "",
    stock: p.stock != null ? String(p.stock) : "",
    stockName: p.stockName || "",
  });
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const updRow = (i, k) => (e) => {
    const composition = f.composition.map((r, j) => (j === i ? { ...r, [k]: e.target.value } : r));
    setF({ ...f, composition });
  };

  const priceNum = Number(f.price);
  const stockNum = Number(f.stock);
  const priceValid = f.price !== "" && Number.isFinite(priceNum) && priceNum >= 0;
  const stockValid = f.stock !== "" && Number.isFinite(stockNum) && stockNum >= 0;

  const clean = {
    ...f,
    composition: f.composition.filter((r) => r.n.trim()),
    price: f.price === "" ? null : priceNum,
    stock: f.stock === "" ? null : stockNum,
  };

  const skuTrimmed = sku.trim().toUpperCase();
  const skuError = isNew
    ? !skuTrimmed
      ? "Укажите артикул"
      : existingSkus.some((s) => s.toUpperCase() === skuTrimmed)
      ? "Такой артикул уже используется"
      : ""
    : "";

  const canPublish = f.title.trim() && f.category && f.sgr.trim() && priceValid && stockValid;
  const canSave = (isNew ? !skuError : true) && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(isNew ? skuTrimmed : p.sku, clean);
    } finally {
      setSaving(false);
    }
  };

  const currentSku = isNew ? skuTrimmed : p.sku;

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (isNew && skuError) {
      setPhotoError("Сначала укажите корректный артикул.");
      return;
    }
    setUploadingPhoto(true);
    setPhotoError("");
    try {
      const url = await onUploadImage(currentSku, file);
      setImageUrl(url);
    } catch (err) {
      setPhotoError(err.message || "Не удалось загрузить фото.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Btn variant="ghost" onClick={onCancel}>
            ← Назад
          </Btn>
          {!isNew && <span style={{ fontSize: 12, color: INK[60] }}>{p.sku}</span>}
        </div>

        {isNew ? (
          <Field label="Артикул" hint="Такой же, как в учётной системе (МойСклад или аналог).">
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="BAD-0501"
              className="w-full px-3 py-2 rounded-lg"
              style={{ ...inputStyle, fontSize: 13 }}
            />
            {skuError && (
              <span className="block mt-1" style={{ fontSize: 12, color: C.danger }}>
                {skuError}
              </span>
            )}
          </Field>
        ) : (
          <div className="rounded-2xl p-4 mb-5" style={{ background: C.card, border: `1px solid ${INK[12]}` }}>
            <div style={{ fontSize: 10, color: INK[60] }}>АРТИКУЛ</div>
            <div className="mt-1" style={{ fontSize: 14 }}>
              {p.sku}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Цена, ₽">
            <input
              type="number"
              min="0"
              value={f.price}
              onChange={upd("price")}
              className="w-full px-3 py-2 rounded-lg"
              style={inputStyle}
            />
          </Field>
          <Field label="Остаток, шт">
            <input
              type="number"
              min="0"
              value={f.stock}
              onChange={upd("stock")}
              className="w-full px-3 py-2 rounded-lg"
              style={inputStyle}
            />
          </Field>
        </div>
        <Field label="Название на складе" hint="Как товар называется в учётной системе — необязательно совпадает с названием на сайте.">
          <input
            value={f.stockName}
            onChange={upd("stockName")}
            className="w-full px-3 py-2 rounded-lg"
            style={inputStyle}
          />
        </Field>

        {(!priceValid || !stockValid) && (
          <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(255,141,109,.15)', border: `1.5px solid ${C.peach}` }}>
            <span style={{ fontSize: 11, color: C.peach }}>
              Заполните цену и остаток — без них товар нельзя показать на сайте.
            </span>
          </div>
        )}

        <Field label="Фото товара" hint="JPEG, PNG или WebP, до 5 МБ.">
          <div className="flex items-center gap-3">
            <div className="w-16 shrink-0">
              <ProductPhoto sku={p.sku || "new"} imageUrl={imageUrl} alt={f.title} size="sm" />
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto || (isNew && !!skuError)}
                style={{ fontSize: 13 }}
              />
              {uploadingPhoto && (
                <span className="block mt-1" style={{ fontSize: 12, color: INK[60] }}>
                  Загружаем…
                </span>
              )}
              {photoError && (
                <span className="block mt-1" style={{ fontSize: 12, color: C.danger }}>
                  {photoError}
                </span>
              )}
            </div>
          </div>
        </Field>

        <Field label="Название на сайте">
          <input value={f.title} onChange={upd("title")} className="w-full px-3 py-2 rounded-lg" style={inputStyle} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Категория">
            <select value={f.category} onChange={upd("category")} className="w-full px-3 py-2 rounded-lg" style={inputStyle}>
              <option value="">— выберите —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Бренд" hint="Необязательно.">
            <select value={f.brand} onChange={upd("brand")} className="w-full px-3 py-2 rounded-lg" style={inputStyle}>
              <option value="">— не указан —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Бейдж на карточке" hint="Необязательно — акцентная плашка поверх фото на витрине.">
          <select value={f.badge} onChange={upd("badge")} className="w-full px-3 py-2 rounded-lg" style={inputStyle}>
            <option value="">Нет</option>
            {PRODUCT_BADGES.map((b) => (
              <option key={b} value={b}>
                {b}
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
            className="w-full px-3 py-2 rounded-lg"
            style={inputStyle}
          />
        </Field>

        <Field label="Способ приёма">
          <input value={f.usage} onChange={upd("usage")} className="w-full px-3 py-2 rounded-lg" style={inputStyle} />
        </Field>

        <Field label="Номер СГР" hint="Без него товар нельзя показывать на сайте.">
          <input
            value={f.sgr}
            onChange={upd("sgr")}
            className="w-full px-3 py-2 rounded-lg"
            style={{ ...inputStyle, fontSize: 13 }}
          />
        </Field>

        <div className="mb-4">
          <span className="block mb-2" style={{ fontSize: 11, color: INK[60] }}>
            СОСТАВ НА ПОРЦИЮ
          </span>
          {f.composition.map((r, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={r.n}
                onChange={updRow(i, "n")}
                placeholder="Компонент"
                className="flex-1 px-3 py-2 rounded-lg"
                style={inputStyle}
              />
              <input
                value={r.v}
                onChange={updRow(i, "v")}
                placeholder="Кол-во"
                className="w-28 px-3 py-2 rounded-lg"
                style={{ ...inputStyle, fontSize: 13 }}
              />
              <button
                onClick={() => setF({ ...f, composition: f.composition.filter((_, j) => j !== i) })}
                className="px-2"
                style={{ color: INK[60] }}
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
            <span style={{ fontSize: 12, color: INK[60] }}>
              {!priceValid || !stockValid ? "— заполните цену и остаток" : "— заполните название, категорию и СГР"}
            </span>
          )}
        </label>

        {error && (
          <p className="mb-3" style={{ fontSize: 12, color: C.danger }}>
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Btn disabled={!canSave} onClick={handleSave}>
            {saving ? "Сохраняем…" : "Сохранить"}
          </Btn>
          <Btn variant="ghost" onClick={onCancel}>
            Отмена
          </Btn>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: INK[60], marginBottom: 8 }}>
          КАК УВИДИТ ПОКУПАТЕЛЬ
        </div>
        <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${INK[12]}` }}>
          <ProductDetail p={{ ...p, sku: isNew ? skuTrimmed || "—" : p.sku, ...clean, imageUrl }} onAdd={() => {}} />
        </div>
      </div>
    </div>
  );
}
