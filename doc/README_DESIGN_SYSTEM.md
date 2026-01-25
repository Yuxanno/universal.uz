# 🎨 Современная дизайн-система — Быстрый старт

## ✨ Что нового?

Создана полностью новая дизайн-система с фокусом на:
- **Белый фон** — чистота и простор
- **Красный акцент** — энергия и действие  
- **Чёрный текст** — контраст и читаемость
- **Премиальный вид** — скругления 12-20px, мягкие тени
- **Максимальная скорость** — анимации 200ms, оптимизированный CSS

---

## 🚀 Быстрый старт (5 минут)

### 1. Подключите новый CSS

```tsx
// src/main.tsx
import './design-system.css';
```

### 2. Используйте новые компоненты

```tsx
import { Button, Card, Input, Modal } from './components/ui/index.modern';

function App() {
  return (
    <Card>
      <Input label="Email" placeholder="your@email.com" />
      <Button variant="primary">Отправить</Button>
    </Card>
  );
}
```

### 3. Готово! 🎉

---

## 📦 Что включено?

### Компоненты

✅ **Button** — 4 варианта (primary, secondary, ghost, danger)  
✅ **Card** — с header, body, footer  
✅ **Input** — с label, error, icon  
✅ **Modal** — с анимациями и accessibility  
✅ **Badge** — 3 варианта  
✅ **Toast** — уведомления  
✅ **Skeleton** — loading states  
✅ **EmptyState** — пустые состояния  

### Стили

✅ **Tailwind config** — обновлённые цвета и утилиты  
✅ **design-system.css** — готовые классы  
✅ **Анимации** — плавные и быстрые  
✅ **Адаптивность** — mobile-first  
✅ **Accessibility** — WCAG AA  

### Документация

✅ **DESIGN_SYSTEM.md** — полное руководство  
✅ **MIGRATION_GUIDE.md** — пошаговая миграция  
✅ **Примеры** — готовые страницы в `pages/examples/`  

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
  <Badge variant="primary">+12%</Badge>
</div>
```

### Form

```tsx
<form className="space-y-4">
  <Input
    label="Email"
    type="email"
    icon={<Mail className="w-4 h-4" />}
    error="Неверный email"
  />
  <Button variant="primary" fullWidth loading>
    Отправить
  </Button>
</form>
```

### Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Подтверждение"
  footer={
    <>
      <Button variant="ghost" onClick={onClose}>Отмена</Button>
      <Button variant="primary" onClick={onConfirm}>Подтвердить</Button>
    </>
  }
>
  Вы уверены?
</Modal>
```

---

## 🎨 Цветовая палитра

### Основные цвета

```
Белый:   #ffffff  (фон)
Красный: #dc2626  (CTA, акценты)
Чёрный:  #171717  (текст)
```

### Нейтральная шкала

```
neutral-50:  #fafafa  (светлый фон)
neutral-200: #e5e5e5  (границы)
neutral-600: #525252  (вторичный текст)
neutral-900: #171717  (основной текст)
```

---

## 📱 Адаптивность

Все компоненты работают на всех устройствах:

```tsx
// Mobile-first подход
<div className="p-4 lg:p-6">
  <h1 className="text-xl lg:text-2xl">Заголовок</h1>
</div>

// Адаптивная сетка
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## ⚡ Производительность

### Целевые показатели Lighthouse

- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100

### Оптимизации

✅ Минимальные тени (без blur)  
✅ CSS анимации (не JS)  
✅ Быстрые transitions (200ms)  
✅ Lazy loading  
✅ Оптимизированные изображения  

---

## ♿ Доступность

Все компоненты соответствуют **WCAG AA**:

✅ Контрастность 4.5:1+  
✅ Клавиатурная навигация  
✅ ARIA labels  
✅ Focus states  
✅ Большие кликабельные зоны (44x44px)  

---

## 📚 Документация

### Полное руководство
👉 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

### Миграция
👉 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### Примеры
👉 `src/pages/examples/ModernDashboard.example.tsx`  
👉 `src/pages/examples/ModernForm.example.tsx`

---

## 🎯 Следующие шаги

1. **Изучите документацию** — `DESIGN_SYSTEM.md`
2. **Посмотрите примеры** — `pages/examples/`
3. **Начните миграцию** — `MIGRATION_GUIDE.md`
4. **Используйте новые компоненты** — `components/ui/*.modern.tsx`

---

## 💡 Советы

### ✅ Делайте

- Используйте `bg-white` для основного фона
- Используйте `bg-red-600` для CTA кнопок
- Используйте `text-neutral-900` для основного текста
- Используйте `rounded-xl` для карточек (20px)
- Используйте мягкие тени (`shadow-sm`, `shadow-md`)

### ❌ Не делайте

- Не используйте `backdrop-blur` (медленно!)
- Не используйте анимации > 300ms
- Не используйте слишком яркие цвета
- Не используйте мелкие скругления (< 12px)
- Не используйте сильные тени

---

## 🤝 Поддержка

Вопросы? Проблемы?

1. Проверьте `DESIGN_SYSTEM.md`
2. Посмотрите `MIGRATION_GUIDE.md`
3. Изучите примеры в `pages/examples/`
4. Проверьте компоненты в `components/ui/*.modern.tsx`

---

## 📊 Структура файлов

```
client/
├── src/
│   ├── design-system.css          # Новая дизайн-система
│   ├── components/
│   │   └── ui/
│   │       ├── Button.modern.tsx
│   │       ├── Card.modern.tsx
│   │       ├── Input.modern.tsx
│   │       ├── Modal.modern.tsx
│   │       ├── Badge.modern.tsx
│   │       ├── Toast.modern.tsx
│   │       ├── Skeleton.modern.tsx
│   │       ├── EmptyState.modern.tsx
│   │       └── index.modern.ts    # Централизованный экспорт
│   └── pages/
│       └── examples/
│           ├── ModernDashboard.example.tsx
│           └── ModernForm.example.tsx
├── tailwind.config.js             # Обновлённая конфигурация
├── DESIGN_SYSTEM.md               # Полное руководство
├── MIGRATION_GUIDE.md             # Руководство по миграции
└── README_DESIGN_SYSTEM.md        # Этот файл
```

---

**Создано с ❤️ для Universal.uz**

**Версия:** 1.0.0  
**Дата:** 2025  
**Лицензия:** MIT
