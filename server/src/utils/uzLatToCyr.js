/**
 * Конвертер узбекского латинского алфавита в кириллицу (серверная версия)
 * Используется для создания поля nameUzCyr для поиска
 */

/**
 * Конвертирует текст с узбекского латинского алфавита в кириллицу
 * @param {string} text - текст на узбекском латинском алфавите
 * @returns {string} текст на узбекском кириллическом алфавите
 */
function uzLatToCyr(text) {
  if (!text) return text;
  
  let result = text;
  
  // Специальные символы с апострофом (обрабатываем первыми)
  result = result.replace(/o['ʻ']/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ў' : 'ў');
  result = result.replace(/g['ʻ']/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ғ' : 'ғ');
  
  // Двухбуквенные комбинации
  result = result.replace(/sh/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ш' : 'ш');
  result = result.replace(/ch/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ч' : 'ч');
  result = result.replace(/ng/gi, (match) => match[0] === match[0].toUpperCase() ? 'Нг' : 'нг');
  result = result.replace(/yo/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ё' : 'ё');
  result = result.replace(/ya/gi, (match) => match[0] === match[0].toUpperCase() ? 'Я' : 'я');
  result = result.replace(/yu/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ю' : 'ю');
  result = result.replace(/ye/gi, (match) => match[0] === match[0].toUpperCase() ? 'Е' : 'е');
  
  // Однобуквенные соответствия
  result = result.replace(/a/gi, (match) => match === 'A' ? 'А' : 'а');
  result = result.replace(/b/gi, (match) => match === 'B' ? 'Б' : 'б');
  result = result.replace(/d/gi, (match) => match === 'D' ? 'Д' : 'д');
  result = result.replace(/e/gi, (match) => match === 'E' ? 'Е' : 'е');
  result = result.replace(/f/gi, (match) => match === 'F' ? 'Ф' : 'ф');
  result = result.replace(/g/gi, (match) => match === 'G' ? 'Г' : 'г');
  result = result.replace(/h/gi, (match) => match === 'H' ? 'Ҳ' : 'ҳ');
  result = result.replace(/i/gi, (match) => match === 'I' ? 'И' : 'и');
  result = result.replace(/j/gi, (match) => match === 'J' ? 'Ж' : 'ж');
  result = result.replace(/k/gi, (match) => match === 'K' ? 'К' : 'к');
  result = result.replace(/l/gi, (match) => match === 'L' ? 'Л' : 'л');
  result = result.replace(/m/gi, (match) => match === 'M' ? 'М' : 'м');
  result = result.replace(/n/gi, (match) => match === 'N' ? 'Н' : 'н');
  result = result.replace(/o/gi, (match) => match === 'O' ? 'О' : 'о');
  result = result.replace(/p/gi, (match) => match === 'P' ? 'П' : 'п');
  result = result.replace(/q/gi, (match) => match === 'Q' ? 'Қ' : 'қ');
  result = result.replace(/r/gi, (match) => match === 'R' ? 'Р' : 'р');
  result = result.replace(/s/gi, (match) => match === 'S' ? 'С' : 'с');
  result = result.replace(/t/gi, (match) => match === 'T' ? 'Т' : 'т');
  result = result.replace(/u/gi, (match) => match === 'U' ? 'У' : 'у');
  result = result.replace(/v/gi, (match) => match === 'V' ? 'В' : 'в');
  result = result.replace(/x/gi, (match) => match === 'X' ? 'Х' : 'х');
  result = result.replace(/y/gi, (match) => match === 'Y' ? 'Й' : 'й');
  result = result.replace(/z/gi, (match) => match === 'Z' ? 'З' : 'з');
  
  // Удаляем оставшиеся апострофы
  result = result.replace(/['ʻ']/g, '');
  
  return result;
}

/**
 * Пример использования в роутах
 * 
 * const { uzLatToCyr } = require('../utils/uzLatToCyr');
 * 
 * // При создании товара
 * router.post('/products', async (req, res) => {
 *   const product = new Product({
 *     name: req.body.name,
 *     nameUzCyr: uzLatToCyr(req.body.name),
 *     // ... другие поля
 *   });
 *   await product.save();
 *   res.json(product);
 * });
 * 
 * // При обновлении товара
 * router.put('/products/:id', async (req, res) => {
 *   const updates = {
 *     ...req.body,
 *     nameUzCyr: req.body.name ? uzLatToCyr(req.body.name) : undefined
 *   };
 *   const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
 *   res.json(product);
 * });
 * 
 * // Поиск по обоим полям
 * router.get('/products/search', async (req, res) => {
 *   const { q } = req.query;
 *   const products = await Product.find({
 *     $or: [
 *       { name: { $regex: q, $options: 'i' } },
 *       { nameUzCyr: { $regex: q, $options: 'i' } }
 *     ]
 *   });
 *   res.json(products);
 * });
 */

module.exports = { uzLatToCyr };
