/* Раньше это был источник истины по цене/остатку (только для чтения — см. старую
   версию CLAUDE.md). Теперь цена и остаток редактируются прямо в админке и живут
   в таблице stock; этот файл используется только один раз — как сид для
   server/seed-stock.js — и не перезаписывает то, что уже поменяли в БД. */
export const STOCK = [
  { sku: "BAD-0142", stockName: "Омега-3 1000 мг, 60 капс.", price: 1290, stock: 84 },
  { sku: "BAD-0207", stockName: "Витамин D3 2000 МЕ, 90 капс.", price: 890, stock: 12 },
  { sku: "BAD-0311", stockName: "Магний + B6, 60 таб.", price: 740, stock: 0 },
  { sku: "BAD-0355", stockName: "Цинк пиколинат 25 мг, 60 капс.", price: 620, stock: 41 },
  { sku: "BAD-0418", stockName: "Коллаген морской, 120 г", price: 1980, stock: 7 },
  { sku: "BAD-0490", stockName: "Мелатонин 3 мг, 30 таб.", price: 540, stock: 23 },
  { sku: "BAD-0512", stockName: "Витамин C 1000 мг, 60 таб.", price: 890, stock: 45 },
  { sku: "BAD-0533", stockName: "Кальций + Витамин D3, 90 таб.", price: 780, stock: 30 },
  { sku: "BAD-0561", stockName: "Рыбий жир Омега-3 90%, 60 капс.", price: 2100, stock: 15 },
  { sku: "BAD-0602", stockName: "Магний хелат 200 мг, 60 капс.", price: 650, stock: 60 },
  { sku: "BAD-0645", stockName: "Коллаген + гиалуроновая кислота, 90 капс.", price: 1450, stock: 20 },
  { sku: "BAD-0671", stockName: "Валерианы экстракт, 50 таб.", price: 320, stock: 80 },
  { sku: "BAD-0699", stockName: "Пассифлора и мелисса, 60 капс.", price: 540, stock: 25 },
];
