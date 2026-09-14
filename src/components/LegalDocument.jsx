import { C, HEAD, INK } from "../constants/theme";

export function LegalDocument({ title, date, sections, draftWarning }) {
  return (
    <div>
      <h2 style={{ ...HEAD, fontSize: 22, color: C.ink }}>{title}</h2>
      {date && (
        <p className="mt-1" style={{ fontSize: 12, color: INK[60] }}>
          Редакция от {date}
        </p>
      )}

      {draftWarning !== false && (
        <div
          className="mt-3 mb-5 p-3"
          style={{ borderRadius: 16, background: "rgba(255,141,109,.15)", border: `1.5px solid ${C.peach}` }}
        >
          <span style={{ fontSize: 12, color: C.ink }}>
            {typeof draftWarning === "string"
              ? draftWarning
              : "Черновик для прототипа. Перед публикацией сайта нужно вписать реальные реквизиты и показать текст юристу."}
          </span>
        </div>
      )}

      <div className="grid gap-4">
        {sections.map((s) => (
          <div key={s.title}>
            <div style={{ ...HEAD, fontSize: 15, color: C.ink, marginBottom: 4 }}>{s.title}</div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: INK[60] }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
