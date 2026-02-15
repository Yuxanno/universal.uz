# 🌐 API Client - Backend bilan Aloqa

## Maqsad

Frontend dan backend API ga so'rov yuborish uchun konfiguratsiyalangan Axios instance.

## Joylashuv

`client/src/utils/api.ts`

## Asosiy Konfiguratsiya

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});
```

## Interceptors

### Request Interceptor

Har bir so'rovga JWT token qo'shadi.

```typescript
api.interceptors.request.use(config => {
  // Token ni olish (sessionStorage yoki localStorage dan)
  const token = sessionStorage.getItem('token') || 
                localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
```

### Response Interceptor

401 xatolarni handle qiladi (token yaroqsiz).

```typescript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token yaroqsiz - tozalash va login ga yo'naltirish
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Ishlatish

### GET Request
```typescript
import api from '../utils/api';

// Barcha mahsulotlar
const response = await api.get('/products');
const products = response.data;

// Bitta mahsulot
const response = await api.get(`/products/${id}`);
const product = response.data;

// Query parameters bilan
const response = await api.get('/products', {
  params: {
    warehouse: warehouseId,
    search: 'mahsulot'
  }
});
```

### POST Request
```typescript
// Yangi mahsulot yaratish
const response = await api.post('/products', {
  name: 'Yangi mahsulot',
  price: 10000,
  quantity: 100
});

const newProduct = response.data;
```

### PUT Request
```typescript
// Mahsulotni yangilash
const response = await api.put(`/products/${id}`, {
  name: 'Yangilangan nom',
  price: 15000
});

const updatedProduct = response.data;
```

### DELETE Request
```typescript
// Mahsulotni o'chirish
await api.delete(`/products/${id}`);
```

## Xatolarni Handle Qilish

### Try-Catch
```typescript
try {
  const response = await api.get('/products');
  setProducts(response.data);
} catch (error: any) {
  const errorMessage = error.response?.data?.error?.message || 
                       'Xato yuz berdi';
  console.error('Error:', errorMessage);
  showToast(errorMessage, 'error');
}
```

### Error Response Formati
```typescript
{
  success: false,
  error: {
    message: "Mahsulot topilmadi",
    code: "NOT_FOUND"
  }
}
```

### Validatsiya Xatolari
```typescript
{
  success: false,
  error: {
    message: "Validatsiya xatosi",
    code: "VALIDATION_ERROR",
    errors: [
      { field: "name", message: "Ism kiritilmagan" },
      { field: "price", message: "Narx musbat bo'lishi kerak" }
    ]
  }
}
```

## Custom Hook bilan

### useApi Hook
```typescript
import { useState } from 'react';
import api from '../utils/api';

function useApi<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api[method](url, data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 
                          'Xato yuz berdi';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
}

// Ishlatish
function ProductList() {
  const { request, loading, error } = useApi<Product[]>();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await request('get', '/products');
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  
  return <ProductGrid products={products} />;
}
```

## Real Misollar

### Login
```typescript
async function login(phone: string, password: string) {
  try {
    const response = await api.post('/auth/login', { phone, password });
    const { token, user } = response.data;
    
    // Token saqlash
    if (user.role === 'admin') {
      sessionStorage.setItem('token', token);
    } else {
      localStorage.setItem('token', token);
    }
    
    return user;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error?.message || 'Login xatosi'
    );
  }
}
```

### Mahsulot Yaratish
```typescript
async function createProduct(productData: ProductInput) {
  try {
    const response = await api.post('/v2/products', productData);
    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data?.error;
    
    if (errorData?.code === 'VALIDATION_ERROR') {
      // Validatsiya xatolarini ko'rsatish
      errorData.errors.forEach((err: any) => {
        showFieldError(err.field, err.message);
      });
    } else {
      showToast(errorData?.message || 'Xato yuz berdi', 'error');
    }
    
    throw error;
  }
}
```

### Qarz To'lovi
```typescript
async function addDebtPayment(debtId: string, amount: number) {
  try {
    const response = await api.post(`/debts/${debtId}/payment`, {
      amount,
      method: 'cash'
    });
    
    showToast('To\'lov muvaffaqiyatli qo\'shildi', 'success');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error?.message || 
                   'To\'lov qo\'shishda xato';
    showToast(message, 'error');
    throw error;
  }
}
```

## File Upload

### Rasm Yuklash
```typescript
async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.url;
  } catch (error: any) {
    throw new Error('Rasm yuklashda xato');
  }
}
```

## Timeout

### Request Timeout
```typescript
const api = axios.create({
  baseURL: '/api',
  timeout: 10000, // 10 soniya
  headers: { 'Content-Type': 'application/json' }
});
```

## Cancel Request

### AbortController
```typescript
const controller = new AbortController();

try {
  const response = await api.get('/products', {
    signal: controller.signal
  });
} catch (error) {
  if (axios.isCancel(error)) {
    console.log('Request cancelled');
  }
}

// Request ni bekor qilish
controller.abort();
```

## Muhim Eslatmalar

1. **Token Storage**:
   - Admin: sessionStorage (browser yopilganda o'chadi)
   - Kassir/Helper: localStorage (saqlanib qoladi)

2. **Base URL**:
   - Development: `/api` (proxy orqali)
   - Production: `https://api.example.com`

3. **Error Handling**:
   - Har doim try-catch ishlatish
   - Foydalanuvchiga tushunarli xabar ko'rsatish

4. **401 Errors**:
   - Avtomatik login ga yo'naltiradi
   - Token tozalanadi

## Bog'liq Modullar

- `context/AuthContext.tsx` - Login/logout
- `hooks/useToast.tsx` - Xato xabarlarini ko'rsatish
- `config/env.ts` - API URL konfiguratsiyasi

## Best Practices

```typescript
// ✅ To'g'ri - error handling
try {
  const data = await api.get('/products');
  setProducts(data);
} catch (error) {
  showError(error);
}

// ❌ Noto'g'ri - error handling yo'q
const data = await api.get('/products');
setProducts(data);

// ✅ To'g'ri - loading state
setLoading(true);
const data = await api.get('/products');
setLoading(false);

// ❌ Noto'g'ri - loading state yo'q
const data = await api.get('/products');

// ✅ To'g'ri - response data
const response = await api.get('/products');
const products = response.data;

// ❌ Noto'g'ri - to'g'ridan-to'g'ri response
const products = await api.get('/products');
```
