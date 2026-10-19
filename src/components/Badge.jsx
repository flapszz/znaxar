import { C } from "../constants/theme";

const VARIANTS = {
  acid: { background: C.acid, color: C.ink },
  violet: { background: C.violet, color: C.surface },
  neutral: { background: "color-mix(in srgb, var(--ink, #002752) 8%, transparent)", color: C.ink },
  danger: { background: "#FDE3DC", color: C.danger },
};

export function Badge({ children, variant = "neutral" }) {
  const style = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1"
      style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", ...style }}
    >
      {children}
    </span>
  );
}
