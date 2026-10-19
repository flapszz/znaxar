// Банка-чертёж для стиля «Индекс»: линейный рисунок с размерными линиями, выносками
// и «разнесёнными» капсулами. Цвет берётся из текущего цвета текста (currentColor).
// Линии прорисовываются ступенями (классы bp-draw / bp-fade в index.css), без анимации
// рисунок просто стоит целиком.
const line = (i, d, extra = {}) => (
  <path key={`${i}-${d}`} className="bp-draw" pathLength="1" style={{ "--i": i }} d={d} {...extra} />
);

export function JarBlueprint({ className = "", style, title = "" }) {
  return (
    <svg
      viewBox="0 0 300 380"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : "true"}
    >
      {/* метки по углам кадра */}
      {[
        "M8 2v12M2 8h12",
        "M292 2v12M286 8h12",
        "M8 366v12M2 372h12",
        "M292 366v12M286 372h12",
      ].map((d) => line(0, d, { strokeWidth: 1 }))}

      {/* крышка с насечкой и горловина */}
      {line(1, "M72 66h104v34H72z")}
      {line(2, "M84 66v34M96 66v34M108 66v34M120 66v34M132 66v34M144 66v34M156 66v34M168 66v34", { strokeWidth: 1 })}
      {line(2, "M80 100h88v12H80z")}

      {/* корпус и основание */}
      {line(3, "M80 112h88l18 26v182H62V138z")}
      {line(4, "M50 332h148", { strokeWidth: 1 })}

      {/* этикетка */}
      {line(5, "M76 176h96v102H76z")}
      {line(6, "M124 188v18M115 193l18 10M133 193l-18 10")}
      <text className="bp-fade" style={{ "--i": 7 }} x="124" y="232" textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="1" fill="currentColor" stroke="none">
        ЗНАХАРЬ
      </text>
      {line(7, "M88 244h72M88 254h56M88 264h64", { strokeWidth: 1 })}

      {/* размерные линии: высота и ширина */}
      {line(8, "M28 66v266M22 66h12M22 332h12", { strokeWidth: 1 })}
      {line(8, "M62 352h124M62 346v12M186 346v12", { strokeWidth: 1 })}
      <path d="M72 66H34M62 332H34" strokeWidth="1" strokeDasharray="3 3" />
      <text className="bp-fade" style={{ "--i": 9 }} x="14" y="204" fontSize="11" fill="currentColor" stroke="none">A</text>
      <text className="bp-fade" style={{ "--i": 9 }} x="120" y="372" fontSize="11" fill="currentColor" stroke="none">B</text>

      {/* выноски */}
      {line(9, "M172 198h28", { strokeWidth: 1 })}
      <circle className="bp-fade" style={{ "--i": 10 }} cx="206" cy="198" r="6" strokeWidth="1" />
      <text className="bp-fade" style={{ "--i": 10 }} x="206" y="201.5" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none">1</text>
      <text className="bp-fade" style={{ "--i": 10 }} x="218" y="202" fontSize="10" fill="currentColor" stroke="none">СГР</text>
      {line(9, "M176 83h24", { strokeWidth: 1 })}
      <circle className="bp-fade" style={{ "--i": 10 }} cx="206" cy="83" r="6" strokeWidth="1" />
      <text className="bp-fade" style={{ "--i": 10 }} x="206" y="86.5" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none">2</text>
      <text className="bp-fade" style={{ "--i": 10 }} x="218" y="87" fontSize="10" fill="currentColor" stroke="none">СКЛАД</text>

      {/* две капсулы «в разборе» над крышкой */}
      <g className="bp-fade" style={{ "--i": 11 }}>
        <g transform="rotate(-18 106 28)">
          <rect x="86" y="20" width="40" height="16" rx="8" />
          <path d="M106 20v16" strokeWidth="1" />
        </g>
        <g transform="rotate(14 150 30)">
          <rect x="130" y="22" width="40" height="16" rx="8" />
          <path d="M150 22v16" strokeWidth="1" />
        </g>
        <path d="M110 46v14M150 46v14" strokeWidth="1" strokeDasharray="3 3" />
      </g>
    </svg>
  );
}
