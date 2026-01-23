# Конвертация узбекского латинского алфавита в кириллицу

## Описание

Система автоматической конвертации текста с узбекского латинского алфавита в кириллицу при переключении языка UI.

## Принцип работы

1. **В БД (MongoDB)** храним только `name` (узбекский латиницей)
2. **В UI** есть переключатель языка: `latin` / `cyrillic`
3. **При выводе текста**:
   - `latin`: показываем как есть (`name`)
   - `cyrillic`: показываем `uzLatToCyr(name)`

## Использование

### В компонентах с хуком useLanguage

```tsx
import { useLanguage } from '../context/LanguageContext';

function ProductCard({ product }) {
  const { t } = useLanguage();
  
  return (
    <div>
      {/* Автоматическая конвертация через t() */}
      <h3>{t(product.name)}</h3>
    </div>
  );
}
```

### С хуком useProductName

```tsx
import { useProductName } from '../hooks/useProductName';

function ProductList({ products }) {
  const { convertName } = useProductName();
  
  return (
    <ul>
      {products.map(product => (
        <li key={product._id}>
          {convertName(product.name)}
        </li>
      ))}
    </ul>
  );
}
```

### Прямое использование функции

```tsx
import { uzLatToCyr } from '../utils/uzLatToCyr';

const cyrillicName = uzLatToCyr("o'qituvchi"); // "ўқитувчи"
```

## Правила конвертации

### Двухбуквенные комбинации
- `sh` → `ш`
- `ch` → `ч`
- `ng` → `нг`
- `yo` → `ё`
- `ya` → `я`
- `yu` → `ю`
- `ye` → `е`

### Специальные символы
- `o'` / `oʻ` / `o'` → `ў`
- `g'` / `gʻ` / `g'` → `ғ`

### Специфичные узбекские буквы
- `h` → `ҳ`
- `q` → `қ`
- `x` → `х`

### Примеры

| Латиница | Кириллица |
|----------|-----------|
| o'qituvchi | ўқитувчи |
| g'isht | ғишт |
| shahar | шаҳар |
| chaqaloq | чақалоқ |
| yo'l | йўл |
| yangi | янги |
| qo'shish | қўшиш |
| O'zbekiston | Ўзбекистон |

## Тестирование

Запустите unit-тесты:

```bash
npm test uzLatToCyr.test.ts
```

Тесты покрывают:
- Базовые слова (15+ примеров)
- Специальные комбинации (sh, ch, ng, yo, ya, yu, ye)
- Слова с апострофами (o', g')
- Заглавные буквы
- Сложные слова
- Альтернативные апострофы (', ʻ, ')
- Пустые строки и специальные случаи

## Важные замечания

1. **Не меняем существующие документы в БД** - конвертация происходит только при отображении
2. **Поддержка разных апострофов** - система распознает `'`, `ʻ`, `'`
3. **Сохранение регистра** - заглавные буквы конвертируются в заглавные
4. **Статический словарь для UI** - элементы интерфейса используют предопределенный словарь `translations.ts`
5. **Автоматическая конвертация для контента** - названия товаров и динамический контент конвертируются автоматически

## Опциональное расширение: поиск по кириллице

Если понадобится поиск по кириллице на сервере, можно добавить поле `nameUzCyr`:

### На сервере (при создании/обновлении товара):

```javascript
const { uzLatToCyr } = require('../utils/uzLatToCyr');

// При создании товара
const product = new Product({
  name: req.body.name, // латиница
  nameUzCyr: uzLatToCyr(req.body.name), // кириллица для поиска
  // ... другие поля
});
```

### Поиск с поддержкой обоих скриптов:

```javascript
const searchQuery = req.query.search;
const products = await Product.find({
  $or: [
    { name: { $regex: searchQuery, $options: 'i' } },
    { nameUzCyr: { $regex: searchQuery, $options: 'i' } }
  ]
});
```

## Структура файлов

```
client/src/
├── utils/
│   ├── uzLatToCyr.ts           # Основная функция конвертации
│   ├── uzLatToCyr.test.ts      # Unit-тесты
│   └── README_UZ_CONVERSION.md # Эта документация
├── hooks/
│   └── useProductName.ts       # Хук для конвертации в компонентах
└── context/
    └── LanguageContext.tsx     # Контекст с интеграцией конвертации
```
