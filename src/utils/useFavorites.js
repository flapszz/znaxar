import { useEffect, useState } from "react";

const STORAGE_KEY = "znaxar-favorites";

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// В отличие от корзины (sessionStorage, живёт одну вкладку), избранное сохраняем
// в localStorage — покупатель может вернуться к нему в другой день.
export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // недоступно (приватный режим и т.п.) — просто не сохраняем между визитами
    }
  }, [favorites]);

  const toggleFavorite = (sku) =>
    setFavorites((f) => (f.includes(sku) ? f.filter((s) => s !== sku) : [...f, sku]));

  return { favorites, toggleFavorite };
}
