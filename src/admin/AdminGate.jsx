import { useEffect, useState } from "react";
import { Btn } from "../components/Btn";
import { C, HEAD, INK, inputStyle } from "../constants/theme";

export function AdminGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | in | out
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => setStatus(r.ok ? "in" : "out"))
      .catch(() => setStatus("out"));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (r.ok) {
        setStatus("in");
      } else {
        const data = await r.json().catch(() => ({}));
        setError(data.error || "Не удалось войти.");
      }
    } catch {
      setError("Сервер недоступен. Проверьте, что запущен API (npm run server).");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    setStatus("out");
    setUsername("");
    setPassword("");
  };

  if (status === "checking") {
    return <div className="max-w-5xl mx-auto px-5 py-16" style={{ color: INK[60], fontSize: 13 }}>Проверяем вход…</div>;
  }

  if (status === "out") {
    return (
      <div className="max-w-sm mx-auto px-5 py-16">
        <h2 style={{ ...HEAD, fontSize: 22, color: C.ink }}>Вход в админку</h2>
        <p className="mt-2 mb-5" style={{ fontSize: 13, color: INK[60] }}>
          Доступ только для владельца магазина.
        </p>
        <form onSubmit={submit}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Логин"
            autoFocus
            className="w-full px-4 py-2.5 mb-2"
            style={inputStyle}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Пароль"
            className="w-full px-4 py-2.5 mb-3"
            style={inputStyle}
          />
          {error && (
            <p className="mb-3" style={{ fontSize: 12, color: C.danger }}>
              {error}
            </p>
          )}
          <Btn full type="submit" disabled={submitting}>
            Войти
          </Btn>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-5xl mx-auto px-5 pt-3 flex justify-end">
        <button onClick={logout} style={{ fontSize: 11, color: INK[60] }} className="underline">
          Выйти
        </button>
      </div>
      {children}
    </div>
  );
}
