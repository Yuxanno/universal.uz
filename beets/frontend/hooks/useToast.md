# 🔔 useToast Hook - Bildirishnomalar

## Maqsad

Foydalanuvchiga toast (bildirishnoma) xabarlarini ko'rsatish uchun custom React hook.

## Joylashuv

`client/src/hooks/useToast.tsx`

## Funksiyalar

### useToast()

Toast xabarlarini boshqarish uchun hook.

**Qaytaradi:**
```typescript
{
  toasts: ToastProps[],        // Barcha toastlar
  success: (title, message?, duration?) => string,
  error: (title, message?, duration?) => string,
  info: (title, message?, duration?) => string,
  warning: (title, message?, duration?) => string,
  removeToast: (id: string) => void
}
```

## Ishlatish

### Asosiy Ishlatish
```typescript
import { useToast } from '../hooks/useToast';

function MyComponent() {
  const { success, error, info, warning } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      success('Muvaffaqiyatli', 'Ma\'lumot saqlandi');
    } catch (err) {
      error('Xato', 'Ma\'lumot saqlanmadi');
    }
  };

  return <button onClick={handleSave}>Saqlash</button>;
}
```

### Success Toast
```typescript
const { success } = useToast();

// Faqat title
success('Muvaffaqiyatli saqlandi');

// Title va message
success('Muvaffaqiyatli', 'Mahsulot yaratildi');

// Custom duration (ms)
success('Muvaffaqiyatli', 'Ma\'lumot saqlandi', 5000);
```

### Error Toast
```typescript
const { error } = useToast();

// API xatosi
try {
  await api.post('/products', data);
} catch (err: any) {
  const message = err.response?.data?.error?.message || 'Xato yuz berdi';
  error('Xato', message);
}

// Validatsiya xatosi
if (!name) {
  error('Xato', 'Ism kiritilmagan');
  return;
}
```

### Info Toast
```typescript
const { info } = useToast();

// Ma'lumot xabari
info('Ma\'lumot', 'Yangilanish mavjud');

// Yo'riqnoma
info('Eslatma', 'Barcha maydonlarni to\'ldiring');
```

### Warning Toast
```typescript
const { warning } = useToast();

// Ogohlantirish
warning('Ogohlantirish', 'Bu amalni bekor qilib bo\'lmaydi');

// Tasdiqlash kerak
warning('Diqqat', 'Barcha ma\'lumotlar o\'chiriladi');
```

## Toast Turlari

### 1. Success (Muvaffaqiyat)
- **Rang**: Yashil
- **Icon**: Checkmark
- **Ishlatish**: Muvaffaqiyatli operatsiyalar

```typescript
success('Saqlandi', 'Mahsulot muvaffaqiyatli yaratildi');
```

### 2. Error (Xato)
- **Rang**: Qizil
- **Icon**: X
- **Ishlatish**: Xatolar, muvaffaqiyatsiz operatsiyalar

```typescript
error('Xato', 'Mahsulot saqlanmadi');
```

### 3. Info (Ma'lumot)
- **Rang**: Ko'k
- **Icon**: Info
- **Ishlatish**: Umumiy ma'lumotlar, eslatmalar

```typescript
info('Ma\'lumot', 'Yangilanish mavjud');
```

### 4. Warning (Ogohlantirish)
- **Rang**: Sariq
- **Icon**: Warning
- **Ishlatish**: Ogohlantirishlar, tasdiqlash kerak bo'lgan amallar

```typescript
warning('Diqqat', 'Bu amalni bekor qilib bo\'lmaydi');
```

## Duration (Muddat)

Default: 3000ms (3 soniya)

```typescript
// 3 soniya (default)
success('Saqlandi');

// 5 soniya
success('Saqlandi', 'Ma\'lumot saqlandi', 5000);

// 10 soniya
error('Xato', 'Jiddiy xato yuz berdi', 10000);

// Cheksiz (0)
warning('Diqqat', 'Tasdiqlash kerak', 0);
```

## Toast ID

Har bir toast unique ID ga ega:

```typescript
const toastId = success('Saqlandi');

// Keyin o'chirish
removeToast(toastId);
```

## Real Misollar

### Form Saqlash
```typescript
function ProductForm() {
  const { success, error } = useToast();

  const handleSubmit = async (data: ProductInput) => {
    try {
      await api.post('/products', data);
      success('Muvaffaqiyatli', 'Mahsulot yaratildi');
      navigate('/products');
    } catch (err: any) {
      const message = err.response?.data?.error?.message;
      error('Xato', message || 'Mahsulot yaratilmadi');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### O'chirish Tasdiqlash
```typescript
function ProductList() {
  const { success, error, warning } = useToast();

  const handleDelete = async (id: string) => {
    // Ogohlantirish
    warning('Diqqat', 'Mahsulot o\'chirilmoqda...');

    try {
      await api.delete(`/products/${id}`);
      success('O\'chirildi', 'Mahsulot muvaffaqiyatli o\'chirildi');
    } catch (err) {
      error('Xato', 'Mahsulot o\'chirilmadi');
    }
  };

  return <button onClick={() => handleDelete(product.id)}>O'chirish</button>;
}
```

### File Upload
```typescript
function ImageUpload() {
  const { success, error, info } = useToast();

  const handleUpload = async (file: File) => {
    // Ma'lumot
    info('Yuklanmoqda', 'Rasm yuklanmoqda...');

    try {
      const url = await uploadImage(file);
      success('Yuklandi', 'Rasm muvaffaqiyatli yuklandi');
      return url;
    } catch (err) {
      error('Xato', 'Rasm yuklanmadi');
    }
  };

  return <input type="file" onChange={e => handleUpload(e.target.files[0])} />;
}
```

### Validatsiya
```typescript
function LoginForm() {
  const { error } = useToast();

  const handleLogin = async (phone: string, password: string) => {
    // Validatsiya
    if (!phone) {
      error('Xato', 'Telefon raqam kiritilmagan');
      return;
    }

    if (!password) {
      error('Xato', 'Parol kiritilmagan');
      return;
    }

    if (phone.length < 9) {
      error('Xato', 'Telefon raqam noto\'g\'ri');
      return;
    }

    // Login...
  };

  return <form onSubmit={handleLogin}>...</form>;
}
```

## ToastContainer

Toastlarni ko'rsatish uchun ToastContainer kerak:

```typescript
import { ToastContainer } from '../components/ui/ToastContainer';
import { useToast } from '../hooks/useToast';

function App() {
  const { toasts } = useToast();

  return (
    <div>
      {/* App content */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
```

## Muhim Eslatmalar

1. **Duration**: Default 3 soniya, kerak bo'lsa o'zgartirish mumkin
2. **Multiple Toasts**: Bir vaqtda bir nechta toast ko'rsatish mumkin
3. **Auto Remove**: Toast avtomatik o'chadi (duration dan keyin)
4. **Manual Remove**: `removeToast(id)` orqali qo'lda o'chirish mumkin

## Bog'liq Modullar

- `components/ui/Toast.tsx` - Toast komponenti
- `components/ui/ToastContainer.tsx` - Toast container
- `utils/api.ts` - API xatolarini ko'rsatish

## Best Practices

```typescript
// ✅ To'g'ri - aniq xabar
success('Saqlandi', 'Mahsulot muvaffaqiyatli yaratildi');

// ❌ Noto'g'ri - noaniq xabar
success('OK');

// ✅ To'g'ri - error handling
try {
  await saveData();
  success('Saqlandi');
} catch (err: any) {
  error('Xato', err.message);
}

// ❌ Noto'g'ri - error handling yo'q
await saveData();
success('Saqlandi');

// ✅ To'g'ri - validatsiya
if (!name) {
  error('Xato', 'Ism kiritilmagan');
  return;
}

// ❌ Noto'g'ri - validatsiya yo'q
await saveData({ name });
```

## Styling

Toast komponentining ranglari:

```css
/* Success - Yashil */
.toast-success {
  background: #10b981;
  color: white;
}

/* Error - Qizil */
.toast-error {
  background: #ef4444;
  color: white;
}

/* Info - Ko'k */
.toast-info {
  background: #3b82f6;
  color: white;
}

/* Warning - Sariq */
.toast-warning {
  background: #f59e0b;
  color: white;
}
```

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast', () => {
  it('should add success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Test', 'Success message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('should remove toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      toastId = result.current.success('Test');
    });

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
```
