// Запросы админки. Если сессия закончилась (сервер ответил 401), сообщаем об этом
// всей админке — она вернёт владельца на экран входа с понятным объяснением.
export const SESSION_EXPIRED_EVENT = "znaxar-session-expired";

export async function adminFetch(url, options = {}) {
  const res = await fetch(url, { credentials: "same-origin", ...options });
  if (res.status === 401) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  return res;
}
