import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Btn";
import { Field } from "../components/Field";
import { C, INK, inputStyle } from "../constants/theme";

export function AdminPublications({ type, singular }) {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // id или "new"
  const [f, setF] = useState({ title: "", body: "", published: false });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = () =>
    fetch(`/api/publications/${type}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]));

  useEffect(() => {
    refresh();
  }, [type]);

  const startEdit = (item) => {
    setEditing(item ? item.id : "new");
    setF(item ? { title: item.title, body: item.body, published: item.published } : { title: "", body: "", published: false });
    setError("");
  };

  const save = async () => {
    if (!f.title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const url = editing === "new" ? `/api/publications/${type}` : `/api/publications/${type}/${editing}`;
      const res = await fetch(url, {
        method: editing === "new" ? "POST" : "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить.");
      await refresh();
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Удалить без возможности восстановить?")) return;
    await fetch(`/api/publications/${type}/${id}`, { method: "DELETE", credentials: "same-origin" });
    refresh();
  };

  if (items === null) {
    return <p style={{ fontSize: 13, color: INK[60] }}>Загружаем…</p>;
  }

  if (editing) {
    return (
      <div>
        <Field label="Заголовок">
          <input
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg"
            style={inputStyle}
          />
        </Field>
        <Field label="Текст">
          <textarea
            value={f.body}
            onChange={(e) => setF({ ...f, body: e.target.value })}
            rows={10}
            className="w-full px-3 py-2 rounded-lg"
            style={inputStyle}
          />
        </Field>
        <label className="flex items-center gap-2 mb-5" style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={f.published}
            onChange={(e) => setF({ ...f, published: e.target.checked })}
          />
          Показывать на сайте
        </label>
        {error && (
          <p className="mb-3" style={{ fontSize: 12, color: C.danger }}>
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Btn disabled={!f.title.trim() || saving} onClick={save}>
            {saving ? "Сохраняем…" : "Сохранить"}
          </Btn>
          <Btn variant="outline" onClick={() => setEditing(null)}>
            Отмена
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontSize: 13, color: INK[60] }}>
          Ссылка на сайте формируется из заголовка автоматически.
        </p>
        <Btn onClick={() => startEdit(null)}>+ {singular}</Btn>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center" style={{ fontSize: 13, color: INK[60] }}>
          Пока пусто.
        </p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${INK[12]}` }}>
          {items.map((i, idx) => (
            <div
              key={i.id}
              className="flex items-center gap-4 px-4 py-3"
              style={{ background: C.card, borderTop: idx === 0 ? "none" : `1px solid ${INK[12]}` }}
            >
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 14 }}>{i.title}</div>
                <div style={{ fontSize: 11, color: INK[60] }}>{i.createdAt}</div>
              </div>
              <Badge variant={i.published ? "acid" : "neutral"}>{i.published ? "на сайте" : "черновик"}</Badge>
              <Btn variant="outline" onClick={() => startEdit(i)}>
                Открыть
              </Btn>
              <button onClick={() => remove(i.id)} style={{ fontSize: 11, color: C.danger }}>
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
