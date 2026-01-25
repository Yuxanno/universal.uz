# 🚀 Руководство по миграции на новую дизайн-систему

## Быстрый старт

### 1. Подключите новый CSS

```tsx
// main.tsx
import './design-system.css'; // Новый файл
```

### 2. Используйте новые компоненты

```tsx
// Старый способ
import Button from './components/ui/Button';

// Новый способ
import Button from './components/ui/Button.modern';
```

---

## Миграция компонентов

### Кнопки

**Было:**
```tsx
<button className="btn-primary">
  Сохранить
</button>
```

**Стало:**
```tsx
<Button variant="primary">
  Сохранить
</Button>
```

**Изменения:**
- `btn-success` → `btn-primary` (теперь всё красное)
- `btn-warning` → `btn-primary`
- Добавлен `loading` prop
- Добавлен `icon` prop
- Добавлен `fullWidth` prop

### Карточки

**Было:**
```tsx
<div className="card">
  <h3>Заголовок</h3>
  <p>Контент</p>
</div>
```

**Стало:**
```tsx
<Card>
  <CardHeader title="Заголовок" />
  <CardBody>
    <p>Контент</p>
  </CardBody>
</Card>
```

**Изменения:**
- Структурированные секции
- `hover` prop для интерактивных карточек
- Улучшенные тени и скругления

### Инпуты

**Было:**
```tsx
<input className="input" placeholder="Текст" />
```

**Стало:**
```tsx
<Input 
  label="Название"
  placeholder="Текст"
  error="Ошибка валидации"
  icon={<Search />}
/>
```

**Изменения:**
- Встроенные label и error
- Поддержка иконок
- Красный focus ring
- Улучшенная доступность

### Модальные окна

**Было:**
```tsx
<div className="modal-overlay">
  <div className="modal">
    <h2>Заголовок</h2>
    <div>Контент</div>
  </div>
</div>
```

**Стало:**
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Заголовок"
  footer={<Button>Действие</Button>}
>
  Контент
</Modal>
```

**Изменения:**
- Автоматический portal
- ESC для закрытия
- Блокировка скролла
- Улучшенные анимации

---

## Миграция цветов

### Основные изменения

```css
/* Было */
bg-primary-600    /* Разные цвета */
bg-success-600
bg-warning-500

/* Стало */
bg-red-600        /* Всё красное! */
bg-red-600
bg-red-600
```

### Нейтральные цвета

```css
/* Было */
bg-gray-50
text-gray-900
border-gray-200

/* Стало */
bg-neutral-50     /* Новая шкала */
text-neutral-900
border-neutral-200
```

### Таблица замены

| Старый класс | Новый класс | Примечание |
|-------------|-------------|------------|
| `bg-primary-600` | `bg-red-600` | Основной красный |
| `bg-success-600` | `bg-red-600` | Теперь красный |
| `bg-warning-500` | `bg-red-600` | Теперь красный |
| `bg-gray-*` | `bg-neutral-*` | Новая шкала |
| `text-gray-*` | `text-neutral-*` | Новая шкала |
| `border-gray-*` | `border-neutral-*` | Новая шкала |

---

## Миграция скруглений

```css
/* Было */
rounded-lg: 12px

/* Стало */
rounded-lg: 16px   /* Больше для премиального вида */
rounded-xl: 20px   /* Для карточек */
rounded-2xl: 24px  /* Для модалок */
```

---

## Миграция теней

```css
/* Было */
shadow-md: 0 4px 12px rgba(0,0,0,0.08)

/* Стало */
shadow-md: 0 4px 16px rgba(0,0,0,0.06)  /* Мягче */
```

**Правило:** Используйте более мягкие тени для современного вида.

---

## Миграция анимаций

### Было (медленно)
```css
transition: all 300ms ease-in-out;
animation: fadeIn 150ms ease-out;
```

### Стало (быстро)
```css
transition: all 200ms ease-out;
animation: fade-in 200ms ease-out;
```

**Правило:** Все анимации 200-300ms максимум.

---

## Пошаговая миграция страницы

### Шаг 1: Импорты

```tsx
// Добавьте новые импорты
import Button from '../components/ui/Button.modern';
import { Card, CardHeader, CardBody } from '../components/ui/Card.modern';
import Input from '../components/ui/Input.modern';
```

### Шаг 2: Замените цвета

```tsx
// Найдите и замените
bg-primary-600 → bg-red-600
bg-success-600 → bg-red-600
bg-gray-* → bg-neutral-*
text-gray-* → text-neutral-*
```

### Шаг 3: Обновите компоненты

```tsx
// Старый Button
<button className="btn-primary">Сохранить</button>

// Новый Button
<Button variant="primary">Сохранить</Button>
```

### Шаг 4: Проверьте доступность

```tsx
// Добавьте aria-labels
<Button aria-label="Закрыть">
  <X />
</Button>

// Добавьте focus states
<div className="focus-visible:ring-2 focus-visible:ring-red-500">
```

### Шаг 5: Оптимизируйте производительность

```tsx
// Используйте lazy loading
const Component = lazy(() => import('./Component'));

// Добавьте debounce для поиска
const debouncedSearch = useDebounce(searchQuery, 300);
```

---

## Чеклист миграции

- [ ] Подключён `design-system.css`
- [ ] Заменены все `Button` на `Button.modern`
- [ ] Заменены все `Card` на `Card.modern`
- [ ] Заменены все `Input` на `Input.modern`
- [ ] Заменены все `Modal` на `Modal.modern`
- [ ] Обновлены цвета (`gray` → `neutral`)
- [ ] Обновлены цвета (`primary/success/warning` → `red`)
- [ ] Проверена доступность (WCAG AA)
- [ ] Проверена производительность (Lighthouse 95+)
- [ ] Протестировано на мобильных устройствах
- [ ] Протестирована клавиатурная навигация

---

## Частые проблемы

### Проблема: Кнопки слишком яркие

**Решение:** Используйте `btn-secondary` для менее важных действий:
```tsx
<Button variant="secondary">Отмена</Button>
```

### Проблема: Слишком много красного

**Решение:** Используйте нейтральные цвета для фона:
```tsx
<div className="bg-neutral-50">  {/* Не bg-red-50 */}
```

### Проблема: Медленные анимации

**Решение:** Проверьте, что используете новые классы:
```tsx
className="transition-all duration-200"  {/* Не duration-300 */}
```

### Проблема: Плохой контраст

**Решение:** Используйте тёмные цвета для текста:
```tsx
<p className="text-neutral-900">  {/* Не text-neutral-600 */}
```

---

## Примеры до/после

### Dashboard Card

**До:**
```tsx
<div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
  <h3 className="text-lg font-semibold text-gray-900">Продажи</h3>
  <p className="text-3xl font-bold text-gray-900">1,234</p>
  <span className="text-sm text-green-600">+12%</span>
</div>
```

**После:**
```tsx
<div className="stat-card">
  <div className="stat-icon">
    <ShoppingCart className="w-6 h-6" />
  </div>
  <div className="stat-value">1,234</div>
  <div className="stat-label">Продажи</div>
  <Badge variant="primary">+12%</Badge>
</div>
```

### Form

**До:**
```tsx
<form>
  <div>
    <label>Email</label>
    <input type="email" className="input" />
  </div>
  <button className="btn-primary">Отправить</button>
</form>
```

**После:**
```tsx
<form className="space-y-4">
  <Input
    label="Email"
    type="email"
    icon={<Mail className="w-4 h-4" />}
  />
  <Button variant="primary" fullWidth>
    Отправить
  </Button>
</form>
```

---

## Поддержка

Если возникли вопросы:
1. Проверьте `DESIGN_SYSTEM.md`
2. Посмотрите примеры в `pages/examples/`
3. Изучите компоненты в `components/ui/*.modern.tsx`

---

**Удачной миграции! 🚀**
