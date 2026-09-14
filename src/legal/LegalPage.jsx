import { useEffect } from "react";
import { C, INK } from "../constants/theme";
import { setSeo } from "../utils/seo";

export function LegalPage({ title, description, children }) {
  useEffect(() => {
    setSeo({ title, description, path: window.location.pathname });
  }, [title, description]);

  return (
    <div style={{ background: C.paper, minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-5 py-10">
        <a href="/" style={{ fontSize: 13, color: INK[60] }}>
          ← На витрину
        </a>
        <div className="mt-6" style={{ background: C.surface, borderRadius: 20, padding: "clamp(20px,4vw,36px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
