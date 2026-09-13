import { INK, OVERLINE } from "../constants/theme";

export function Field({ label, hint, children }) {
  return (
    <label className="block mb-4">
      <span className="block mb-1.5" style={OVERLINE}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block mt-1" style={{ fontSize: 12, color: INK[60] }}>
          {hint}
        </span>
      )}
    </label>
  );
}
