import { INK } from "../constants/theme";

export function Plaque({ compact, dark }) {
  return (
    <p style={{ color: dark ? "rgba(251,248,243,.7)" : INK[60], fontSize: 12, lineHeight: 1.4, fontWeight: 300 }}>
      БАД. Не является лекарственным средством
    </p>
  );
}
