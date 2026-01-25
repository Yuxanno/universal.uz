# 🎨 Modern Design System 2025

## Философия дизайна

**Минимализм • Премиум • Скорость**

Наша дизайн-система построена на трёх принципах:
- **Белый фон** — чистота и простор
- **Красный акцент** — энергия и действие
- **Чёрный текст** — контраст и читаемость

---

## 🎨 Цветовая палитра

### Основные цвета

```css
/* Белый — основной фон */
background: #ffffff

/* Красный — CTA и акценты */
primary: #dc2626 (red-600)
hover: #b91c1c (red-700)
active: #991b1b (red-800)

/* Чёрный — текст и структура */
text: #171717 (neutral-900)
borders: #262626 (neutral-800)
```

### Нейтральная шкала (White → Black)

```
neutral-0:   #ffffff  Pure white
neutral-50:  #fafafa  Off-white
neutral-100: #f5f5f5  Light gray
neutral-200: #e5e5e5  Borders
neutral-300: #d4d4d4  Dividers
neutral-400: #a3a3a3  Disabled
neutral-500: #737373  Secondary text
neutral-600: #525252  Body text
neutral-700: #404040  Headings
neutral-800: #262626  Strong text
neutral-900: #171717  Primary text
neutral-950: #0a0a0a  Pure black
```

### Вторичные акценты (только для статусов)

Используйте **красный** для всех статусов:
- ✅ Success → Red-600
- ⚠️ Warning → Red-500
- ❌ Error → Red-600
- ℹ️ Info → Neutral-600

---

## 📐 Типографика

### Шрифты

```css
/* Primary */
font-family: 'Inter var', 'Inter', -apple-system, sans-serif;

/* Display (заголовки) */
font-family: 'SF Pro Display', 'Inter var', sans-serif;

/* Mono (код) */
font-family: 'SF Mono', 'JetBrains Mono', monospace;
```

### Размеры

```
text-xs:   12px  Мелкий текст, метки
text-sm:   14px  Основной UI текст
text-base: 16px  Основной контент
text-lg:   18px  Подзаголовки
text-xl:   20px  Заголовки карточек
text-2xl:  24px  Заголовки секций
text-3xl:  30px  Заголовки страниц
text-4xl:  36px  Hero заголовки
```

### Веса

```
font-normal:    400  Обычный текст
font-medium:    500  UI элементы
font-semibold:  600  Подзаголовки
font-bold:      700  Заголовки
font-extrabold: 800  Hero текст
```

---

## 🔲 Скругления

**Диапазон: 12-20px** для премиального вида

```
rounded-lg:  16px  Кнопки, инпуты
rounded-xl:  20px  Карточки
rounded-2xl: 24px  Модальные окна
rounded-full: 9999px  Badges, аватары
```

---

## 💫 Тени

**Мягкие и минимальные**

```css
/* Small - Кнопки */
shadow-sm: 0 1px 3px rgba(0,0,0,0.04)

/* Default - Карточки */
shadow: 0 2px 8px rgba(0,0,0,0.05)

/* Medium - Hover состояния */
shadow-md: 0 4px 16px rgba(0,0,0,0.06)

/* Large - Модальные окна */
shadow-lg: 0 8px 24px rgba(0,0,0,0.08)

/* XL - Выпадающие меню */
shadow-xl: 0 16px 48px rgba(0,0,0,0.1)
```

---

## 🔘 Компоненты

### Кнопки

#### Primary (Красная CTA)
```tsx
<button className="btn-primary">
  Сохранить
</button>
```
- Фон: Red-600
- Hover: Red-700 + поднятие на 2px
- Active: Red-800 + возврат
- Тень: Мягкая

#### Secondary (Чёрный outline)
```tsx
<button className="btn-secondary">
  Отмена
</button>
```
- Фон: White
- Граница: Black 2px
- Hover: Black фон + White текст

#### Ghost (Минимальная)
```tsx
<button className="btn-ghost">
  Подробнее
</button>
```
- Фон: Transparent
- Hover: Neutral-100

### Карточки

```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Заголовок</h3>
  </div>
  <div className="card-body">
    Контент
  </div>
  <div className="card-footer">
    <button className="btn-primary">Действие</button>
  </div>
</div>
```

**Стиль:**
- Фон: White
- Граница: Neutral-200 (2px)
- Скругление: 20px
- Тень: Мягкая
- Hover: Поднятие + увеличение тени

### Инпуты

```tsx
<input className="input" placeholder="Введите текст" />
```

**Стиль:**
- Фон: White
- Граница: Neutral-300 (2px)
- Focus: Red-500 граница + Red ring
- Скругление: 16px
- Padding: 12px 16px

### Модальные окна

```tsx
<Modal isOpen={true} title="Заголовок">
  Контент
</Modal>
```

**Стиль:**
- Overlay: Black/50%
- Фон: White
- Скругление: 24px
- Тень: XL
- Анимация: Scale-in (200ms)

### Badges

```tsx
<span className="badge-primary">Новый</span>
```

**Варианты:**
- Primary: Red-100 фон, Red-700 текст
- Secondary: Neutral-100 фон
- Outline: Transparent + граница

---

## ✨ Анимации

**Быстрые и плавные (200-300ms)**

```css
/* Fade In */
animation: fade-in 200ms ease-out;

/* Scale In */
animation: scale-in 200ms ease-out;

/* Slide In */
animation: slide-in-right 300ms ease-out;

/* Hover эффекты */
transition: all 200ms ease-out;
```

**Правила:**
- Используйте `ease-out` для входа
- Используйте `ease-in` для выхода
- Максимум 300ms для UI
- Избегайте `backdrop-blur` (медленно!)

---

## 📱 Адаптивность

### Breakpoints

```
xs:  475px   Маленькие телефоны
sm:  640px   Телефоны
md:  768px   Планшеты
lg:  1024px  Ноутбуки
xl:  1280px  Десктопы
2xl: 1536px  Большие экраны
```

### Mobile-First подход

```tsx
// Базовые стили для мобильных
<div className="p-4 text-sm">
  
// Адаптация для больших экранов
<div className="p-4 lg:p-6 text-sm lg:text-base">
```

### Сетки

```tsx
// Адаптивная сетка
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## ♿ Доступность

### Контрастность

Все цвета соответствуют **WCAG AA**:
- Текст на белом: Neutral-900 (21:1)
- Красные кнопки: Red-600 (4.5:1)
- Вторичный текст: Neutral-600 (7:1)

### Клавиатурная навигация

```tsx
// Focus ring
className="focus-visible:ring-2 focus-visible:ring-red-500"

// Tab index
tabIndex={0}

// ARIA labels
aria-label="Закрыть"
```

### Размеры кликабельных зон

Минимум **44x44px** для touch:
```tsx
<button className="min-h-[44px] min-w-[44px]">
```

---

## ⚡ Производительность

### CSS оптимизации

```css
/* Используйте contain для изоляции */
.card {
  contain: layout style;
}

/* Оптимизируйте изображения */
img {
  content-visibility: auto;
}

/* Избегайте дорогих эффектов */
/* ❌ backdrop-blur */
/* ❌ box-shadow с большим blur */
/* ✅ Простые тени */
```

### Lazy Loading

```tsx
// Изображения
<img loading="lazy" />

// Компоненты
const Component = lazy(() => import('./Component'));
```

### Минимизация JS

- Используйте CSS анимации вместо JS
- Debounce для поиска (300ms)
- Виртуализация для длинных списков

---

## 🎯 Примеры использования

### Dashboard Card

```tsx
<div className="stat-card">
  <div className="stat-icon">
    <ShoppingCart className="w-6 h-6" />
  </div>
  <div className="stat-value">1,234</div>
  <div className="stat-label">Продажи</div>
  <div className="stat-change-positive">+12%</div>
</div>
```

### Form

```tsx
<form className="space-y-4">
  <Input
    label="Email"
    type="email"
    placeholder="your@email.com"
  />
  <Input
    label="Пароль"
    type="password"
    error="Неверный пароль"
  />
  <Button variant="primary" fullWidth>
    Войти
  </Button>
</form>
```

### Table

```tsx
<div className="table-container">
  <table className="table">
    <thead className="table-header">
      <tr>
        <th className="table-header-cell">Название</th>
        <th className="table-header-cell">Цена</th>
      </tr>
    </thead>
    <tbody>
      <tr className="table-row">
        <td className="table-cell">Товар 1</td>
        <td className="table-cell">1000 сум</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 📦 Установка

### 1. Подключите новый CSS

```tsx
// main.tsx
import './design-system.css';
```

### 2. Используйте новые компоненты

```tsx
import Button from './components/ui/Button.modern';
import { Card } from './components/ui/Card.modern';
import Input from './components/ui/Input.modern';
import Modal from './components/ui/Modal.modern';
```

### 3. Применяйте utility классы

```tsx
<div className="card">
  <h2 className="text-xl font-semibold text-neutral-900">
    Заголовок
  </h2>
  <p className="text-sm text-neutral-600">
    Описание
  </p>
</div>
```

---

## 🚀 Lighthouse Score

Целевые показатели:
- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100

---

## 📚 Ресурсы

- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev Performance](https://web.dev/performance/)

---

**Создано с ❤️ для Universal.uz**
