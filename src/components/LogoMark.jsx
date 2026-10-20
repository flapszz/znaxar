// Знак «Знахарь» — угловатый лист из прямых граней с жилками (чертёжная линия).
// Цвет — цвет текста вокруг (currentColor) или явно через color.
export function LogoMark({ size = 24, color = "currentColor", strokeWidth = 4 }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M10 54L18 26 40 10 56 8 54 28 38 50z" />
      <path d="M10 54L52 12M24 41l12-2M32 31l12-2" strokeWidth={strokeWidth * 0.85} />
    </svg>
  );
}
