// Линейные чертежи упаковки по категориям для стиля «Индекс»: показываются на карточке,
// пока у товара нет фото. Рисунок схематичный и ничего не обещает о составе.
function pickKind(category = "") {
  const c = category.toLowerCase();
  if (c.includes("минерал")) return "blister";
  if (c.includes("омега") || c.includes("жир")) return "softgel";
  if (c.includes("сон") || c.includes("стресс")) return "dropper";
  if (c.includes("красот")) return "cream";
  return "jar";
}

const ART = {
  jar: (
    <>
      <path d="M38 22h44v14H38z" />
      <path d="M46 22v14M54 22v14M62 22v14M70 22v14M78 22v14" strokeWidth="1" />
      <path d="M44 36h32v8H44z" />
      <path d="M44 44h32l10 12v52H34V56z" />
      <path d="M42 66h36v28H42z" />
      <path d="M60 71v8M56 73l8 4M64 73l-8 4" strokeWidth="1" />
      <path d="M48 85h24M48 90h18" strokeWidth="1" />
    </>
  ),
  blister: (
    <>
      <path d="M14 30h92v60H14z" />
      <path d="M14 38h92" strokeWidth="1" />
      {[30, 50, 70, 90].map((x) => (
        <g key={x}>
          <circle cx={x} cy="52" r="8" />
          <circle cx={x} cy="76" r="8" />
        </g>
      ))}
      <path d="M98 30v60" strokeWidth="1" strokeDasharray="3 3" />
    </>
  ),
  softgel: (
    <>
      <g transform="rotate(-24 56 70)">
        <rect x="20" y="52" width="72" height="36" rx="18" />
        <path d="M56 52v36" strokeWidth="1" />
        <path d="M30 62h14" strokeWidth="1" />
      </g>
      <path d="M92 20c7 9 11 14 11 19a11 11 0 0 1-22 0c0-5 4-10 11-19z" />
      <path d="M92 42a4 4 0 0 0 4-4" strokeWidth="1" />
    </>
  ),
  dropper: (
    <>
      <path d="M52 44v-12a8 8 0 0 1 16 0v12" />
      <path d="M48 44h24v6H48z" />
      <path d="M52 50h16v8H52z" />
      <path d="M38 58h44v50H38z" />
      <path d="M44 72h32v22H44z" />
      <path d="M50 80h20M50 86h14" strokeWidth="1" />
      <path d="M60 112v4" strokeWidth="1" strokeDasharray="2 2" />
    </>
  ),
  cream: (
    <>
      <path d="M26 38h68v16H26z" />
      <path d="M34 38v16M42 38v16M50 38v16M58 38v16M66 38v16M74 38v16M82 38v16" strokeWidth="1" />
      <path d="M30 54h60v40H30z" />
      <path d="M40 66h40v16H40z" />
      <path d="M48 74h24" strokeWidth="1" />
      <path d="M22 100h76" strokeWidth="1" />
    </>
  ),
};

export function CategoryArt({ category, className = "", style }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`cat-art ${className}`}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
    >
      {ART[pickKind(category)]}
    </svg>
  );
}
