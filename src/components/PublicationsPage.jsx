import { useEffect, useState } from "react";
import { C, HEAD, INK } from "../constants/theme";

const PATH = { article: "articles", news: "news" };

export function PublicationsPage({ type, slug, title }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    fetch(`/api/publications/${type}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]));
  }, [type]);

  if (items === null) {
    return <p style={{ fontSize: 13, color: INK[60] }}>Загружаем…</p>;
  }

  const published = items.filter((i) => i.published);

  if (slug) {
    const item = published.find((i) => i.slug === slug);
    if (!item) {
      return (
        <div>
          <h2 style={{ ...HEAD, fontSize: 22, color: C.ink }}>Не нашли такой материал</h2>
          <a href={`/${PATH[type]}`} className="underline" style={{ fontSize: 13, color: INK[60] }}>
            ← Ко всем материалам
          </a>
        </div>
      );
    }
    return (
      <div>
        <a href={`/${PATH[type]}`} className="underline" style={{ fontSize: 13, color: INK[60] }}>
          ← Ко всем материалам
        </a>
        <h2 className="mt-3" style={{ ...HEAD, fontSize: 24, color: C.ink }}>
          {item.title}
        </h2>
        <p className="mt-1" style={{ fontSize: 12, color: INK[60] }}>
          {item.createdAt}
        </p>
        <div className="mt-4" style={{ fontSize: 14, lineHeight: 1.65, color: C.ink, whiteSpace: "pre-wrap" }}>
          {item.body}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ ...HEAD, fontSize: 22, color: C.ink }}>{title}</h2>
      {published.length === 0 ? (
        <p className="mt-4" style={{ fontSize: 13, color: INK[60] }}>
          Пока ничего нет — загляните позже.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {published.map((i) => (
            <a key={i.id} href={`/${PATH[type]}/${i.slug}`} className="block">
              <div style={{ ...HEAD, fontSize: 16, color: C.ink }}>{i.title}</div>
              <div style={{ fontSize: 12, color: INK[60] }}>{i.createdAt}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
