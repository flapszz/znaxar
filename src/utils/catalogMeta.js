// Категории, бренды и подборки нужны витрине сразу после товаров. Запрашиваем их
// одновременно с каталогом (при загрузке страницы), а не по цепочке после него.
let cached;

export function loadCatalogMeta() {
  if (!cached) {
    const get = (url) =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);
    cached = Promise.all([get("/api/collections"), get("/api/categories"), get("/api/brands")]);
  }
  return cached;
}
