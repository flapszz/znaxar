import { C, INK, RADIUS } from "../constants/theme";

const VARIANT_CLASS = { solid: "btn-solid", acid: "btn-acid", outline: "btn-outline", ghost: "btn-outline" };

export function Btn({ children, onClick, variant = "solid", disabled, full, type = "button" }) {
  let style;
  if (variant === "acid") {
    style = { background: disabled ? INK[12] : C.acid, color: disabled ? INK[45] : C.ink };
  } else if (variant === "outline" || variant === "ghost") {
    style = { background: "transparent", color: disabled ? INK[45] : C.ink, border: `1.5px solid ${disabled ? INK[12] : INK[18]}` };
  } else {
    style = { background: disabled ? INK[12] : C.violet, color: disabled ? INK[45] : C.surface };
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`transition-all duration-150 ${VARIANT_CLASS[variant] || "btn-solid"} ${full ? "w-full" : ""} ${
        disabled ? "cursor-not-allowed" : ""
      }`}
      style={{ ...style, borderRadius: RADIUS.pill, padding: "13px 22px", fontWeight: 600, fontSize: 14, border: style.border || "none" }}
    >
      {children}
    </button>
  );
}
