import { useEffect, useState } from "react";
import { Btn } from "../components/Btn";
import { C, INK, inputStyle } from "../constants/theme";

export function AdminCategories() {
  const [categories, setCategories] = useState(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const refresh = () =>
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setError("");
      })
      .catch(() => setError("Не удалось загрузить категории."));

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCategories(data);
      setNewName("");
      setError("");
    } else {
      setError(data.error || "Не удалось создать категорию.");
    }
  };

  const rename = async (id, name, fallback) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCategories(data);
      setError("");
    } else {
      setError(data.error || "Не удалось переименовать категорию.");
      refresh(); // откатить инпут к реальному имени
    }
  };

  const remove = async (id) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE", credentials: "same-origin" });
    if (res.ok) setCategories(await res.json());
  };

  const move = async (index, dir) => {
    const order = categories.map((c) => c.id);
    const j = index + dir;
    if (j < 0 || j >= order.length) return;
    [order[index], order[j]] = [order[j], order[index]];
    const res = await fetch("/api/categories/reorder/all", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (res.ok) setCategories(await res.json());
  };

  if (categories === null) {
    return <p style={{ fontSize: 13, color: INK[60] }}>Загружаем категории…</p>;
  }

  return (
    <div>
      <p className="mb-4" style={{ fontSize: 13, color: INK[60] }}>
        Категории — как «Витамины», «Минералы». У товара только одна категория (в отличие от подборок).
        Порядок здесь определяет порядок вкладок на витрине.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Название новой категории"
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

      {categories.length === 0 ? (
        <p className="py-8 text-center" style={{ fontSize: 13, color: INK[60] }}>
          Категорий пока нет.
        </p>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1.5px solid ${INK[12]}` }}
        >
          {categories.map((c, i) => (
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
                  disabled={i === categories.length - 1}
                  style={{ color: INK[60], opacity: i === categories.length - 1 ? 0.3 : 1, lineHeight: 1 }}
                  aria-label="Ниже"
                >
                  ▼
                </button>
              </div>
              <input
                defaultValue={c.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== c.name) rename(c.id, v);
                  else e.target.value = c.name;
                }}
                className="flex-1 px-2 py-1 rounded-lg"
                style={{ ...inputStyle, border: "1px solid transparent", fontSize: 14 }}
              />
              <button onClick={() => remove(c.id)} style={{ fontSize: 11, color: C.danger }}>
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
