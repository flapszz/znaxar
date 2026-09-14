import { useEffect, useState } from "react";
import { C, HEAD, INK } from "../constants/theme";
import { setSeo } from "../utils/seo";

const PATH = { article: "articles", news: "news" };

export function PublicationsPage({ type, slug, title }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    fetch(`/api/publications/${type}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]));
  }, [type]);

  const published = (items || []).filter((i) => i.published);
  const current = slug ? published.find((i) => i.slug === slug) : null;

  useEffect(() => {
    if (items === null) return;
    if (slug && current) {
      setSeo({ title: current.title, description: current.body, path: `/${PATH[type]}/${current.slug}` });
    } else {
      setSeo({ title, path: `/${PATH[type]}` });
    }
  }, [items, slug, current, type, title]);

  if (items === null) {
    return <p style={{ fontSize: 13, color: INK[60] }}>Загружаем…</p>;
  }

  if (slug) {
    if (!current) {
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
          {current.title}
        </h2>
        <p className="mt-1" style={{ fontSize: 12, color: INK[60] }}>
          {current.createdAt}
        </p>
        <div className="mt-4" style={{ fontSize: 14, lineHeight: 1.65, color: C.ink, whiteSpace: "pre-wrap" }}>
          {current.body}
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
