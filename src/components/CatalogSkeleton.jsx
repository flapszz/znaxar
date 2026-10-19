import { C, INK, RADIUS } from "../constants/theme";

// Каркас каталога на время загрузки: сразу видно, где что появится, и страница не «прыгает».
export function CatalogSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6" role="status" aria-label="Загружаем каталог">
      <div className="p-5 sm:p-8" style={{ background: C.surface, borderRadius: RADIUS.frame }}>
        <div className="skeleton-pulse" style={{ height: 44, width: "min(420px, 70%)", background: INK[12] }} />
        <div className="skeleton-pulse mt-3" style={{ height: 14, width: "min(520px, 90%)", background: INK[12] }} />
        <div className="skeleton-pulse mt-6" style={{ height: 52, width: "min(560px, 100%)", border: `1.5px solid ${INK[18]}` }} />
        <div className="mt-8 grid gap-3 sm:gap-5 product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-pulse p-4" style={{ border: `1.5px solid ${INK[12]}`, borderRadius: RADIUS.card, background: C.card, animationDelay: `${i * 90}ms` }}>
              <div style={{ height: 150, background: INK[12], borderRadius: RADIUS.well }} />
              <div className="mt-4" style={{ height: 14, width: "70%", background: INK[12] }} />
              <div className="mt-2" style={{ height: 12, width: "40%", background: INK[12] }} />
              <div className="mt-5" style={{ height: 28, width: "45%", background: INK[12] }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
