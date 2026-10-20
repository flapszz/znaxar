// Клиент API СДЭК v2. Всё общение со СДЭК — только здесь и только на сервере: ключи живут в
// переменных окружения и во фронтенд не попадают.
//
// Переменные: CDEK_CLIENT_ID, CDEK_CLIENT_SECRET (учётка интеграции), CDEK_MODE=test|prod
// (по умолчанию test), CDEK_API_URL (необязательно — свой адрес, например заглушка для проверки).
// Без CDEK_CLIENT_ID и CDEK_CLIENT_SECRET интеграция выключена, остальной сайт работает как раньше.
const URLS = { test: "https://api.edu.cdek.ru/v2", prod: "https://api.cdek.ru/v2" };

export function cdekConfig() {
  const mode = process.env.CDEK_MODE === "prod" ? "prod" : "test";
  return {
    enabled: Boolean(process.env.CDEK_CLIENT_ID && process.env.CDEK_CLIENT_SECRET),
    mode,
    baseUrl: (process.env.CDEK_API_URL || URLS[mode]).replace(/\/$/, ""),
  };
}

let token = { value: null, expiresAt: 0 };

async function getToken() {
  const { baseUrl } = cdekConfig();
  if (token.value && Date.now() < token.expiresAt - 60_000) return token.value;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.CDEK_CLIENT_ID,
    client_secret: process.env.CDEK_CLIENT_SECRET,
  });
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new CdekError("Не удалось войти в СДЭК: проверьте ключи интеграции.", res.status);
  }
  token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return token.value;
}

export class CdekError extends Error {
  constructor(message, status = 502, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Универсальный вызов. Возвращает разобранный JSON; при ошибке СДЭК бросает CdekError
// с понятным текстом (без ключей и без персональных данных в сообщении).
export async function cdek(method, path, { query, body } = {}) {
  const { enabled, baseUrl } = cdekConfig();
  if (!enabled) throw new CdekError("Интеграция со СДЭК пока не подключена.", 503);
  const url = new URL(baseUrl + path);
  for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== "") url.searchParams.set(k, v);

  const call = async (retry) => {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 401 && retry) {
      token = { value: null, expiresAt: 0 }; // токен протух раньше срока — берём новый и повторяем один раз
      return call(false);
    }
    return res;
  };

  let res;
  try {
    res = await call(true);
  } catch (e) {
    if (e instanceof CdekError) throw e;
    throw new CdekError("СДЭК сейчас не отвечает. Попробуйте ещё раз через минуту.", 504);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const first = data?.requests?.[0]?.errors?.[0] || data?.errors?.[0];
    throw new CdekError(first?.message || `СДЭК вернул ошибку ${res.status}.`, res.status === 400 ? 422 : 502, data);
  }
  return data;
}
