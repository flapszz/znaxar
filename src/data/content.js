/* Контент витрины теперь хранится в БД (см. server/routes/products.js).
   Здесь остаётся только форма «пустой» карточки — для нового товара до сохранения. */
export const EMPTY_CONTENT = {
  title: "",
  category: "",
  description: "",
  usage: "",
  sgr: "",
  composition: [],
  published: false,
};
