import { BadgePercent, Flame, Leaf, Sparkles } from "lucide-react";
import { C, PRODUCT_BADGE_STYLE, RADIUS, tintForSku } from "../constants/theme";

const BADGE_ICON = {
  "Хит продаж": Flame,
  "Новинка": Sparkles,
  "Акция": BadgePercent,
};

function BadgeOverlay({ badge }) {
  if (!badge) return null;
  const style = PRODUCT_BADGE_STYLE[badge] || PRODUCT_BADGE_STYLE["Новинка"];
  const Icon = BADGE_ICON[badge];
  return (
    <span
      className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1"
      style={{ borderRadius: RADIUS.pill, fontSize: 10, fontWeight: 600, color: style.fg, background: style.bg }}
    >
      {Icon && <Icon size={12} strokeWidth={2} />}
      {badge}
    </span>
  );
}

export function ProductPhoto({ sku, imageUrl, alt = "", badge, size = "lg" }) {
  const big = size === "lg";
  const tint = tintForSku(sku);
  const showBadge = big && badge;

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: big ? 190 : 80, borderRadius: RADIUS.well, background: tint }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: big ? 14 : 6,
            boxSizing: "border-box",
            mixBlendMode: "multiply",
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <Leaf size={big ? 32 : 18} color={C.ink} strokeWidth={1.5} style={{ opacity: 0.35 }} />
        </div>
      )}
      {showBadge && <BadgeOverlay badge={badge} />}
    </div>
  );
}
