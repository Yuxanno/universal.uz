# 🚀 Быстрый старт для Windows

## Применение нового дизайна на Windows

---

## Шаг 1: Добавьте дизайн-систему

Откройте файл `client/src/main.tsx` и добавьте эту строку после других импортов:

```tsx
import './styles/design-system.css';
```

Должно получиться так:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/modal-fix.css'
import './styles/design-system.css'  // ← ДОБАВЬТЕ ЭТУ СТРОКУ

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## Шаг 2: Переименуйте файлы (Windows команды)

Откройте PowerShell или CMD в папке проекта и выполните:

### Для PowerShell:

```powershell
# Переименовать Login
Rename-Item -Path "client\src\pages\Login.tsx" -NewName "Login.old.tsx"
Rename-Item -Path "client\src\pages\Login.professional.tsx" -NewName "Login.tsx"

# Переименовать Dashboard
Rename-Item -Path "client\src\pages\admin\Dashboard.tsx" -NewName "Dashboard.old.tsx"
Rename-Item -Path "client\src\pages\admin\Dashboard.professional.tsx" -NewName "Dashboard.tsx"
```

### Для CMD:

```cmd
REM Переименовать Login
ren client\src\pages\Login.tsx Login.old.tsx
ren client\src\pages\Login.professional.tsx Login.tsx

REM Переименовать Dashboard
ren client\src\pages\admin\Dashboard.tsx Dashboard.old.tsx
ren client\src\pages\admin\Dashboard.professional.tsx Dashboard.tsx
```

---

## Шаг 3: Запустите проект

```cmd
cd client
npm run dev
```

---

## ✅ Готово!

Откройте http://localhost:5173 и увидите новый дизайн!

---

## 🔧 Альтернатива: Переименовать вручную

Если команды не работают, переименуйте файлы вручную в проводнике Windows:

### Login:
1. Найдите `client\src\pages\Login.tsx`
2. Переименуйте в `Login.old.tsx`
3. Найдите `client\src\pages\Login.professional.tsx`
4. Переименуйте в `Login.tsx`

### Dashboard:
1. Найдите `client\src\pages\admin\Dashboard.tsx`
2. Переименуйте в `Dashboard.old.tsx`
3. Найдите `client\src\pages\admin\Dashboard.professional.tsx`
4. Переименуйте в `Dashboard.tsx`

---

## 🐛 Если не работает

### Очистите кэш:

```cmd
cd client
rmdir /s /q node_modules\.vite
npm run dev
```

### Жесткая перезагрузка браузера:

- Нажмите `Ctrl + Shift + R` или `Ctrl + F5`

---

**Теперь должно работать!** 🎉
