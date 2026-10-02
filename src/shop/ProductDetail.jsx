import { Heart, Minus, Plus } from "lucide-react";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Btn";
import { ProductPhoto } from "../components/ProductPhoto";
import { Plaque } from "../components/Plaque";
import { TrustBadges } from "../components/TrustBadges";
import { C, DIVIDER, HEAD, INK, OVERLINE, RADIUS, tintForSku } from "../constants/theme";
import { money } from "../utils/format";

export function ProductDetail({ p, related = [], onAdd, onOpen, onBack, isFavorite, onToggleFavorite, qtyInCart = 0, onSetQty, onCheckout }) {
  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="mb-5" style={{ fontSize: 13, color: INK[60] }}>
          ← Ко всем товарам
        </button>
      )}

      <div className="flex gap-8 flex-wrap">
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div
            className="flex items-center justify-center p-8 mx-auto w-full max-w-xs"
            style={{ borderRadius: RADIUS.card, background: tintForSku(p.sku) }}
          >
            <div className="w-full">
              <ProductPhoto sku={p.sku} imageUrl={p.imageUrl} alt={p.title} badge={p.badge} />
            </div>
          </div>

          {related.length > 0 && (
            <>
            <div className="mt-4" style={OVERLINE}>
              Смотрите также
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {related.map((r) => (
                <button
                  key={r.sku}
                  onClick={() => onOpen && onOpen(r.sku)}
                  className="w-16 shrink-0"
                  style={{ borderRadius: RADIUS.well, overflow: "hidden" }}
                  title={r.title}
                >
                  <ProductPhoto sku={r.sku} imageUrl={r.thumbUrl || r.imageUrl} alt={r.title} size="sm" />
                </button>
              ))}
            </div>
            </>
          )}
        </div>

        <div style={{ flex: "1 1 360px", minWidth: 0 }}>
          <div className="flex items-start justify-between gap-3">
            <Badge variant="neutral">{p.category || "без категории"}</Badge>
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className="flex items-center justify-center shrink-0"
                style={{ width: 36, height: 36, borderRadius: 999, border: `1.5px solid ${INK[18]}` }}
                aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
              >
                <Heart size={17} color={isFavorite ? C.danger : C.ink} fill={isFavorite ? C.danger : "none"} />
              </button>
            )}
          </div>
          <h1 className="mt-3" style={{ ...HEAD, fontSize: "clamp(24px,4vw,32px)", color: C.ink }}>
            {p.title}
          </h1>
          <p style={{ fontSize: 13, color: INK[60] }}>{p.stockName}</p>
          <p className="mt-3" style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 300 }}>
            {p.description}
          </p>

          <div className="mt-5 flex items-center gap-4 flex-wrap">
            <span style={{ ...HEAD, fontSize: 32, whiteSpace: "nowrap" }}>{money(p.price)}</span>
            {qtyInCart > 0 && onSetQty ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1" style={{ borderRadius: RADIUS.pill, border: `1.5px solid ${INK[18]}`, padding: 3 }}>
                  <button
                    onClick={() => onSetQty(qtyInCart - 1)}
                    aria-label="Меньше"
                    className="flex items-center justify-center"
                    style={{ width: 36, height: 36, borderRadius: RADIUS.pill }}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ minWidth: 28, textAlign: "center", fontWeight: 600 }}>{qtyInCart}</span>
                  <button
                    onClick={() => onSetQty(Math.min(qtyInCart + 1, p.stock))}
                    disabled={qtyInCart >= p.stock}
                    aria-label="Больше"
                    className="flex items-center justify-center"
                    style={{ width: 36, height: 36, borderRadius: RADIUS.pill, background: C.acid, opacity: qtyInCart >= p.stock ? 0.4 : 1 }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <Btn variant="acid" onClick={onCheckout}>
                  Оформить заявку
                </Btn>
              </div>
            ) : (
              <Btn variant="acid" onClick={onAdd} disabled={!p.stock}>
                {!p.stock ? "Закончился" : "В корзину"}
              </Btn>
            )}
          </div>
          {qtyInCart > 0 && (
            <p className="mt-2" style={{ fontSize: 13, color: INK[60] }}>
              В корзине: {qtyInCart} шт
              {qtyInCart >= p.stock ? " — больше на складе нет" : ""}
            </p>
          )}

          {p.composition.length > 0 && (
            <div className="mt-6 pt-4" style={{ borderTop: DIVIDER }}>
              <div style={OVERLINE}>Состав на порцию</div>
              <table className="mt-2 w-full" style={{ fontSize: 13 }}>
                <tbody>
                  {p.composition.map((r, i) => (
                    <tr key={i} style={{ borderTop: i === 0 ? "none" : `1px solid ${INK[12]}` }}>
                      <td className="py-1.5">{r.n}</td>
                      <td className="py-1.5 text-right">{r.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {p.usage && (
              <div className="p-3" style={{ borderRadius: RADIUS.block, background: C.card, border: `1.5px solid ${INK[12]}` }}>
                <div style={OVERLINE}>Приём</div>
                <div className="mt-1" style={{ fontSize: 13 }}>
                  {p.usage}
                </div>
              </div>
            )}
            <div className="p-3" style={{ borderRadius: RADIUS.block, background: C.card, border: `1.5px solid ${INK[12]}` }}>
              <div style={OVERLINE}>СГР</div>
              <div className="mt-1" style={{ fontSize: 13 }}>
                {p.sgr || "—"}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <TrustBadges hasSgr={Boolean(p.sgr)} />
          </div>

          <div className="mt-4 p-3" style={{ borderRadius: RADIUS.block, background: C.ink }}>
            <Plaque compact dark />
          </div>
        </div>
      </div>
    </div>
  );
}
