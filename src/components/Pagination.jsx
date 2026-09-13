import { INK, RADIUS } from "../constants/theme";

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 transition-colors disabled:opacity-40"
        style={{ borderRadius: RADIUS.pill, fontSize: 12, color: INK[60], border: `1.5px solid ${INK[18]}` }}
      >
        ← Назад
      </button>
      <span style={{ fontSize: 12, color: INK[60] }}>
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 transition-colors disabled:opacity-40"
        style={{ borderRadius: RADIUS.pill, fontSize: 12, color: INK[60], border: `1.5px solid ${INK[18]}` }}
      >
        Вперёд →
      </button>
    </div>
  );
}
